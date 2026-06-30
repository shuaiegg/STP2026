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
                // 多取候选(top 8)并跳过 PDF（提不出 HTML 大纲）。反爬页由 SkeletonExtractor 过滤为 null，
                // 这里再剔除无大纲的页面，最终保留 4 篇真正有结构的竞品 —— 避免过滤后只剩 1 篇。
                const urls = serpResults
                    .filter((i: any) => i.type === 'organic')
                    .map((i: any) => i.url as string)
                    .filter((url: string) => url && !/\.pdf($|\?)|\/pdf\//i.test(url))
                    .slice(0, 8);

                const skeletons = await SkeletonExtractor.batchExtract(urls);
                context.competitors = skeletons
                    .filter((s) => s.headings && s.headings.length > 0)
                    .slice(0, 4);
            }
        } catch (error) {
            console.error("❌ IntelligenceEngine Failure:", error);
        }

        return context;
    }
}
