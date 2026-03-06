import { calculateDetailedSEOScore, calculateGEOScore } from '@/lib/utils/seo-scoring';
import { calculateHumanScore } from '@/lib/utils/ai-detection';
import { IntelligenceContext } from './types';

export interface AuditReport {
    needsRevision: boolean;
    scores: {
        seo: number;
        geo: number;
        human: number;
    };
    weaknesses: string[];
    suggestedInstructions: string[];
}

export class StellarAuditor {
    private static readonly MIN_SEO_SCORE = 85;
    private static readonly MIN_GEO_SCORE = 85;

    /**
     * Evaluates content using the heuristic scoring engine.
     * Extracts concrete weaknesses and actionable instructions for the Editor.
     */
    static evaluate(
        content: string,
        title: string,
        description: string,
        intelligenceContext: IntelligenceContext
    ): AuditReport {
        // Collect metrics
        const contentImages: { alt: string; src: string }[] = [];
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        let imgMatch;
        while ((imgMatch = imageRegex.exec(content)) !== null) {
            contentImages.push({ alt: imgMatch[1], src: imgMatch[2] });
        }

        const seoDetail = calculateDetailedSEOScore(
            title,
            description,
            content,
            intelligenceContext.keywords,
            contentImages,
            intelligenceContext.topics,
            'ScaleToTop'
        );

        const geoDetail = calculateGEOScore(content, intelligenceContext.entities, intelligenceContext.topics);
        const humanScore = calculateHumanScore(content);

        const weaknesses: string[] = [];
        const suggestedInstructions: string[] = [];

        // 1. Analyze SEO Breakdown
        const seoCategories = ['structure', 'readability', 'keywords', 'valueDensity'] as const;
        for (const cat of seoCategories) {
            const item = seoDetail.breakdown[cat];
            // Only flag if it's explicitly needs-improvement or critical, or heavily weighted but poor
            if (item && item.score < 80) {
                if (item.issues.length > 0) {
                    weaknesses.push(`SEO (${cat}): ${item.issues.join('; ')}`);
                }
                if (item.suggestions.length > 0) {
                    suggestedInstructions.push(item.suggestions[0]); // Take the top suggestion
                }
            }
        }

        // 2. Analyze GEO Breakdown
        if (geoDetail.score < this.MIN_GEO_SCORE) {
            if (geoDetail.metrics?.entityExtraction && geoDetail.metrics.entityExtraction < 80) {
                weaknesses.push(`GEO (Entities): Missing key entities. Try to include: ${intelligenceContext.entities.slice(0, 5).join(', ')}`);
                suggestedInstructions.push(`Organically weave in the following entities: ${intelligenceContext.entities.slice(0, 3).join(', ')}`);
            }
            if (geoDetail.metrics?.structural && geoDetail.metrics.structural < 80) {
                weaknesses.push(`GEO (Structure): Content lacks GEO-friendly formatting (lists, tables, bolding).`);
                suggestedInstructions.push(`Add bulleted lists or bold critical value statements to improve scannability.`);
            }
        }

        // 3. Wall of text detection (fallback if readability missed it)
        const paragraphs = content.split('\n\n');
        const longParagraphs = paragraphs.filter(p => !p.startsWith('#') && p.split(' ').length > 100);
        if (longParagraphs.length > 2) {
            weaknesses.push(`Readability: Document contains ${longParagraphs.length} paragraphs that are excessively long (>100 words).`);
            suggestedInstructions.push(`Break down long paragraphs into shorter 2-3 sentence chunks. Use bullet points where applicable.`);
        }

        const isWeak =
            seoDetail.overall < this.MIN_SEO_SCORE ||
            geoDetail.score < this.MIN_GEO_SCORE ||
            weaknesses.length >= 3;

        return {
            needsRevision: isWeak && weaknesses.length > 0,
            scores: {
                seo: seoDetail.overall,
                geo: geoDetail.score,
                human: humanScore
            },
            weaknesses: Array.from(new Set(weaknesses)), // Deduplicate
            suggestedInstructions: Array.from(new Set(suggestedInstructions))
        };
    }
}
