import { DataForSEOClient } from '../../../external/dataforseo';
import { SERPAnalyzer } from '../../../external/serp-analyzer';
import { SkeletonExtractor } from '../../../external/skeleton-extractor';
import { IntelligenceContext } from './types';

export class IntelligenceEngine {
    /**
     * Gathers intelligence. Supports 'discovery' (fast) and 'deep' (full analysis).
     * @param url Optional target domain for site: search (internal linking)
     */
    static async gather(keywords: string, location: string = 'United States', mode: 'discovery' | 'deep' = 'deep', url?: string): Promise<IntelligenceContext> {
        console.log(`🧠 [IntelligenceEngine] Gathering data (${mode}) for: ${keywords} in ${location}`);

        const context: IntelligenceContext = {
            keywords,
            location,
            language: 'en',
            entities: [],
            topics: [],
            competitors: [],
            internalContent: [],
            timestamp: Date.now()
        };

        try {
            if (mode === 'discovery') {
                // LIGHTWEIGHT: Only get keyword suggestions/volume
                console.log(`🧠 [IntelligenceEngine] FAST MODE: Fetching keyword suggestions only...`);
                context.topics = await DataForSEOClient.getRelatedTopics(keywords) || [];
                return context;
            }

            // DEEP MODE: SERP + Topics + Maps + SiteSearch — ALL IN PARALLEL
            const siteSearchPromise = (url && url.trim() !== '')
                ? (() => {
                    const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                    console.log(`🔗 [IntelligenceEngine] Site search in parallel for: ${domain}`);
                    return DataForSEOClient.searchGoogleSERP(`site:${domain} "${keywords}"`, location, 10)
                        .catch(err => { console.warn('Site search failed:', err); return []; });
                })()
                : Promise.resolve([]);

            const [serpResults, relatedTopics, mapsResults, siteResults] = await Promise.all([
                DataForSEOClient.searchGoogleSERP(keywords, location)
                    .catch(err => { console.error('SERP fetch failed:', err); return []; }),
                DataForSEOClient.getRelatedTopics(keywords)
                    .catch(err => { console.error('Topics fetch failed:', err); return []; }),
                DataForSEOClient.searchGoogleMaps(keywords, location, 5)
                    .catch(err => { console.error('Maps fetch failed:', err); return []; }),
                siteSearchPromise
            ]);

            context.topics = relatedTopics || [];
            context.entities = mapsResults || [];
            context.internalContent = siteResults || [];

            if (serpResults && serpResults.length > 0) {
                const analyzer = new SERPAnalyzer();
                context.serpAnalysis = analyzer.analyzeRawData({ items: serpResults }, keywords);

                console.log(`🧠 [IntelligenceEngine] DEEP MODE: Extracting competitor skeletons...`);
                // 多取候选(top 8)、跳过 PDF。逐个尝试抓真实大纲；抓不到/被反爬拦截的页面，
                // 用 SERP 自带的真实标题 + 摘要兜底（来自 Google 索引，反映真实内容，不丢竞品也不进垃圾）。
                // 最终保留最多 4 篇。
                const organic = serpResults
                    .filter((i: any) => i.type === 'organic' && i.url && !/\.pdf($|\?)|\/pdf\//i.test(i.url))
                    .slice(0, 8);

                const clean = (s: string) => (s || '').replace(/\s+/g, ' ').trim().slice(0, 200);
                const skeletons = await Promise.all(
                    organic.map(async (item: any) => {
                        const full = await SkeletonExtractor.extract(item.url);
                        if (full && full.headings.length > 0) return full;
                        // 兜底：SERP 标题 + 摘要（反爬页/无大纲页也能贡献真实信息）
                        const title = clean(item.title);
                        if (!title) return null;
                        const headings = [{ level: 1, text: title }];
                        const desc = clean(item.description || item.snippet || '');
                        if (desc) headings.push({ level: 2, text: desc });
                        return { url: item.url, title, headings };
                    })
                );
                context.competitors = skeletons
                    .filter((s): s is NonNullable<typeof s> => s !== null)
                    .slice(0, 4);
            }
        } catch (error) {
            console.error("❌ IntelligenceEngine Failure:", error);
        }

        return context;
    }
}
