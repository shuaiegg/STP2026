/**
 * StellarWriter Unified Skill v2.3
 * 
 * The powerhouse of STP content generation.
 * Combines Technical SEO, GEO (Generative Engine Optimization), 
 * and Competitor Reverse Engineering.
 */

import { BaseSkill } from '../base-skill';
import { SkillInput, SkillOutput, SkillExecutionMetadata } from '../types';
import { getProvider } from '../providers';
import { DataForSEOClient, MapDataItem } from '../../external/dataforseo';
import { SkeletonExtractor, ContentSkeleton } from '../../external/skeleton-extractor';

/**
 * Input for StellarWriter
 * We omit 'keywords' from SkillInput since we use a string instead of string[]
 */
export interface StellarWriterInput extends Omit<SkillInput, 'keywords'> {
    /** Target keywords or topic */
    keywords: string;
    /** Target geographic location (optional) */
    location?: string;
    /** Brand name for entity binding */
    brandName?: string;
    /** Context: B2B, SaaS, Finance, etc. */
    industry?: 'B2B' | 'SaaS' | 'General';
    /** Content tone */
    tone?: 'professional' | 'casual' | 'educational';
    /** Content type */
    type?: 'blog' | 'landing_page' | 'guide';
    /** Original content if optimizing existing work */
    originalContent?: string;
    /** Target URL for canonicals */
    url?: string;
    /** If true, only return score and audit without full rewrite */
    auditOnly?: boolean;
    /** Whether to perform deep competitor analysis */
    analyzeCompetitors?: boolean;
}

/**
 * Output for StellarWriter
 */
export interface StellarWriterOutput {
    /** Optimized markdown content (null if auditOnly) */
    content?: string;
    /** Concise 1-2 sentence summary */
    summary: string;
    /** SEO Metadata for tags */
    seoMetadata: {
        title: string;
        description: string;
        keywords: string[];
        slug: string;
    };
    /** JSON-LD Schema markup */
    schema: {
        article: object;
        faq?: object;
        product?: object;
    };
    /** Entities discovered/injected */
    entities: MapDataItem[];
    /** Discovered topics/questions for content planning */
    topics?: {
        keyword: string;
        volume: number;
        competition: number;
    }[];
    /** Suggested master outline (if no content provided) */
    masterOutline?: {
        level: number;
        text: string;
    }[];
    /** Competitor analysis data */
    competitors?: ContentSkeleton[];
    /** Recommended internal links */
    internalLinks: string[];
    /** Visual/Image suggestions */
    imageSuggestions: string[];
    /** Distribution snippets */
    distribution: {
        linkedin?: string;
        reddit?: string;
        twitter?: string;
    };
    /** Performance scores (0-100) */
    scores: {
        seo: number;
        geo: number;
    };
    /** Strategic optimization suggestions */
    suggestions: string[];
}

/**
 * StellarWriter Skill Implementation
 */
export class StellarWriterSkill extends BaseSkill {
    name = 'stellar-writer';
    description = 'Universal SEO & GEO Content Engine with Competitor Reverse Engineering.';
    version = '2.3.0';
    category: 'seo' = 'seo';

    protected preferredProvider: 'gemini' | 'claude' | 'deepseek' = 'gemini';
    protected preferredModel = 'gemini-flash-latest';

    protected getRequiredInputs(): string[] {
        return ['keywords'];
    }

