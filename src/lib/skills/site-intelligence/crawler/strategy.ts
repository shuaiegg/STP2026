import { fetchHtml } from './fetcher';
import { CrawlerParser } from './parser';

export class CrawlerStrategy {
    /**
     * 发现页面的主入口：Sitemap优先，Spider兜底
     */
    static async discoverUrls(domain: string): Promise<{ urls: string[]; sitemapFound: boolean }> {
        console.log(`[Crawler] Discovering URLs for ${domain}...`);
        let urls = await this.crawlSitemap(domain);
        let sitemapFound = urls.length >= 2;

        if (!sitemapFound) {
            console.log(`[Crawler] Sitemap found only ${urls.length} URLs. Falling back to 2-level Spider Mode...`);
            const spiderUrls = await this.spiderCrawl(domain, 2);
            // 合并并去重
            const allUrls = Array.from(new Set([...urls, ...spiderUrls]));
            return { urls: allUrls, sitemapFound: false };
        }
        return { urls, sitemapFound: true };
    }

    /**
     * 智能探测域名的各种常见Sitemap产出格式
     */
    static async crawlSitemap(domain: string): Promise<string[]> {
        const candidates = [
            `${domain}/sitemap.xml`,
            `${domain}/sitemap_index.xml`,
            `${domain}/sitemap-index.xml`,
            `${domain}/sitemap/sitemap.xml`,
        ];

        for (const sitemapUrl of candidates) {
            try {
                const { html: xmlStr, status, error } = await fetchHtml(sitemapUrl, 10000);
                if (error) {
                    console.warn(`[Crawler Strategy] Failed to fetch ${sitemapUrl}: ${error} (Status: ${status})`);
                    continue;
                }
                if (!xmlStr) continue;

                // 简单的初步有效性检测以避免误入HTML 404页
                if (!xmlStr.includes('<urlset') && !xmlStr.includes('<sitemapindex')) {
                    console.log(`[Crawler Strategy] Skip ${sitemapUrl} - not a valid sitemap XML structure.`);
                    continue;
                }

                const { type, urls } = CrawlerParser.extractSitemapLocs(xmlStr);

                if (type === 'sitemapindex') {
                    console.log(`[Crawler] Found sitemapindex at ${sitemapUrl} with ${urls.length} child sitemaps`);
                    const allUrls: string[] = [];
                    // 防止索引内成百上千张表卡死，限制取 5 张表
                    const childResults = await Promise.allSettled(
                        urls.slice(0, 5).map(async childUrl => {
                            const childRes = await fetchHtml(childUrl, 10000);
                            if (childRes.error) {
                                console.warn(`[Crawler Strategy] Failed to fetch child sitemap ${childUrl}: ${childRes.error}`);
                                return [];
                            }
                            return CrawlerParser.extractSitemapLocs(childRes.html).urls;
                        })
                    );
                    childResults.forEach(r => {
                        if (r.status === 'fulfilled') allUrls.push(...r.value);
                    });
                    if (allUrls.length > 0) return Array.from(new Set(allUrls));
                }

                if (urls.length > 0) {
                    console.log(`[Crawler] Found ${urls.length} URLs in ${sitemapUrl}`);
                    return urls;
                }
            } catch (err: any) {
                console.error(`[Crawler Strategy] Unexpected error processing ${sitemapUrl}:`, err.message);
            }
        }
        console.warn(`[Crawler] No valid sitemap discovered for ${domain}`);
        return [];
    }

    /**
     * 应急探测：广度遍历提取同源超链接的 Spider
     */
    static async spiderCrawl(domain: string, depth: number): Promise<string[]> {
        const visited = new Set<string>();
        let queue = [domain];
        visited.add(domain);

        for (let d = 0; d < depth; d++) {
            const nextQueue: string[] = [];
            const layerLimit = 30; // 每层限制处理量避免请求爆炸

            const batchResults = await Promise.allSettled(
                queue.map(async url => {
                    const { html } = await fetchHtml(url);
                    if (!html) return [];
                    const { internalUrls } = CrawlerParser.extractLinkTypes(html, domain, url);
                    return internalUrls;
                })
            );

            batchResults.forEach(r => {
                if (r.status === 'fulfilled') {
                    r.value.forEach(u => {
                        if (!visited.has(u)) {
                            visited.add(u);
                            nextQueue.push(u);
                        }
                    });
                }
            });

            queue = nextQueue.slice(0, layerLimit);
            if (queue.length === 0) break;
        }

        const result = Array.from(visited);
        console.log(`[Crawler] Spider crawl found ${result.length} URLs (depth=${depth})`);
        return result;
    }
}
