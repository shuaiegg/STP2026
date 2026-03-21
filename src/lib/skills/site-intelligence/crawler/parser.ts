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
        const $ = cheerio.load(html);
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
     * 从 HTML 中提取 SEO 和内容指标
     */
    static extractPageData(html: string, url: string, loadTime: number, status: number): ScrapedPage {
        const $ = cheerio.load(html);
        const domainHostname = new URL(url).hostname;

        // 提取内链和外链
        const { internalUrls, externalUrls } = this.extractLinkTypes(html, `https://${domainHostname}`, url);
        const internalLinks = internalUrls.slice(0, 50);
        const externalLinks = externalUrls.slice(0, 50);

        // 提取 Headers
        const h1Nodes = $('h1');
        const h1Count = h1Nodes.length;
        const h1 = h1Nodes.first().text().trim() || '';
        const h2 = $('h2').map((_, el) => $(el).text().trim()).get().filter(t => t.length > 0).slice(0, 10);
        const h3 = $('h3').map((_, el) => $(el).text().trim()).get().filter(t => t.length > 0).slice(0, 10);

        // 计算词数（去除脚本/样式内容）
        $('script, style, noscript').remove();
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        const wordCount = bodyText ? bodyText.split(' ').length : 0;

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
            hasStructuredData: !!$('script[type="application/ld+json"]').length,
        };
    }
}