    /**
     * Main execution logic
     */
    protected async executeInternal(
        input: SkillInput
    ): Promise<{
        data: StellarWriterOutput;
        metadata: Partial<SkillExecutionMetadata>;
    }> {
        const stellarInput = input as unknown as StellarWriterInput;
        const { keywords, location, analyzeCompetitors = true, auditOnly } = stellarInput;

        // Full mock mode - return complete mock data without any API calls
        if (process.env.USE_FULL_MOCK === 'true') {
            console.log(`🎭 FULL MOCK MODE: Generating mock output for "${keywords}"...`);

            const mockTopics = [
                { keyword: `best ${keywords}`, volume: 3200, competition: 45 },
                { keyword: `free ${keywords}`, volume: 5100, competition: 62 },
                { keyword: `how to ${keywords}`, volume: 4500, competition: 38 },
                { keyword: `${keywords} guide`, volume: 2800, competition: 35 },
                { keyword: `${keywords} tips`, volume: 3600, competition: 42 },
                { keyword: `${keywords} tutorial`, volume: 2100, competition: 31 },
                { keyword: `${keywords} vs`, volume: 1800, competition: 48 },
                { keyword: `${keywords} comparison`, volume: 1500, competition: 44 },
            ];

            return {
                data: {
                    content: auditOnly ? undefined : `# ${keywords} 完整指南\n\n这是关于 ${keywords} 的详细内容...\n\n## 什么是 ${keywords}？\n\n${keywords} 是一个重要的主题...\n\n## 如何使用 ${keywords}？\n\n1. 步骤一\n2. 步骤二\n3. 步骤三`,
                    summary: `这是一篇关于 ${keywords} 的综合指南，涵盖了基础概念、实用技巧和最佳实践。`,
                    seoMetadata: {
                        title: `${keywords} - 2026 年完整指南 | 专家建议`,
                        description: `探索 ${keywords} 的所有知识。获取专家见解、实用技巧和行业最佳实践。适合初学者和专业人士。`,
                        keywords: [keywords, `${keywords} 指南`, `${keywords} 教程`, `最佳 ${keywords}`],
                        slug: keywords.toLowerCase().replace(/\s+/g, '-')
                    },
                    schema: {
                        article: {
                            "@context": "https://schema.org",
                            "@type": "Article",
                            "headline": `${keywords} - 完整指南`,
                            "author": { "@type": "Person", "name": "ScaletoTop" }
                        }
                    },
                    entities: [],
                    topics: mockTopics,
                    masterOutline: [
                        { level: 1, text: `什么是 ${keywords}？` },
                        { level: 1, text: `${keywords} 的核心优势` },
                        { level: 2, text: `提高效率` },
                        { level: 2, text: `降低成本` },
                        { level: 1, text: `如何开始使用 ${keywords}` },
                        { level: 2, text: `准备工作` },
                        { level: 2, text: `实施步骤` },
                        { level: 1, text: `常见问题解答` },
                    ],
                    internalLinks: [
                        `/blog/${keywords.toLowerCase().replace(/\s+/g, '-')}-basics`,
                        `/blog/${keywords.toLowerCase().replace(/\s+/g, '-')}-advanced`,
                    ],
                    imageSuggestions: [
                        `${keywords} 概览图表`,
                        `${keywords} 实施流程图`,
                        `${keywords} 对比分析图`,
                    ],
                    distribution: {
                        linkedin: `🚀 新文章发布！探索 ${keywords} 的完整指南。#${keywords.replace(/\s+/g, '')} #营销`,
                        reddit: `我写了一篇关于 ${keywords} 的综合指南，涵盖了从基础到高级的所有内容。`,
                        twitter: `📊 ${keywords} 完整指南发布！学习如何充分利用这个强大的工具。`
                    },
                    scores: {
                        seo: 85,
                        geo: 78
                    },
                    suggestions: [
                        `添加更多实际案例研究`,
                        `增强视觉内容（图表、信息图）`,
                        `优化移动端阅读体验`,
                        `添加更多内部链接`,
                    ]
                },
                metadata: {
                    tokensUsed: 850,
                    cost: 0.000238,
                }
            };
        }

        // 1. Intelligence Gathering Phase
        let entities: MapDataItem[] = [];
        let topics: any[] = [];
        let competitorSkeletons: ContentSkeleton[] = [];

        try {
            console.log(`Step 1: Fetching maps data for ${keywords}...`);
            entities = await DataForSEOClient.searchGoogleMaps(keywords, location, 5);

            console.log(`Step 2: Fetching topics data for ${keywords}...`);
            topics = await DataForSEOClient.getRelatedTopics(keywords);

            if (analyzeCompetitors) {
                console.log(`Step 3: Fetching SERP data...`);
                const serp = await DataForSEOClient.searchGoogleSERP(keywords, location, 5);
                const competitorUrls = serp
                    .filter(item => item.type === 'organic')
                    .map(item => item.url)
                    .filter(Boolean);

                if (competitorUrls.length > 0) {
                    competitorSkeletons = await SkeletonExtractor.batchExtract(competitorUrls.slice(0, 3));
                }
            }
        } catch (e) {
            console.error('Intelligence phase partial failure', e);
            // We don't throw here, allow AI to proceed with what it has
        }

        // 2. Generation Phase: Build Unified Prompt
        const provider = getProvider(this.preferredProvider);
        const prompt = this.buildStellarPrompt(stellarInput, entities, topics, competitorSkeletons);

        // 3. Execution
        console.log(`Step 4: Generating with AI (${this.preferredProvider})...`);
        const { response, cost } = await this.generateWithAI(provider, prompt, {
            model: this.preferredModel,
            temperature: 0.7,
            maxOutputTokens: 8000,
        });

        if (!response || !response.content) {
            throw new Error('AI Engine returned an empty response');
        }

        // 4. Orchestration: Parse and finalize
        const result = this.parseResponse(response.content, entities, topics, competitorSkeletons);

        return {
            data: result,
            metadata: {
                modelUsed: response.model,
                provider: this.preferredProvider,
                tokensUsed: (response.inputTokens || 0) + (response.outputTokens || 0),
                cost,
            },
        };
    }

