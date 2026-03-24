import { ScrapedPage, SiteAuditResult, AuditProgressEvent } from './types';
import { fetchHtml } from './crawler/fetcher';
import { CrawlerParser } from './crawler/parser';
import { CrawlerStrategy } from './crawler/strategy';
import { getDefaultProvider } from '@/lib/skills/providers';
import { isBlacklistedTopic } from './constants';
import { BusinessDna } from './types';

export class CrawlerCircuitBreakerError extends Error {
  constructor(message = '站点无法访问，已停止扫描以保护您的积分') {
    super(message);
    this.name = 'CrawlerCircuitBreakerError';
  }
}

/**
 * Site Intelligence Crawler Service (Façade)
 * This class abstracts the complexities of the network fetching, strategy picking, and HTML parsing modules,
 * exposing a unified, simple API for other backend systems to trigger audits and scans.
 */
export class CrawlerService {
  /**
   * Deterministic hash for URL string (djb2)
   */
  static hashUrl(url: string): number {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  /**
   * 智能采样：从大量 URL 中抽取具有深度分布代表性的样本
   */
  static sampleUrls(urls: string[], limit: number): string[] {
    if (urls.length <= limit) return urls;

    // 1. 确定性排序，用哈希代替随机，确保两次审计采样结果一致
    const shuffled = [...urls].sort((a, b) => this.hashUrl(a) - this.hashUrl(b));

    // 2. 按路径深度分组
    const depthGroups: Record<number, string[]> = {};
    shuffled.forEach(url => {
      try {
        const path = new URL(url).pathname.replace(/\/$/, '');
        const depth = path === '' ? 0 : path.split('/').length - 1;
        if (!depthGroups[depth]) depthGroups[depth] = [];
        depthGroups[depth].push(url);
      } catch {
        if (!depthGroups[0]) depthGroups[0] = [];
        depthGroups[0].push(url);
      }
    });

    const depths = Object.keys(depthGroups).map(Number).sort((a, b) => a - b);
    const result: string[] = [];
    const currentIndexes = depths.map(() => 0);

    // 3. 轮询抽取，确保每个深度都有机会入选
    while (result.length < limit) {
      let added = false;
      for (let i = 0; i < depths.length; i++) {
        const group = depthGroups[depths[i]];
        if (currentIndexes[i] < group.length) {
          result.push(group[currentIndexes[i]]);
          currentIndexes[i]++;
          added = true;
          if (result.length >= limit) break;
        }
      }
      if (!added) break;
    }
    return result;
  }

  /**
   * 规范化 domain 输入：自动补 https://，去除尾部斜杠
   */
  static normalizeDomain(input: string): string {
    let domain = input.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(domain)) {
      domain = `https://${domain}`;
    }
    return domain;
  }

  /**
   * Delegates URL discovery to CrawlerStrategy
   */
  static async discoverUrls(domain: string): Promise<{ urls: string[]; sitemapFound: boolean }> {
    return CrawlerStrategy.discoverUrls(domain);
  }

  /**
   * 抓取单页数据 (Facade for fetchHtml + Parser)
   */
  static async scrapePage(url: string): Promise<{ page: ScrapedPage | null, status: number, error?: string }> {
    const { html, loadTime, status, error } = await fetchHtml(url);
    if (!html) return { page: null, status, error };
    const page = CrawlerParser.extractPageData(html, url, loadTime, status);
    return { page, status, error };
  }

  /**
   * 带限流与自动降级的 Worker Pool 并发爬取
   */
  static async crawlWithConcurrency(
    urls: string[],
    limit = 5,
    onBatchDone?: (scanned: number, total: number, pages: ScrapedPage[]) => void
  ): Promise<ScrapedPage[]> {
    const results: ScrapedPage[] = [];
    const total = urls.length;
    let scanned = 0;
    let errorCount = 0;
    let consecutiveFailures = 0;
    let isTerminated = false;
    let terminationError: any = null;

    const isWebsharePool = !!process.env.WEBSHARE_API_KEY;
    const isLocalProxy = !!process.env.CRAWLER_PROXY_HOST && !isWebsharePool;

    // 初始并发建议：Webshare 池设为 8，单代理设为 2，直接连接设为 5
    let currentLimit = isWebsharePool ? 8 : isLocalProxy ? 2 : 5;
    const useJitter = isLocalProxy;

    const queue = [...urls];
    const activeTasks = new Set<Promise<void>>();

    return new Promise((resolve, reject) => {
      const next = async () => {
        if (isTerminated) {
          if (activeTasks.size === 0) {
            reject(terminationError);
          }
          return;
        }

        if (queue.length === 0 && activeTasks.size === 0) {
          resolve(results);
          return;
        }

        while (queue.length > 0 && activeTasks.size < currentLimit && !isTerminated) {
          const url = queue.shift()!;

          // 并发间的微小抖动 (400ms - 800ms) - 仅单代理模式加抖动
          if (useJitter && activeTasks.size > 0) {
            await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
          }

          if (isTerminated) return;

          const task = (async () => {
            try {
              const { page, status, error } = await this.scrapePage(url);
              if (page) {
                results.push(page);
                scanned++;
                consecutiveFailures = 0; // 重置连续失败计数器
                onBatchDone?.(scanned, total, [page]);
              } else {
                // 如果没有返回页面数据，判断是否为 4xx
                if (status >= 400 && status < 500) {
                  // 4xx 不计入熔断，但计入总错误数
                  errorCount++;
                } else {
                  // 网络错误/超时/5xx 计入熔断
                  errorCount++;
                  consecutiveFailures++;
                }
              }

              if (consecutiveFailures >= 5) {
                throw new CrawlerCircuitBreakerError();
              }
            } catch (err) {
              if (err instanceof CrawlerCircuitBreakerError) {
                isTerminated = true;
                terminationError = err;
              } else {
                errorCount++;
                // 这里的 catch 捕获 scrapePage 抛出的异常（如果有的话）
                consecutiveFailures++;
                if (consecutiveFailures >= 5) {
                  isTerminated = true;
                  terminationError = new CrawlerCircuitBreakerError();
                }
              }

              // 如果错误过多，动态降低并发至 1 (退避策略)
              if (errorCount > 2 && currentLimit > 1) {
                console.warn(`[Crawler Service] Multiple errors detected. Throttling concurrency to 1.`);
                currentLimit = 1;
              }
            }
          })().finally(() => {
            activeTasks.delete(task);
            next();
          });

          activeTasks.add(task);
        }
      };

      next();
    });
  }

