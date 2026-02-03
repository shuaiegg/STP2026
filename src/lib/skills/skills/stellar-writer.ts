/**
 * StellarWriter Unified Skill
 * 
 * The powerhouse of STP content generation.
 * Combines Technical SEO, GEO (Generative Engine Optimization), 
 * and real-world Entity Data.
 */

import { BaseSkill } from '../base-skill';
import { SkillInput, SkillExecutionMetadata } from '../types';
import { getProvider } from '../providers';
import { DataForSEOClient, MapDataItem } from '../../external/dataforseo';

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
    description = 'Universal SEO & GEO Content Engine. Real-world data integration + citation-first writing.';
    version = '2.0.0';
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
        const { keywords, location, auditOnly } = input;

        // 1. Context Injection: Fetch real-world entities if keywords provided
        let entities: MapDataItem[] = [];
        try {
            entities = await DataForSEOClient.searchGoogleMaps(keywords, location, 5);
        } catch (e) {
            console.error('DataForSEO fetch failed, proceeding with pure AI logic');
        }

        // 2. Intelligence: Build Unified Prompt
        const provider = getProvider(this.preferredProvider);
        const prompt = this.buildPrompt(input, entities);

        // 3. Generation
        const { response, cost } = await this.generateWithAI(provider, prompt, {
            model: this.preferredModel,
            temperature: 0.7,
            maxOutputTokens: 8000,
        });

        // 4. Orchestration: Parse and finalize
        const result = this.parseResponse(response.content, entities, input);

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

    private buildPrompt(input: StellarWriterInput, entities: MapDataItem[]): string {
        const { keywords, brandName = 'ScaletoTop', industry = 'General', tone = 'professional', type = 'blog', originalContent, auditOnly, url } = input;

        const entityCtx = entities.length > 0
            ? `## Real-World Entities (Inject for GEO Citation)
${entities.map(e => `- ${e.title}: ${e.address}. Rating: ${e.rating}. Web: ${e.website}`).join('\n')}`
            : '';

        return `You are a world-class Growth Marketer and SEO/GEO expert. Your mission is to create/optimize content that dominates both search engines and AI citation engines.

CRITICAL MODE: ${auditOnly ? 'AUDIT & STRATEGY ONLY. Do NOT write content.' : 'FULL MAGICAL REWRITE.'}

## Target Profiles
- **Keywords**: ${keywords}
- **Brand**: ${brandName}
- **Industry**: ${industry}
- **Tone**: ${tone}
- **Type**: ${type}
${url ? `- **Target URL**: ${url}` : ''}

${originalContent ? `\n## Original Draft to Optimize\n${originalContent}\n` : ''}

${entityCtx}

## Core Requirements (The Secret Sauce)
1. **AEO Optimization**: First 50 words must provide a definitive answer.
2. **Entity Binding**: Link the brand to industry facts or local entities provided above.
3. **Information Gain**: Provide unique insights, data placeholders, or named frameworks.
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
    "article": { /* Article LD-JSON */ },
    "faq": { /* FAQ LD-JSON if applicable */ }
  },
  "entities": [],
  "internalLinks": ["related-slug-1"],
  "imageSuggestions": ["Visual prompt 1"],
  "distribution": { "linkedin": "...", "reddit": "..." },
  "scores": { "seo": 95, "geo": 92 },
  "suggestions": ["suggestion 1", "suggestion 2"]
}
\`\`\`

Return ONLY the JSON block.`;
    }

    private parseResponse(raw: string, entities: MapDataItem[], input: StellarWriterInput): StellarWriterOutput {
        const json = this.extractJSON<any>(raw);
        
        return {
            content: json?.content,
            summary: json?.summary || 'Optimized content',
            seoMetadata: json?.seoMetadata || { title: '', description: '', keywords: [], slug: '' },
            schema: json?.schema || { article: {} },
            entities: entities,
            internalLinks: json?.internalLinks || [],
            imageSuggestions: json?.imageSuggestions || [],
            distribution: json?.distribution || {},
            scores: json?.scores || { seo: 50, geo: 50 },
            suggestions: json?.suggestions || []
        };
    }
}
