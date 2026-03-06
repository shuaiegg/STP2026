
import { DetailedSEOScore, calculateDetailedSEOScore, calculateGEOScore } from '@/lib/utils/seo-scoring';
import { calculateHumanScore } from '@/lib/utils/ai-detection';
import { ImageFinder, UnsplashImage } from '@/lib/external/image-finder';
import { MarkdownImagePlacer } from './utils/image-placer';

export interface EnrichmentOutput {
    content: string; // The potentially modified content (with images inserted)
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
    static async enrich(
        content: string,
        title: string,
        description: string,
        keyword: string,
        entities: string[] = [],
        relatedTopics: string[] = [],
        authorName: string = 'ScaleToTop',
        autoVisuals: boolean = true
    ): Promise<EnrichmentOutput> {
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

        // 6. REAL IMAGE SUGGESTIONS & INSERTION (Zero-latency Unsplash URLs)
        const imageSuggestions = ImageFinder.getSuggestedImages(keyword, 3);
        const finalContent = autoVisuals ? MarkdownImagePlacer.insertImages(content, imageSuggestions) : content;

        return {
            content: finalContent,
            scores: {
                seo: seoDetail.overall,
                geo: geoDetail.score,
                human: calculateHumanScore(finalContent)
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
     * Generates semantic internal link recommendations (topic cluster strategy).
     * Produces 3–5 reliable article suggestions regardless of input language.
     */
    private static generateLinkRecommendations(content: string, keyword: string, entities: string[], relatedTopics: string[]): { anchor: string; topic: string; reason: string }[] {
        const isChinese = /[\u4e00-\u9fa5]/.test(keyword);
        const recommendations: { anchor: string; topic: string; reason: string }[] = [];

        // --- Template 1: In-Depth Guide (always applicable) ---
        const guideTitle = isChinese
            ? `${keyword}完整指南：从入门到精通`
            : `The Complete Guide to ${keyword}: From Beginner to Expert`;
        recommendations.push({
            anchor: keyword,
            topic: guideTitle,
            reason: isChinese
                ? `作为主题集群中心页，覆盖 ${keyword} 的全流程知识，为读者提供深度参考。`
                : `Serves as the pillar page for the ${keyword} topic cluster, covering end-to-end knowledge.`
        });

        // --- Template 2: Common Mistakes / Pitfalls ---
        const mistakesTitle = isChinese
            ? `${keyword}常见错误：新手必须避开的10个坑`
            : `10 Common ${keyword} Mistakes to Avoid (Beginner to Pro)`;
        recommendations.push({
            anchor: isChinese ? `${keyword}误区` : `${keyword} mistakes`,
            topic: mistakesTitle,
            reason: isChinese
                ? `从反面角度切入，补充本文未覆盖的风险防范视角，留住中途跳出的读者。`
                : `Covers the risk-prevention angle not addressed in this post, reducing bounce rate by answering "what to avoid".`
        });

        // --- Template 3: Use relatedTopics if available, else use Tools/Comparison template ---
        if (relatedTopics.length > 0) {
            const relatedKeyword = relatedTopics[0];
            const relatedTitle = isChinese
                ? `${relatedKeyword}与${keyword}：深度对比与选择指南`
                : `${relatedKeyword} vs ${keyword}: In-Depth Comparison Guide`;
            recommendations.push({
                anchor: typeof relatedKeyword === 'string' ? relatedKeyword : keyword,
                topic: relatedTitle,
                reason: isChinese
                    ? `覆盖读者在搜索 ${keyword} 时高频出现的对比类意图，强化话题权威性。`
                    : `Covers the comparative search intent frequently paired with ${keyword} queries, boosting topical authority.`
            });
        } else {
            const toolsTitle = isChinese
                ? `${keyword}最佳工具推荐：${new Date().getFullYear()}年完整测评`
                : `Best ${keyword} Tools in ${new Date().getFullYear()}: Complete Review`;
            recommendations.push({
                anchor: isChinese ? `${keyword}工具` : `${keyword} tools`,
                topic: toolsTitle,
                reason: isChinese
                    ? `工具类文章搜索量大、转化高，是 ${keyword} 话题集群不可缺少的支柱页之一。`
                    : `Tool roundups drive high-intent traffic and complement informational content in the ${keyword} cluster.`
            });
        }

        // --- Template 4: Use top entity or Case Study ---
        if (entities.length > 0) {
            const entity = entities[0];
            const caseTitle = isChinese
                ? `${entity}成功案例：${keyword}的真实落地实践`
                : `${entity} Case Study: Real-World ${keyword} Implementation`;
            recommendations.push({
                anchor: entity,
                topic: caseTitle,
                reason: isChinese
                    ? `真实案例能大幅提升 E-E-A-T 可信度，让读者从理论走向实践。`
                    : `Real-world case studies boost E-E-A-T signals and help readers bridge theory-to-practice gaps.`
            });
        } else {
            const howToTitle = isChinese
                ? `${keyword}实操教程：一步一步带你做出效果`
                : `How to ${keyword}: A Step-by-Step Tutorial That Actually Works`;
            recommendations.push({
                anchor: isChinese ? `${keyword}教程` : `${keyword} tutorial`,
                topic: howToTitle,
                reason: isChinese
                    ? `操作型内容是话题集群中搜索量最高的类型之一，补充读者"怎么做"的核心需求。`
                    : `How-to content captures the highest-volume "how to" search intent within the ${keyword} cluster.`
            });
        }

        return recommendations;
    }
}