  /**
   * 极速扫描：仅获取 URL 列表用于快速星图渲染
   */
  static async fastScan(domain: string): Promise<string[]> {
    const { urls } = await this.discoverUrls(this.normalizeDomain(domain));
    return urls;
  }

  /**
   * 执行全站审计（标准版）
   */
  static async performFullAudit(domain: string): Promise<SiteAuditResult> {
    const normalized = this.normalizeDomain(domain);
    const { urls, sitemapFound } = await this.discoverUrls(normalized);
    const targetUrls = this.sampleUrls(urls, 100);

    const pages = await this.crawlWithConcurrency(targetUrls, 5);

    const averageLoadTime =
      pages.length > 0
        ? pages.reduce((sum, p) => sum + p.loadTime, 0) / pages.length
        : 0;

    return {
      domain: normalized,
      sitemapUrl: `${normalized}/sitemap.xml`,
      sitemapFound,
      pageCount: urls.length,
      allUrls: urls,
      pages: await this.clusterPages(pages),
      averageLoadTime,
    };
  }

  /**
   * 带进度回调的全站审计（用于 SSE 流式端点）
   */
  static async performFullAuditWithProgress(
    domain: string,
    onProgress: (event: AuditProgressEvent) => void
  ): Promise<SiteAuditResult> {
    const normalized = this.normalizeDomain(domain);
    const { urls, sitemapFound } = await this.discoverUrls(normalized);

    // 立即通知已发现的所有链接（骨架图）
    onProgress({ type: 'discovery', urls, sitemapFound });

    // Extract Business DNA in the background
    let businessDna: BusinessDna | undefined;

    // We try to find the homepage and an about page
    const homeUrl = urls.find(u => u === normalized || u === `${normalized}/`) || urls[0];
    const aboutUrl = urls.find(u => u.toLowerCase().includes('/about') || u.toLowerCase().includes('about-us'));

    // Fire off the DNA extraction asynchronously so it doesn't block the crawl startup
    this.extractBusinessDna(homeUrl, aboutUrl).then(dna => {
      if (dna) {
        businessDna = dna;
        onProgress({ type: 'dna_extracted', dna });
      }
    }).catch(err => {
      console.error('[Crawler Service] Failed to extract Business DNA:', err);
    });

    const targetUrls = this.sampleUrls(urls, 100);
    const totalCount = urls.length; // 实际发现的总数
    const scanLimit = targetUrls.length; // 本次实际抓取的限制数

    const pages = await this.crawlWithConcurrency(
      targetUrls,
      5,
      (scanned, _, batchPages) => {
        batchPages.forEach(page => {
          onProgress({ type: 'progress', scanned, total: scanLimit, page });
        });
      }
    );

    const averageLoadTime =
      pages.length > 0
        ? pages.reduce((sum, p) => sum + p.loadTime, 0) / pages.length
        : 0;

    return {
      domain: normalized,
      sitemapUrl: `${normalized}/sitemap.xml`,
      sitemapFound,
      pageCount: urls.length,
      allUrls: urls,
      pages: await this.clusterPages(pages),
      averageLoadTime,
      businessDna
    };
  }

