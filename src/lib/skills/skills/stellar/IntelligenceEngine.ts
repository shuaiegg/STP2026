import { DataForSEOClient } from '../../../external/dataforseo';
import { SERPAnalyzer } from '../../../external/serp-analyzer';
import { SkeletonExtractor } from '../../../external/skeleton-extractor';
import { IntelligenceContext } from './types';

export class IntelligenceEngine {
    /**
     * Gathers deep intelligence for a given keyword and location.
     */
    static async gather(keywords: string, location: string = 'United States'): Promise<IntelligenceContext> {
        console.log(`🧠 [IntelligenceEngine] Gathering data for: ${keywords} in ${location}`);
        
        const context: IntelligenceContext = {
            keywords,
            location,
            language: 'en', // Logic to detect can be added here
            entities: [],
            topics: [],
            competitors: [],
            internalContent: [],
            timestamp: Date.now()
        };

        try {
            // Parallel fetch: SERP + Topics
            const [serpResults, relatedTopics] = await Promise.all([
                DataForSEOClient.searchGoogleSERP(keywords, location),
                DataForSEOClient.getRelatedTopics(keywords)
            ]);

            context.topics = relatedTopics || [];

            if (serpResults && serpResults.length > 0) {
                const analyzer = new SERPAnalyzer();
                context.serpAnalysis = analyzer.analyzeRawData(serpResults, keywords);
                
                // PERFORMANCE CRITICAL: Parallel fetch with strict timeout
                console.log(`🧠 [IntelligenceEngine] Extracting skeletons from top 3 competitors (5s limit)...`);
                const urls = serpResults
                    .filter((i: any) => i.type === 'organic')
                    .slice(0, 3)
                    .map((i: any) => i.url);
                
                // Ensure SkeletonExtractor has internal timeout handling
                context.competitors = await SkeletonExtractor.batchExtract(urls);
            }
        } catch (error) {
            console.error("❌ IntelligenceEngine Failure:", error);
        }

        return context;
    }
}