    private buildStellarPrompt(
        input: StellarWriterInput,
        entities: MapDataItem[],
        topics: any[],
        competitors: ContentSkeleton[]
    ): string {
        const { keywords, brandName = 'ScaletoTop', industry = 'General', tone = 'professional', type = 'blog', originalContent, auditOnly, url } = input;

        const entityCtx = entities.length > 0
            ? `## Real-World Entities
${entities.map(e => `- ${e.title}: ${e.address}. Rating: ${e.rating}.`).join('\n')}`
            : '';

        const topicCtx = topics.length > 0
            ? `## Related Keywords & Search Volume
${topics.map(t => `- ${t.keyword}: Volume ${t.volume}, Competition ${t.competition}%`).join('\n')}`
            : '';

        const competitorCtx = competitors.length > 0
            ? `## Competitor Outlines
${competitors.map(c => `### Competitor: ${c.title}\n${c.headings.map(h => `${'  '.repeat(h.level - 1)}- ${h.text}`).join('\n')}\n`).join('\n')}`
            : '';

        return `You are a world-class Growth Marketer and SEO/GEO expert.

MODE: ${auditOnly ? 'AUDIT & STRATEGY ONLY. Analyse keywords and competitors, and provide a "Master Outline" that can beat them.' : 'FULL MAGICAL REWRITE.'}

## Target Profiles
- Keywords: ${keywords}
- Brand: ${brandName}
- Industry: ${industry}

${originalContent ? `\n## Original Content\n${originalContent}\n` : 'Note: User is starting from scratch. Focus on creating the best Master Outline.'}

${competitorCtx}
${entityCtx}
${topicCtx}

## Core Requirements
1. **Reverse Engineering**: Create a "Master Outline" (H1-H3) that is superior to all competitors.
2. **GEO Strategy**: Direct Answer First (AEO), Entity Binding, and Information Gain.
3. **SEO Technicals**: Optimized Title, Meta Description, Slug, and Schema.org Article JSON-LD.

## Output JSON Format
\`\`\`json
{
  ${!auditOnly ? '"content": "# Markdown content here",' : ''}
  "summary": "1-sentence summary",
  "seoMetadata": { "title": "...", "description": "...", "keywords": [], "slug": "..." },
  "schema": { "article": { /* JSON-LD Article */ } },
  ${auditOnly ? '"masterOutline": [ { "level": 1, "text": "H1 Title" }, { "level": 2, "text": "H2 Subtitle" } ],' : ''}
  "scores": { "seo": 95, "geo": 92 },
  "suggestions": ["Strategic point 1", "..."]
}
\`\`\`

Return ONLY JSON.`;
    }

    private parseResponse(
        raw: string,
        entities: MapDataItem[],
        topics: any[],
        competitors: ContentSkeleton[]
    ): StellarWriterOutput {
        const json = this.extractJSON<any>(raw);

        return {
            content: json?.content,
            summary: json?.summary || 'Optimized content',
            seoMetadata: json?.seoMetadata || { title: '', description: '', keywords: [], slug: '' },
            schema: json?.schema || { article: {} },
            entities: entities,
            topics: topics,
            masterOutline: json?.masterOutline,
            competitors: competitors,
            internalLinks: json?.internalLinks || [],
            imageSuggestions: json?.imageSuggestions || [],
            distribution: json?.distribution || {},
            scores: json?.scores || { seo: 50, geo: 50 },
            suggestions: json?.suggestions || []
        };
    }
}