  /**
   * Reads the homepage and about page to extract core business context using LLM
   */
  static async extractBusinessDna(homeUrl: string, aboutUrl?: string): Promise<BusinessDna | null> {
    try {
      const { page: homePage } = await this.scrapePage(homeUrl);
      let aboutPage = null;
      if (aboutUrl) {
        const { page } = await this.scrapePage(aboutUrl);
        aboutPage = page;
      }

      if (!homePage && !aboutPage) return null;

      const aiProvider = await getDefaultProvider();
      const defaultModel = aiProvider.getDefaultModel();

      const combinedText = `
      Homepage Content:
      Title: ${homePage?.title || ''}
      Description: ${homePage?.description || ''}
      H1: ${homePage?.h1 || ''}
      H2s: ${homePage?.h2.slice(0, 5).join(', ') || ''}

      About Page Content:
      Title: ${aboutPage?.title || ''}
      Description: ${aboutPage?.description || ''}
      H1: ${aboutPage?.h1 || ''}
      H2s: ${aboutPage?.h2.slice(0, 5).join(', ') || ''}
      `;

      const prompt = `
      You are an expert Business Strategist and Product Marketing Manager.
      Analyze the provided website content (Homepage and About page) and extract the core "Business DNA" for this company.

      CRITICAL INSTRUCTIONS:
      Return YOUR ANALYSIS as a strict JSON object with EXACTLY these four keys. Do not include markdown formatting or extra text.
      1. "coreOfferings": Array of strings (What are the 2-4 main products or services they sell?)
      2. "targetAudience": Array of strings (Who are the 2-4 specific types of customers they are targeting?)
      3. "painPoints": Array of strings (What are the 2-4 main customer problems they solve?)
      4. "brandTone": String (A short 3-5 word description of their brand voice, e.g., "Professional B2B Software", "Playful Consumer E-commerce")

      Website Content to analyze:
      ${combinedText}
      `.trim();

      const response = await aiProvider.generateContent(prompt, {
        model: defaultModel.id,
        temperature: 0.1,
      });

      if (response.content) {
        const match = response.content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return {
            coreOfferings: Array.isArray(parsed.coreOfferings) ? parsed.coreOfferings : [],
            targetAudience: Array.isArray(parsed.targetAudience) ? parsed.targetAudience : [],
            painPoints: Array.isArray(parsed.painPoints) ? parsed.painPoints : [],
            brandTone: parsed.brandTone || 'Professional',
          };
        }
      }
    } catch (error) {
      console.error('[Crawler Service] Business DNA extraction failed:', error);
    }

    return null;
  }

  /**
   * 使用 LLM 对审计后的页面进行语义聚类 (Semantic Clustering)
   */
  static async clusterPages(pages: ScrapedPage[]): Promise<ScrapedPage[]> {
    if (pages.length === 0) return pages;

    try {
      const aiProvider = await getDefaultProvider();
      const defaultModel = aiProvider.getDefaultModel();

      // 1. 预过滤：排除黑名单中的 boilerplate 页面（登录、法律条款等）
      const meaningfulPages = pages.filter(p => !isBlacklistedTopic(new URL(p.url).pathname));
      const boilerplatePages = pages.filter(p => isBlacklistedTopic(new URL(p.url).pathname));

      if (meaningfulPages.length === 0) {
        return pages.map(p => ({ ...p, topic: 'System/Boilerplate' }));
      }

      const pageData = meaningfulPages.map((p, i) => ({
        id: i,
        title: p.title,
        url: p.url,
      }));

      const prompt = `
You are an expert SEO strategist. Analyze the following list of pages from a website.
Your goal is to group these pages into 5-10 "Semantic Topic Clusters" that represent the core business value, product features, or content strategy (e.g. "Marketing Automation", "E-commerce Funnels", "SaaS Pricing Models").

CRITICAL INSTRUCTIONS:
1. Focus on extracting semantic topics that would be valuable for competitive analysis and content planning.
2. Each page must be assigned to exactly one cluster.

Pages List:
${JSON.stringify(pageData, null, 2)}

Return ONLY a JSON object mapping the index (as a string) to a topic name:
{
  "0": "Topic A",
  "1": "Topic B",
  ...
}
Do NOT include markdown formatting or extra text.
      `.trim();

      const response = await aiProvider.generateContent(prompt, {
        model: defaultModel.id,
        temperature: 0.1,
      });

      let mapping: Record<string, string> = {};
      if (response.content) {
        const match = response.content.match(/\{[\s\S]*\}/);
        if (match) {
          mapping = JSON.parse(match[0]);
        }
      }

      // 2. 合并结果：meaningfulPages 使用 LLM 映射，boilerplatePages 直接归类
      const clusteredMeaningful = meaningfulPages.map((p, i) => ({
        ...p,
        topic: mapping[i.toString()] || 'Uncategorized',
      }));

      const clusteredBoilerplate = boilerplatePages.map(p => ({
        ...p,
        topic: 'System/Boilerplate',
      }));

      // 保持原始顺序或重新组合。这里我们直接组合即可，顺序在前端渲染时通常不敏感
      return [...clusteredMeaningful, ...clusteredBoilerplate];

    } catch (error) {
      console.error('[Crawler Service] Clustering failed:', error);
    }

    return pages;
  }
}
