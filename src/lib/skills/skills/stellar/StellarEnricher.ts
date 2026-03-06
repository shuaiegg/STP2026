
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
    internalLinks: { anchor: string; topic: string; reason: string }[];
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

        // 0.5 Fallback description extraction
        let finalDescription = description;
        const isPlaceholder = !finalDescription ||
            finalDescription.trim().length === 0 ||
            finalDescription.includes('AI Generated Guide') ||
            finalDescription.includes('Comprehensive guide about');

        if (isPlaceholder) {
            // Extract the first non-heading paragraph as fallback
            // We look for the first paragraph that isn't a header and has significant length
            const paragraphs = content.split('\n')
                .map(p => p.trim())
                .filter(p => p.length > 30 && !p.startsWith('#'));

            if (paragraphs.length > 0) {
                finalDescription = paragraphs[0];
            }
        }

        // Clean title of any accidental markdown formatting (like **Title**)
        const cleanTitle = title.replace(/\*\*/g, '').trim();

        // 1. Calculate SEO Score (pass extracted images and related topics for LSI check)
        const seoDetail = calculateDetailedSEOScore(cleanTitle, finalDescription, content, keyword, contentImages, relatedTopics, authorName);

        // 2. Calculate GEO Score
        const geoDetail = calculateGEOScore(content, entities, relatedTopics);

        // 3. Extract FAQ Section for Schema
        const faqs = this.extractFAQ(content);

        // 4. Generate JSON-LD (Schema.org)
        const articleSchema: any = {
            "@type": "Article",
            "headline": cleanTitle,
            "description": finalDescription,
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
            meta: `${finalDescription || description}`
        };

        // 5. SMART INTERNAL LINK RECOMMENDATIONS (Topic Clusters)
        const internalLinks = this.generateLinkRecommendations(content, keyword, entities, relatedTopics);

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
    /**
     * Generates semantic link recommendations based on content gaps and entities.
     */
    private static generateLinkRecommendations(content: string, keyword: string, entities: string[], relatedTopics: string[]): { anchor: string; topic: string; reason: string }[] {
        const recommendations: { anchor: string; topic: string; reason: string }[] = [];
        const plainText = content.replace(/[*_#`\[\]]/g, ' ');

        // 1. Primary Entity Anchor
        if (entities.length > 0) {
            const topEntity = entities[0];
            if (plainText.toLowerCase().includes(topEntity.toLowerCase())) {
                recommendations.push({
                    anchor: topEntity,
                    topic: `${topEntity} Advanced Implementation`,
                    reason: `Provides technical depth for the primary entity "${topEntity}" identified in this post.`
                });
            }
        }

        // 2. Related Topic / Concept Gap
        const concepts = relatedTopics.length > 0 ? relatedTopics : [`Benefits of ${keyword}`, `Future of ${keyword}`];
        concepts.slice(0, 2).forEach(topic => {
            // Find a generic anchor word if the specific topic isn't mentioned
            const commonWords = ['best practices', 'benefits', 'challenges', 'future', 'guide', 'solutions'];
            const foundAnchor = commonWords.find(word => plainText.toLowerCase().includes(word));

            recommendations.push({
                anchor: foundAnchor || keyword,
                topic: topic,
                reason: `Strengthens the topic cluster for ${keyword} by linking to complementary ${topic} details.`
            });
        });

        return recommendations.slice(0, 3);
    }
}
