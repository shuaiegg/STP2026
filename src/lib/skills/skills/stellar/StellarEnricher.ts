
import { DetailedSEOScore, calculateDetailedSEOScore, calculateGEOScore } from '@/lib/utils/seo-scoring';
import { calculateHumanScore } from '@/lib/utils/ai-detection';
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
    static async enrich(content: string, title: string, description: string, keyword: string, entities: string[] = [], relatedTopics: string[] = [], authorName: string = 'ScaleToTop'): Promise<EnrichmentOutput> {
        console.log("💎 [StellarEnricher] Starting post-generation enrichment...");

        // 0. Extract images from markdown content
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const contentImages: { alt: string; src: string }[] = [];
        let imgMatch;
        while ((imgMatch = imageRegex.exec(content)) !== null) {
            contentImages.push({ alt: imgMatch[1], src: imgMatch[2] });
        }

        // 1. Calculate SEO Score (pass extracted images instead of [])
        const seoDetail = calculateDetailedSEOScore(title, description, content, keyword, contentImages);

        // 2. Calculate GEO Score
        const geoDetail = calculateGEOScore(content, entities, relatedTopics);

        // 3. Extract FAQ Section for Schema
        const faqs = this.extractFAQ(content);

        // 4. Generate JSON-LD (Schema.org)
        const articleSchema: any = {
            "@type": "Article",
            "headline": title,
            "description": description,
            "author": {
                "@type": "Person",
                "name": authorName
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://scaletotop.com/articles/${keyword.toLowerCase().replace(/\s+/g, '-')}`
            },
            "datePublished": new Date().toISOString()
        };

        // Create the combined schema structure
        let schema: any;
        if (faqs.length > 0) {
            const faqSchema = {
                "@type": "FAQPage",
                "mainEntity": faqs.map(faq => ({
                    "@type": "Question",
                    "name": faq.question,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": faq.answer
                    }
                }))
            };
            schema = {
                "@context": "https://schema.org",
                "@graph": [articleSchema, faqSchema]
            };
        } else {
            schema = {
                "@context": "https://schema.org",
                ...articleSchema
            };
        }

        // 5. Simple Social Snippets
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
                human: calculateHumanScore(content)
            },
            breakdown: seoDetail,
            geoBreakdown: geoDetail,
            schema,
            social,
            internalLinks,
            imageSuggestions
        };
    }

    /**
     * Extracts FAQ pairs from markdown content.
     * Looks for ## Frequently Asked Questions header and structured Q&A.
     */
    private static extractFAQ(content: string): { question: string; answer: string }[] {
        const faqs: { question: string; answer: string }[] = [];

        // Find the FAQ section
        const faqSectionMatch = content.match(/##\s*(?:Frequently Asked Questions|FAQ)[\s\S]+?(?=\n##|$)/i);
        if (!faqSectionMatch) return faqs;

        const faqSection = faqSectionMatch[0];

        // Pattern 1: **Q:** and **A:**
        const qAPairs = faqSection.match(/\*\*Q:?\s*(.*?)\*\*\s*\n+(?:A:?\s*)?([\s\S]*?)(?=\n+\*\*Q|$)/g);
        if (qAPairs) {
            qAPairs.forEach(pair => {
                const qMatch = pair.match(/\*\*Q:?\s*(.*?)\*\*/i);
                const aContent = pair.replace(/\*\*Q:?.*?\*\*/i, '').trim();
                if (qMatch && aContent) {
                    faqs.push({
                        question: qMatch[1].trim(),
                        answer: aContent.replace(/^A:?\s*/i, '').trim()
                    });
                }
            });
        }

        // Pattern 2: ### Headers as questions (Fallback)
        if (faqs.length === 0) {
            const headerPairs = faqSection.match(/###\s*(.*?)\n+([\s\S]+?)(?=\n###|\n##|$)/g);
            if (headerPairs) {
                headerPairs.forEach(pair => {
                    const match = pair.match(/###\s*(.*?)\n+([\s\S]+)/);
                    if (match) {
                        const question = match[1].trim();
                        // Filter out common intro text if it accidentally matches
                        if (question.length > 5 && !question.toLowerCase().includes('introduction')) {
                            faqs.push({
                                question,
                                answer: match[2].trim()
                            });
                        }
                    }
                });
            }
        }

        return faqs.slice(0, 8); // Cap at 8 to keep schema reasonable
    }
}
