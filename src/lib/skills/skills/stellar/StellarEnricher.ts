
import { DetailedSEOScore, calculateDetailedSEOScore, calculateGEOScore } from '@/lib/utils/seo-scoring';
import { ImageFinder, UnsplashImage } from '@/lib/external/image-finder';

export interface EnrichmentOutput {
    scores: {
        seo: number;
        geo: number;
        human: number;
    };
    breakdown?: DetailedSEOScore;
    geoBreakdown?: any;
    schema: any;
    social: {
        twitter: string;
        linkedin: string;
        meta: string;
    };
    internalLinks: { url: string; title: string }[];
    imageSuggestions: UnsplashImage[];
}

export class StellarEnricher {
    /**
     * Performs post-generation enrichment: Scoring, Schema, Social, and Images.
     */
    static async enrich(content: string, title: string, description: string, keyword: string, entities: string[] = [], relatedTopics: string[] = []): Promise<EnrichmentOutput> {
        console.log("💎 [StellarEnricher] Starting post-generation enrichment...");

        // 1. Calculate SEO Score
        const seoDetail = calculateDetailedSEOScore(title, description, content, keyword, []);

        // 2. Calculate GEO Score
        const geoDetail = calculateGEOScore(content, entities, relatedTopics);

        // 3. Generate JSON-LD (Schema.org)
        const schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description,
            "author": {
                "@type": "Person",
                "name": "Aladdin Author"
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://scaletotop.com/articles/${keyword.toLowerCase().replace(/\s+/g, '-')}`
            },
            "datePublished": new Date().toISOString()
        };

        // 4. Simple Social Snippets
        const social = {
            twitter: `🚀 New Article: ${title}\n\nCheck out the full guide on ${keyword}! #SEO #GEO #${keyword.replace(/\s+/g, '')}`,
            linkedin: `I just published a deep dive into ${keyword}. Read the full analysis: ${title}`,
            meta: `${description}`
        };

        // 5. SMART INTERNAL LINKS
        const internalLinks = (relatedTopics.length > 0 ? relatedTopics : [
            `${keyword} maintenance`,
            `future of ${keyword}`,
            `${keyword} vs traditional solutions`
        ]).slice(0, 3).map(topic => ({
            url: `/articles/${topic.toLowerCase().replace(/\s+/g, '-')}`,
            title: topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        }));

        // 6. REAL IMAGE SUGGESTIONS (Zero-latency)
        const imageSuggestions = ImageFinder.getSuggestedImages(keyword);

        return {
            scores: {
                seo: seoDetail.overall,
                geo: geoDetail.score,
                human: 90
            },
            breakdown: seoDetail,
            geoBreakdown: geoDetail,
            schema,
            social,
            internalLinks,
            imageSuggestions
        };
    }
}
