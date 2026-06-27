import * as cheerio from 'cheerio';
import { ScrapedPage } from '../types';

export class CrawlerParser {
    /**
     * 解析 Sitemap XML，支持识别嵌套的 sitemapindex
     */
    static extractSitemapLocs(xmlStr: string): { type: 'sitemap' | 'sitemapindex'; urls: string[] } {
        const $ = cheerio.load(xmlStr, { xmlMode: true });

        const sitemapLocs = $('sitemapindex sitemap loc, sitemapindex loc').map((_, el) => $(el).text().trim()).get().filter(Boolean);
        if (sitemapLocs.length > 0) {
            return { type: 'sitemapindex', urls: sitemapLocs };
        }

        const urls = $('urlset url loc, urlset loc').map((_, el) => $(el).text().trim()).get().filter(Boolean);
        return { type: 'sitemap', urls };
    }

    /**
     * 提取页面内的链接并分类为同源和外链
     */
    static extractLinkTypes(html: string, domain: string, sourceUrl: string): { internalUrls: string[], externalUrls: string[] } {
        return this.linkTypesFrom(cheerio.load(html), domain, sourceUrl);
    }

    /** $-based core (avoids re-parsing HTML; shared by extractPageData) */
    private static linkTypesFrom($: cheerio.CheerioAPI, domain: string, sourceUrl: string): { internalUrls: string[], externalUrls: string[] } {
        const internalUrls: string[] = [];
        const externalUrls: string[] = [];
        const domainObj = new URL(domain);

        $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (!href) return;
            try {
                // Ignore mailto, tel, javascript links
                if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

                const absoluteUrl = new URL(href, sourceUrl).href;
                const absoluteHostname = new URL(absoluteUrl).hostname.replace(/^www\./, '');
                const targetHostname = domainObj.hostname.replace(/^www\./, '');

                if (absoluteHostname === targetHostname || absoluteHostname.endsWith(`.${targetHostname}`)) {
                    internalUrls.push(absoluteUrl.split('#')[0]);
                } else {
                    externalUrls.push(absoluteUrl.split('#')[0]);
                }
            } catch (e) { }
        });
        return {
            internalUrls: Array.from(new Set(internalUrls)),
            externalUrls: Array.from(new Set(externalUrls))
        };
    }

    /**
     * 估算词数：支持中英文混合内容
     * CJK 字符: 1 字符 ≈ 0.6 英文词
     * 西文: 按空格分词计数
     */
    static estimateWordCount(text: string): number {
        if (!text) return 0;
        // 提取并计数 CJK 字符（汉字、日文、韩文）
        const cjkChars = (text.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
        // 提取并计数西文词汇（将 CJK 替换为空格后按空格分割）
        const latinWords = text.replace(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g, ' ')
                               .split(/\s+/)
                               .filter(Boolean).length;
        
        return Math.round(cjkChars * 0.6 + latinWords);
    }

    /**
     * Task 1.2.1: 解析 JSON-LD 类型
     * 容错：@graph/多 script/脏 JSON；失败按无
     */
    static extractSchemaTypes(html: string): string[] {
        return this.schemaTypesFrom(cheerio.load(html));
    }

    /** $-based core (avoids re-parsing HTML; shared by extractPageData) */
    private static schemaTypesFrom($: cheerio.CheerioAPI): string[] {
        const types: string[] = [];

        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const raw = $(el).html() || '';
                const json = JSON.parse(raw);

                const extractTypes = (obj: any) => {
                    if (!obj || typeof obj !== 'object') return;
                    if (Array.isArray(obj)) {
                        obj.forEach(extractTypes);
                        return;
                    }
                    if (obj['@graph'] && Array.isArray(obj['@graph'])) {
                        obj['@graph'].forEach(extractTypes);
                    }
                    if (obj['@type']) {
                        const t = obj['@type'];
                        if (Array.isArray(t)) {
                            t.forEach((v: string) => { if (typeof v === 'string') types.push(v); });
                        } else if (typeof t === 'string') {
                            types.push(t);
                        }
                    }
                };

                extractTypes(json);
            } catch (e) {
                // 脏 JSON 容错：失败按无计
            }
        });

        return [...new Set(types)];
    }

    /**
     * Task 1.2.4: 提取时效信号
     * schema 优先，meta 兜底
     */
    static extractDates(html: string): boolean {
        return this.hasDatesFrom(cheerio.load(html));
    }

    /** $-based core (avoids re-parsing HTML; shared by extractPageData) */
    private static hasDatesFrom($: cheerio.CheerioAPI): boolean {
        // Schema.org JSON-LD: datePublished / dateModified
        const scripts = $('script[type="application/ld+json"]').toArray();
        for (const el of scripts) {
            try {
                const raw = $(el).html() || '';
                const json = JSON.parse(raw);
                const checkDates = (obj: any): boolean => {
                    if (!obj || typeof obj !== 'object') return false;
                    if (Array.isArray(obj)) return obj.some(checkDates);
                    if (obj['@graph']) return checkDates(obj['@graph']);
                    return !!(obj.datePublished || obj.dateModified);
                };
                if (checkDates(json)) return true;
            } catch (e) { }
        }

        // Meta fallback
        const metaDate = $('meta[name="date"], meta[name="datePublished"], meta[name="article:published_time"], meta[property="article:published_time"]').attr('content');
        if (metaDate) return true;

        // time element
        if ($('time[datetime]').length > 0) return true;

        return false;
    }

    /**
     * Task 1.2.5: 提取作者信号
     * author schema 或 byline
     */
    static extractAuthor(html: string): boolean {
        return this.hasAuthorFrom(cheerio.load(html));
    }

    /** $-based core (avoids re-parsing HTML; shared by extractPageData) */
    private static hasAuthorFrom($: cheerio.CheerioAPI): boolean {
        // JSON-LD author
        const scripts = $('script[type="application/ld+json"]').toArray();
        for (const el of scripts) {
            try {
                const raw = $(el).html() || '';
                const json = JSON.parse(raw);
                const checkAuthor = (obj: any): boolean => {
                    if (!obj || typeof obj !== 'object') return false;
                    if (Array.isArray(obj)) return obj.some(checkAuthor);
                    if (obj['@graph']) return checkAuthor(obj['@graph']);
                    return !!(obj.author);
                };
                if (checkAuthor(json)) return true;
            } catch (e) { }
        }

        // Meta author
        if ($('meta[name="author"]').attr('content')) return true;

        // Common byline patterns
        if ($('[class*="author"], [rel="author"], [itemprop="author"]').length > 0) return true;

        return false;
    }

    /**
     * Task 1.2.3: 检测问句式标题
     * h2/h3 含 ? 或 What/How/Why/When/Which (中英)
     */
    static countQuestionHeadings($: cheerio.CheerioAPI): number {
        const QUESTION_WORDS = /^(what|how|why|when|which|who|where|can|does|is|are|do|will|should|could|would)\b/i;
        // 中文疑问词开头
        const CHINESE_QUESTION = /^(为什么|怎么|如何|哪些|什么|哪个|哪里|几|多少|是否|能否|有没有|可以吗|怎样)/;

        let count = 0;
        $('h2, h3').each((_, el) => {
            const text = $(el).text().trim();
            if (text.includes('?') || text.includes('？') || QUESTION_WORDS.test(text) || CHINESE_QUESTION.test(text)) {
                count++;
            }
        });
        return count;
    }

    /**
     * 提取 <html lang> 并规范化为 2 字母语言代码（如 'en'、'zh'）。
     * 不依赖汉字比例等语言相关启发式。
     */
    static extractHtmlLang(html: string): string | undefined {
        const $ = cheerio.load(html);
        const raw = $('html').attr('lang') || '';
        if (!raw.trim()) return undefined;
        const lang = raw.split(/[-_]/)[0].toLowerCase().trim();
        return lang.length >= 2 ? lang : undefined;
    }

    /**
     * 从页面 HTML 提取纯文本摘要（去除脚本/样式后截断）。
     * 用于 DNA 提取的 LLM 上下文，只在业务页面上调用。
     */
    static extractBodyText(html: string, maxChars: number = 2500): string {
        const $ = cheerio.load(html);
        $('script, style, noscript, nav, header, footer, [role="banner"], [role="navigation"]').remove();
        const text = $('main, article, [role="main"], body')
            .first()
            .text()
            .replace(/\s+/g, ' ')
            .trim();
        return text.slice(0, maxChars);
    }

    /**
     * 从 HTML 中提取 SEO 和内容指标（含 GEO 就绪度字段）
     */
    static extractPageData(html: string, url: string, loadTime: number, status: number): ScrapedPage {
        const $ = cheerio.load(html); // single parse — shared by all extractors below
        const domainHostname = new URL(url).hostname;

        // 提取内链和外链
        const { internalUrls, externalUrls } = this.linkTypesFrom($, `https://${domainHostname}`, url);
        const internalLinks = internalUrls.slice(0, 50);
        const externalLinks = externalUrls.slice(0, 50);

        // 提取 Headers
        const h1Nodes = $('h1');
        const h1Count = h1Nodes.length;
        const h1 = h1Nodes.first().text().trim() || '';
        const h2 = $('h2').map((_, el) => $(el).text().trim()).get().filter(t => t.length > 0).slice(0, 10);
        const h3 = $('h3').map((_, el) => $(el).text().trim()).get().filter(t => t.length > 0).slice(0, 10);

        // GEO extractors run on the shared $ BEFORE scripts are stripped below.
        // Task 1.2.1 — JSON-LD 类型
        const schemaTypes = this.schemaTypesFrom($);

        // GEO: Task 1.2.4 — 时效
        const hasDates = this.hasDatesFrom($);

        // GEO: Task 1.2.5 — 作者
        const hasAuthor = this.hasAuthorFrom($);

        // GEO: Task 1.2.3 — 问句式标题（在 script/style 移除前）
        const questionHeadingCount = this.countQuestionHeadings($);

        // GEO: Task 1.2.2 — 列表/表格计数（在 script/style 移除前）
        const listCount = $('ul, ol').length;
        const tableCount = $('table').length;

        // 提取 <html lang>
        const lang = $('html').attr('lang')?.split(/[-_]/)[0]?.toLowerCase().trim() || undefined;

        // 计算词数（去除脚本/样式内容）
        $('script, style, noscript').remove();
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        const wordCount = this.estimateWordCount(bodyText);

        // GEO: Task 1.2.6 — FAQPage 由 schemaTypes 派生
        const hasFaq = schemaTypes.some(t => t === 'FAQPage');

        return {
            url,
            title: $('title').text().trim() || '',
            description: $('meta[name="description"]').attr('content')?.trim() || '',
            h1,
            h1Count,
            h2,
            h3,
            loadTime,
            status,
            wordCount,
            internalLinks,
            externalLinks,
            canonicalUrl: $('link[rel="canonical"]').attr('href') || null,
            hasOgImage: !!$('meta[property="og:image"]').attr('content'),
            hasViewportMeta: !!$('meta[name="viewport"]').length,
            hasStructuredData: schemaTypes.length > 0 || !!$('script[type="application/ld+json"]').length,
            lang,
            // GEO fields
            schemaTypes,
            listCount,
            tableCount,
            questionHeadingCount,
            hasDates,
            hasAuthor,
            hasFaq,
        };
    }
}
