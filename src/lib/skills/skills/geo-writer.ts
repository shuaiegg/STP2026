/**
 * GEO Writing Optimizer Skill
 * 
 * Generates content optimized for Generative Engines (GEO) by incorporating 
 * real-world entity data from Google Maps.
 */

import { BaseSkill } from '../base-skill';
import { SkillInput, SkillExecutionMetadata } from '../types';
import { getProvider } from '../providers';
import { DataForSEOClient, MapDataItem } from '../../external/dataforseo';

/**
 * Input for GEO Writer
 */
export interface GEOWriterInput extends SkillInput {
    /** Topic or keywords to write about */
    keywords: string;
    /** Target location for local relevance */
    location?: string;
    /** Content tone/style */
    tone?: 'professional' | 'casual' | 'educational';
    /** Content type */
    type?: 'blog' | 'landing_page' | 'review_summary';
    /** Original content if optimizing existing article */
    originalContent?: string;
    /** If true, only return score and suggestions without rewriting */
    auditOnly?: boolean;
}

/**
 * Output for GEO Writer
 */
export interface GEOWriterOutput {
    /** Generated content (only for paid execution) */
    content?: string;
    /** Entities used in the content */
    entities: MapDataItem[];
    /** SEO Metadata */
    metadata: {
        title: string;
        description: string;
    };
    /** GEO Readiness Score */
    geoScore: number;
    /** Strategic suggestions */
    suggestions: string[];
    /** Recommended internal links */
    recommendedInternalLinks?: string[];
    /** Suggested image descriptions/prompts */
    imageSuggestions?: string[];
}

/**
 * GEO Writer Skill
 */
export class GEOWriterSkill extends BaseSkill {
    name = 'geo-writer';
    description = 'Generate GEO-optimized content using real Google Maps business data for high citation probability.';
    version = '1.0.0';
    category: 'seo' = 'seo';

    protected preferredProvider: 'gemini' | 'claude' | 'deepseek' = 'deepseek';
    protected preferredModel = 'deepseek-chat';

    /**
     * Credit cost for this skill
     */
    static readonly COST = 50;

    protected getRequiredInputs(): string[] {
        return ['keywords'];
    }

    /**
     * Execute GEO writing
     */
    protected async executeInternal(
        input: GEOWriterInput
    ): Promise<{
        data: GEOWriterOutput;
        metadata: Partial<SkillExecutionMetadata>;
    }> {
        // 1. Fetch Map Data
        const mapData = await DataForSEOClient.searchGoogleMaps(
            input.keywords,
            input.location,
            5 // limit to 5 businesses
        );

        // 2. Prepare Prompt
        const provider = getProvider(this.preferredProvider);
        const prompt = this.buildGEOPrompt(input, mapData);

        // 3. Generate with AI
        const { response, cost } = await this.generateWithAI(provider, prompt, {
            model: this.preferredModel,
            temperature: 0.7,
        });

        // 4. Parse Response
        const result = this.parseGEOResponse(response.content, mapData);

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

    /**
     * Build the GEO writing prompt
     */
    private buildGEOPrompt(input: GEOWriterInput, entities: MapDataItem[]): string {
        const { keywords, location, tone, type, originalContent, auditOnly } = input;
        
        const entityContext = entities.length > 0 
            ? `## Local Entities Found (Real-world Data)
${entities.map(e => `- **${e.title}**: ${e.address || 'Unknown address'}. Rating: ${e.rating || 'N/A'} (${e.reviews_count || 0} reviews). ${e.website || ''}`).join('\n')}

Incorporate these real-world entities naturally into the content. AI search engines value specific, verifiable data points.`
            : 'No specific local entities found. Focus on general entity-based optimization.';

        const modeInstruction = auditOnly 
            ? "CRITICAL: You are in AUDIT MODE. Do NOT provide the rewritten content. Only analyze the keywords/entities/original content and provide a score and suggestions."
            : "CRITICAL: You are in REWRITE MODE. Provide the full optimized content and strategic metadata.";

        return `You are a specialist in Generative Engine Optimization (GEO) and SEO. Your goal is to ${auditOnly ? 'audit' : 'write/optimize'} content that is highly likely to be cited by AI search engines like Gemini, Perplexity, and ChatGPT.

${modeInstruction}

## User Input
- Keywords: ${keywords}
- Location: ${location || 'Global'}
- Tone: ${tone || 'professional'}
- Type: ${type || 'blog'}
${originalContent ? `\n## Original Content to Optimize\n${originalContent}\n` : ''}

${entityContext}

## GEO & SEO Strategies to Apply
1. **Direct Answer First (AEO)**: Provide a 1-sentence definitive answer in the first paragraph.
2. **Entity-Based Writing**: Bind facts to specific entities (like the ones found above).
3. **Information Gain**: Include unique perspectives or structured data (tables/lists).
4. **Technical SEO**: Optimize title, description, and internal linking structure.
5. **E-E-A-T**: Embed experience, expertise, authoritativeness, and trust signals.

## Output Format
Provide your response in JSON format:
\`\`\`json
{
  ${!auditOnly ? '"content": "# Markdown formatted content",' : ''}
  "metadata": {
    "title": "SEO Optimized Title",
    "description": "Meta description (120-160 chars)"
  },
  "geoScore": 85,
  "suggestions": ["suggestion 1", "suggestion 2", "..."],
  "recommendedInternalLinks": ["slug-1", "slug-2"],
  "imageSuggestions": ["Visual idea 1", "Visual idea 2"]
}
\`\`\`

Generate the response now.`;
    }

    /**
     * Parse AI response
     */
    private parseGEOResponse(content: string, entities: MapDataItem[]): GEOWriterOutput {
        const json = this.extractJSON<any>(content);
        
        return {
            content: json?.content,
            entities: entities,
            metadata: json?.metadata || {
                title: 'GEO Optimized Content',
                description: 'Content optimized for Generative Engines'
            },
            geoScore: json?.geoScore || 70,
            suggestions: json?.suggestions || [],
            recommendedInternalLinks: json?.recommendedInternalLinks || [],
            imageSuggestions: json?.imageSuggestions || []
        };
    }
}
