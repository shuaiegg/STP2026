import { ContentSkeleton } from '../external/skeleton-extractor';
import { PorterStemmer, Tokenizer } from 'natural';

export interface GapAnalysisResult {
    score: number; // 0-100 Coverage Score
    missingKeywords: {
        term: string;
        volume: number;
        reason: string; // "High volume related keyword"
    }[];
    competitorTopics: {
        term: string;
        frequency: number;
        sources: string[]; // Which competitors have this
    }[];
}

/**
 * Content Gap Analyzer
 * Compares your outline against competitors and market data to find opportunities.
 */
export class ContentGapAnalyzer {

    /**
     * Analyze gaps between your outline and external data
     */
    static analyze(
        targetKeyword: string,
        myOutline: { level: number; text: string }[],
        competitors: ContentSkeleton[],
        relatedTopics: any[]
    ): GapAnalysisResult {
        const myOutlineText = myOutline.map(h => h.text.toLowerCase()).join(' ');

        // 1. Keyword Gaps (DataForSEO)
        // Find high volume keywords that are NOT in my outline
        const missingKeywords = relatedTopics
            .filter(t => t.volume > 100) // Filter trivial keywords
            .filter(t => !myOutlineText.includes(t.keyword.toLowerCase()))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5) // Top 5 missing
            .map(t => ({
                term: t.keyword,
                volume: t.volume,
                reason: `High Volume (${t.volume}) Keyword`
            }));

        // 2. Competitor Structure Gaps (TF-IDF light approach)
        // Extract common terms from competitor headings that are missing from mine
        const competitorHeadings = competitors.flatMap(c =>
            c.headings.map(h => ({ text: h.text, source: c.title }))
        );

        // Count term frequency in competitors
        const termCounts: Record<string, { count: number; sources: Set<string> }> = {};

        // Very basic stopword list
        const stopWords = new Set(['the', 'and', 'to', 'of', 'in', 'for', 'with', 'on', 'at', 'from', 'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among']);

        competitorHeadings.forEach(h => {
            // Simple tokenization
            const words = h.text.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 3 && !stopWords.has(w));

            words.forEach(w => {
                if (!termCounts[w]) termCounts[w] = { count: 0, sources: new Set() };
                termCounts[w].count++;
                termCounts[w].sources.add(h.source);
            });
        });

        // specific phrases check (bi-grams might be better, but single terms for now)
        const competitorTopics = Object.entries(termCounts)
            .filter(([term, data]) => data.count >= 2) // Must appear at least twice
            .filter(([term]) => !myOutlineText.includes(term)) // Must be missing from my outline
            .map(([term, data]) => ({
                term: term,
                frequency: data.count,
                sources: Array.from(data.sources)
            }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);

        // Calculate Coverage Score
        // Base 50 + up to 25 for keyword coverage + up to 25 for topic coverage
        const keywordScore = Math.max(0, 25 - (missingKeywords.length * 5));
        const topicScore = Math.max(0, 25 - (competitorTopics.length * 5));

        return {
            score: 50 + keywordScore + topicScore,
            missingKeywords,
            competitorTopics
        };
    }
}
