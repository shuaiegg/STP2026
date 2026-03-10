import { ScrapedPage, SiteAuditResult, AuditProgressEvent } from './types';
import { fetchHtml } from './crawler/fetcher';
import { CrawlerParser } from './crawler/parser';
import { CrawlerStrategy } from './crawler/strategy';
import { getDefaultProvider } from '@/lib/skills/providers';

/**
 * Site Intelligence Crawler Service (Façade)
 * This class abstracts the complexities of the network fetching, strategy picking, and HTML parsing modules,
 * exposing a unified, simple API for other backend systems to trigger audits and scans.
 */
export class CrawlerService {
  /**
   * 智能采样：从大量 URL 中抽取具有深度分布代表性的样本
   */
  static sampleUrls(urls: string[], limit: number): string[] {
    if (urls.length <= limit) return urls;

    // 1. 随机打乱，避免字母序偏差
    const shuffled = [...urls].sort(() => Math.random() - 0.5);

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
  static async discoverUrls(domain: string): Promise<string[]> {
    return CrawlerStrategy.discoverUrls(domain);
  }

  /**
   * 抓取单页数据 (Facade for fetchHtml + Parser)
   */
  static async scrapePage(url: string): Promise<ScrapedPage | null> {
    const { html, loadTime, status } = await fetchHtml(url);
    if (!html) return null;
    return CrawlerParser.extractPageData(html, url, loadTime, status);
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

    const isProxy = !!process.env.CRAWLER_PROXY_HOST;
    // 初始并发建议：代理环境下设为 2，非代理设为 5
    let currentLimit = isProxy ? 2 : limit;

    const queue = [...urls];
    const activeTasks = new Set<Promise<void>>();

    return new Promise((resolve) => {
      const next = async () => {
        if (queue.length === 0 && activeTasks.size === 0) {
          resolve(results);
          return;
        }

        while (queue.length > 0 && activeTasks.size < currentLimit) {
          const url = queue.shift()!;

          // 并发间的微小抖动 (400ms - 800ms)
          if (isProxy && activeTasks.size > 0) {
            await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
          }

          const task = (async () => {
            try {
              const page = await this.scrapePage(url);
              if (page) {
                results.push(page);
                scanned++;
                onBatchDone?.(scanned, total, [page]);
              }
            } catch (err) {
              errorCount++;
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
    return await this.discoverUrls(this.normalizeDomain(domain));
  }

  /**
   * 执行全站审计（标准版）
   */
  static async performFullAudit(domain: string): Promise<SiteAuditResult> {
    const normalized = this.normalizeDomain(domain);
    const urls = await this.discoverUrls(normalized);
    const targetUrls = this.sampleUrls(urls, 100);

    const pages = await this.crawlWithConcurrency(targetUrls, 5);

    const averageLoadTime =
      pages.length > 0
        ? pages.reduce((sum, p) => sum + p.loadTime, 0) / pages.length
        : 0;

    return {
      domain: normalized,
      sitemapUrl: `${normalized}/sitemap.xml`,
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
    const urls = await this.discoverUrls(normalized);

    // 立即通知已发现的所有链接（骨架图）
    onProgress({ type: 'discovery', urls });

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
      pageCount: urls.length,
      allUrls: urls,
      pages: await this.clusterPages(pages),
      averageLoadTime,
    };
  }

  /**
   * 使用 LLM 对审计后的页面进行语义聚类 (Semantic Clustering)
   */
  static async clusterPages(pages: ScrapedPage[]): Promise<ScrapedPage[]> {
    if (pages.length === 0) return pages;

    try {
      const aiProvider = await getDefaultProvider();
      const defaultModel = aiProvider.getDefaultModel();

      const pageData = pages.map((p, i) => ({
        id: i,
        title: p.title,
        url: p.url,
      }));

      const prompt = `
You are an expert SEO strategist. Analyze the following list of pages from a website.
Your goal is to group these pages into 5-10 "Semantic Topic Clusters" that represent the core business value, product features, or content strategy (e.g. "Marketing Automation", "E-commerce Funnels", "SaaS Pricing Models").

CRITICAL INSTRUCTIONS:
1. IGNORE system pages, legal boilerplates, and administrative links (e.g., Privacy Policy, Terms of Service, Contact Us, Login/Logout, My Account).
2. If a page is clearly a system/legal boilerplate, assign it the topic "System/Boilerplate".
3. Focus on extracting semantic topics that would be valuable for competitive analysis and content planning.
4. Each page must be assigned to exactly one cluster.

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

      if (response.content) {
        const match = response.content.match(/\{[\s\S]*\}/);
        if (match) {
          const mapping = JSON.parse(match[0]);
          return pages.map((p, i) => ({
            ...p,
            topic: mapping[i.toString()] || 'Uncategorized',
          }));
        }
      }
    } catch (error) {
      console.error('[Crawler Service] Clustering failed:', error);
    }

    return pages;
  }
}
