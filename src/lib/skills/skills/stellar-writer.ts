/**
 * StellarWriter Unified Skill v2.2
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
    topics?: string[];
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
    version = '2.2.0';
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
        const { keywords, location, analyzeCompetitors = true } = input;

        // 1. Intelligence Gathering Phase
        let entities: MapDataItem[] = [];
        let topics: string[] = [];
        let competitorSkeletons: ContentSkeleton[] = [];

        try {
            // A. Fetch Google Maps Entities
            entities = await DataForSEOClient.searchGoogleMaps(keywords, location, 5);
            
            // B. Fetch Related Topics
            topics = await DataForSEOClient.getRelatedTopics(keywords);

            // C. Competitor Analysis (The new "Secret Sauce")
            if (analyzeCompetitors) {
                const serp = await DataForSEOClient.searchGoogleSERP(keywords, location, 5);
                const competitorUrls = serp
                    .filter(item => item.type === 'organic')
                    .slice(0, 3) // Analyze top 3 for speed and cost
                    .map(item => item.url);
                
                competitorSkeletons = await SkeletonExtractor.batchExtract(competitorUrls);
            }
        } catch (e) {
            console.error('Intelligence phase failed, proceeding with fallback AI knowledge', e);
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
        topics: string[],
        competitors: ContentSkeleton[]
    ): string {
        const { keywords, brandName = 'ScaletoTop', industry = 'General', tone = 'professional', type = 'blog', originalContent, auditOnly, url } = input;

        const entityCtx = entities.length > 0
            ? `## Real-World Entities (Inject for GEO Citation)
${entities.map(e => `- ${e.title}: ${e.address}. Rating: ${e.rating}.`).join('\n')}`
            : '';

        const topicCtx = topics.length > 0
            ? `## Related High-Intent Topics
${topics.map(t => `- ${t}`).join('\n')}`
            : '';

        const competitorCtx = competitors.length > 0
            ? `## Competitor Content Structures (Reverse Engineer these)
${competitors.map(c => `### Competitor: ${c.title}
Outlines:
${c.headings.map(h => `${'  '.repeat(h.level - 1)}- ${h.text}`).join('\n')}
`).join('\n')}`
            : '';

        return `You are a world-class Growth Marketer and SEO/GEO expert. Your mission is to create/optimize content that dominates both search engines and AI citation engines.

CRITICAL MODE: ${auditOnly ? 'AUDIT & STRATEGY ONLY. Do NOT write content.' : 'FULL MAGICAL REWRITE.'}

## Target Profiles
- **Keywords**: ${keywords}
- **Brand**: ${brandName}
- **Industry**: ${industry}
- **Tone**: ${tone}
- **Type**: ${type}

${originalContent ? `\n## Original Draft to Optimize\n${originalContent}\n` : ''}

${competitorCtx}

${entityCtx}

${topicCtx}

## Core Requirements (The Secret Sauce)
1. **Reverse Engineering**: Analyze the competitor skeletons. Create a "Master Outline" that covers ALL their key points plus ONE unique "Information Gain" point they all missed.
2. **AEO Optimization**: First 50 words must provide a definitive answer to the primary search intent.
3. **Entity Binding**: Link the brand to industry facts or local entities provided.
4. **Technical SEO**: Optimized Title (50-60 chars), Meta Description (120-160 chars), Slug.
5. **E-E-A-T**: Infuse experience-based language ("In our testing...", "We discovered...").

## Output JSON Format
\`\`\`json
{
  ${!auditOnly ? '"content": "# Optimized Markdown Content here",' : ''}
  "summary": "1-sentence summary",
  "seoMetadata": {
    "title": "SEO Title",
    "description": "Meta description",
    "keywords": ["kw1", "kw2"],
    "slug": "url-slug"
  },
  "schema": {
    "article": { /* Article LD-JSON */ }
  },
  "scores": { "seo": 95, "geo": 92 },
  "suggestions": ["Strategic point 1", "Strategic point 2"]
}
\`\`\`

Return ONLY the JSON block.`;
    }

    private parseResponse(
        raw: string, 
        entities: MapDataItem[], 
        topics: string[],
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
            competitors: competitors,
            internalLinks: json?.internalLinks || [],
            imageSuggestions: json?.imageSuggestions || [],
            distribution: json?.distribution || {},
            scores: json?.scores || { seo: 50, geo: 50 },
            suggestions: json?.suggestions || []
        };
    }
}
