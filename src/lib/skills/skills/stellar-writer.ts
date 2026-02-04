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
 */
export interface StellarWriterInput extends SkillInput {
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

    protected preferredProvider: 'gemini' | 'claude' | 'deepseek' = 'deepseek';
    protected preferredModel = 'deepseek-chat';

    protected getRequiredInputs(): string[] {
        return ['keywords'];
    }

    /**
     * Main execution logic
     */
    protected async executeInternal(
        input: StellarWriterInput
    ): Promise<{
        data: StellarWriterOutput;
        metadata: Partial<SkillExecutionMetadata>;
    }> {
        const { keywords, location, analyzeCompetitors = true, auditOnly } = input;

        // 1. Intelligence Gathering Phase
        let entities: MapDataItem[] = [];
        let topics: any[] = [];
        let competitorSkeletons: ContentSkeleton[] = [];

        try {
            // A. Fetch Google Maps Entities
            entities = await DataForSEOClient.searchGoogleMaps(keywords, location, 5);
            
            // B. Fetch Related Topics with Volume & Competition
            topics = await DataForSEOClient.getRelatedTopics(keywords);

            // C. Competitor Analysis
            if (analyzeCompetitors) {
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
        }

        // 2. Generation Phase: Build Unified Prompt
        const provider = getProvider(this.preferredProvider);
        const prompt = this.buildPrompt(input, entities, topics, competitorSkeletons);

        // 3. Execution
        const { response, cost } = await this.generateWithAI(provider, prompt, {
            model: this.preferredModel,
            temperature: 0.7,
            maxOutputTokens: 8000,
        });

        // 4. Orchestration: Parse and finalize
        const result = this.parseResponse(response.content, entities, topics, competitorSkeletons);

        return {
            data: result,
            metadata: {
                modelUsed: response.model,
                provider: this.preferredProvider,
                tokensUsed: response.inputTokens + response.outputTokens,
                cost,
            },
        };
    }

    private buildPrompt(
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
