/**
 * Prompt Enhancement Utilities for SERP-Driven Content Generation
 * 
 * This module provides functions to extract actionable insights from SERP data
 * and integrate them into AI content generation prompts.
 */

import type { SERPAnalysis } from '../external/serp-analyzer';
import type { ContentSkeleton } from '../external/skeleton-extractor';

/**
 * Extract People Also Ask questions for structured content
 */
export function extractPAAPrompt(serpAnalysis?: SERPAnalysis): string {
    if (!serpAnalysis?.peopleAlsoAsk || serpAnalysis.peopleAlsoAsk.length === 0) {
        return '';
    }

    const questions = serpAnalysis.peopleAlsoAsk
        .slice(0, 6) // Limit to top 6 questions
        .map((paa: any, index: number) => `${index + 1}. ${paa.question}`)
        .join('\n');

    return `
## 📌 用户关心的核心问题 (必须在文章中回答):

${questions}

**要求**:
- 将每个问题作为 H2 或 H3 标题自然融入文章结构
- 每个问题的答案控制在 2-3 段落，简洁准确
- 优先回答前 3 个问题，它们最有可能被 Google 抓取为 Featured Snippet
`;
}

/**
 * Extract common structural patterns from competitor content
 */
export function extractCompetitorPatterns(competitors?: ContentSkeleton[]): string {
    if (!competitors || competitors.length === 0) {
        return '';
    }

    // Count H2 heading frequencies
    const h2Counts = new Map<string, number>();

    competitors.forEach(comp => {
        if (!comp.headings) return;

        comp.headings
            .filter((h: any) => h.level === 2)
            .forEach((h: any) => {
                const normalized = normalizeHeading(h.text);
                h2Counts.set(normalized, (h2Counts.get(normalized) || 0) + 1);
            });
    });

    // Get patterns that appear in 50%+ of competitors
    const threshold = Math.max(1, Math.floor(competitors.length * 0.5));
    const commonPatterns = Array.from(h2Counts.entries())
        .filter(([_, count]) => count >= threshold)
        .sort((a, b) => b[1] - a[1])
        .map(([heading]) => heading)
        .slice(0, 8); // Top 8 patterns

    if (commonPatterns.length === 0) {
        return '';
    }

    return `
## 🏆 竞品成功结构参考 (基于 TOP ${competitors.length} 排名内容分析):

以下章节在高排名内容中频繁出现，建议包含：
${commonPatterns.map(pattern => `- ${pattern}`).join('\n')}

**注意**: 使用这些结构作为灵感，但必须用你自己的语言和角度重新组织内容。
`;
}

/**
 * Normalize heading text for pattern matching
 */
function normalizeHeading(text: string): string {
    return text
        .toLowerCase()
        .replace(/[0-9]+/g, '') // Remove numbers
        .replace(/[^\w\s\u4e00-\u9fa5]/g, '') // Keep only alphanumeric and Chinese
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extract LSI keywords for semantic richness
 */
export function extractLSIKeywords(relatedKeywords?: string[], targetKeyword?: string): string {
    if (!relatedKeywords || relatedKeywords.length === 0) {
        return '';
    }

    // Filter out the main keyword and get top 10 related terms
    const lsiKeywords = relatedKeywords
        .filter(kw => kw.toLowerCase() !== targetKeyword?.toLowerCase())
        .slice(0, 10);

    if (lsiKeywords.length === 0) {
        return '';
    }

    return `
## 🔑 LSI 关键词 (相关术语，自然融入内容):

${lsiKeywords.map(kw => `- "${kw}"`).join('\n')}

**使用建议**:
- 在内容中自然地使用 3-5 个这些相关术语
- 避免刻意堆砌，保持语句流畅
- 优先在小标题和段落首句中使用
`;
}

/**
 * Extract SERP feature optimization hints
 */
export function extractSERPHints(serpAnalysis?: SERPAnalysis): string {
    if (!serpAnalysis) {
        return '';
    }

    const hints: string[] = [];

    // Featured Snippet opportunity
    if (serpAnalysis.featuredSnippet) {
        if (!serpAnalysis.featuredSnippet.exists && serpAnalysis.featuredSnippet.opportunity === 'high') {
            hints.push('⭐ **Featured Snippet 高机会**: 在文章开头提供 40-60 词的精准答案，直接回答用户查询意图');
        } else if (serpAnalysis.featuredSnippet.exists) {
            hints.push('📌 **当前存在 Featured Snippet** - 尝试提供更全面或更新的答案来替代现有内容');
        }
    }

    // Video presence
    if (serpAnalysis.serpFeatures?.hasVideo) {
        hints.push('🎥 **视频优化**: SERP 中包含视频结果，建议添加 YouTube 视频嵌入或视频教程链接');
    }

    // FAQ Schema opportunity
    if (serpAnalysis.serpFeatures?.hasFAQ || serpAnalysis.peopleAlsoAsk.length > 0) {
        hints.push('❓ **FAQ Schema**: 考虑使用 FAQ 结构化数据标记问答部分，提升富媒体展示机会');
    }

    // Knowledge Panel
    if (serpAnalysis.serpFeatures?.hasKnowledgePanel) {
        hints.push('📚 **知识型内容**: SERP 显示知识面板，内容应包含权威定义和详细解释');
    }

    // Local Pack
    if (serpAnalysis.serpFeatures?.hasLocalPack) {
        hints.push('📍 **本地化内容**: 加入地理位置相关信息和本地化建议');
    }

    if (hints.length === 0) {
        return '';
    }

    return `
## 🎯 SERP 优化建议 (基于搜索结果特征):

${hints.join('\n')}
`;
}

/**
 * Build complete enhanced prompt with all SERP insights
 */
export function buildSERPEnhancedPrompt(params: {
    serpAnalysis?: SERPAnalysis;
    relatedKeywords?: Array<{ keyword: string; volume: number; competition: number }>;
    targetKeyword?: string;
    competitors?: ContentSkeleton[];
}): string {
    const { serpAnalysis, relatedKeywords, targetKeyword, competitors } = params;

    const sections = [
        extractPAAPrompt(serpAnalysis),
        extractCompetitorPatterns(competitors),
        extractLSIKeywords(relatedKeywords?.map(k => k.keyword), targetKeyword),
        extractSERPHints(serpAnalysis)
    ].filter(section => section.length > 0);

    if (sections.length === 0) {
        return '';
    }

    return `
# 🔍 SERP 智能分析 (SEO 优化指导)

${sections.join('\n---\n')}

---

请基于以上 SERP 分析数据优化你的内容，确保：
1. 回答用户最关心的问题
2. 采用被证明有效的内容结构
3. 自然融入相关术语提升主题相关性
4. 针对 SERP 特征优化内容格式
`;
}
