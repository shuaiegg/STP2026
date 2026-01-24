/**
 * SEO Optimizer Skill
 * 
 * Based on the seo-geo-writer skill from .agent/skills/
 * Optimizes content for both SEO and GEO (Generative Engine Optimization)
 */

import { BaseSkill } from '../base-skill';
import { SkillInput, SkillOutput, SkillExecutionMetadata } from '../types';
import { getProvider } from '../providers';

/**
 * Input structure for SEO optimization
 */
export interface SEOOptimizerInput extends SkillInput {
    /** Content to optimize */
    content: string;
    /** Target URL for canonical references */
    url?: string;
    /** Brand name for entity binding */
    brandName?: string;
    /** Content type: TOFU (awareness), MOFU (consideration), BOFU (decision) */
    contentType?: 'TOFU' | 'MOFU' | 'BOFU';
    /** Target keywords (optional - will be extracted if not provided) */
    keywords?: string[];
}

/**
 * Output structure from SEO optimization
 */
export interface SEOOptimizerOutput {
    /** Optimized content in markdown */
    optimizedContent: string;
    /** Concise 1-2 sentence summary */
    summary: string;
    /** SEO metadata */
    seoMetadata: {
        title: string;
        description: string;
        keywords: string[];
        slug: string;
        url?: string;
    };
    /** JSON-LD schema markup */
    schema: {
        article: object;
        faq?: object;
        breadcrumb?: object;
    };
    /** Suggested internal links */
    internalLinks: string[];
    /** Distribution snippets for social platforms */
    distributionSnippets?: {
        linkedin?: string;
        reddit?: string;
        twitter?: string;
    };
    /** GEO readiness score (0-100) */
    geoScore: number;
    /** Optimization suggestions */
    suggestions: string[];
}

/**
 * SEO Optimizer Skill
 * 
 * Implements the 9-step workflow from seo-geo-writer:
 * 1. Intent & Entity Analysis
 * 2. Direct Answer First (AEO)
 * 3. Modular Content Structure
 * 4. Information Gain
 * 5. E-E-A-T Signals
 * 6. Technical SEO
 * 7. Schema Generation
 * 8. Distribution Snippets (optional)
 * 9. GEO Audit
 */
export class SEOOptimizerSkill extends BaseSkill {
    name = 'seo-optimizer';
    description = 'Optimize content for SEO and GEO (AI citation). Creates optimized content, metadata, and schema markup.';
    version = '1.0.0';
    category: 'seo' = 'seo';

    protected preferredProvider: 'gemini' | 'claude' | 'deepseek' = 'deepseek';
    protected preferredModel = 'deepseek-chat';

    /**
     * Get required input fields
     */
    protected getRequiredInputs(): string[] {
        return ['content'];
    }

    /**
     * Execute SEO optimization
     */
    protected async executeInternal(
        input: SEOOptimizerInput
    ): Promise<{
        data: SEOOptimizerOutput;
        metadata: Partial<SkillExecutionMetadata>;
    }> {
        const provider = getProvider(this.preferredProvider);

        // Build the optimization prompt
        const prompt = this.buildOptimizationPrompt(input);

        // Generate optimized content
        const { response, cost } = await this.generateWithAI(provider, prompt, {
            model: this.preferredModel,
            temperature: 0.7,
            maxOutputTokens: 8000,
        });

        // Parse the AI response
        const optimized = this.parseOptimizationResponse(response.content, input);

        return {
            data: optimized,
            metadata: {
                modelUsed: response.model,
                provider: this.preferredProvider,
                tokensUsed: response.inputTokens + response.outputTokens,
                cost,
            },
        };
    }

    /**
     * Build the optimization prompt
     */
    private buildOptimizationPrompt(input: SEOOptimizerInput): string {
        const { content, contentType = 'MOFU', brandName, keywords, url } = input;

        return `You are an expert SEO and GEO (Generative Engine Optimization) specialist. Your task is to optimize content for both search engines and AI citation.

## Input Content
${content}

## Optimization Requirements

### Content Type: ${contentType}
${this.getContentTypeGuidance(contentType)}

${brandName ? `### Brand Name: ${brandName}\nBind the brand to frameworks or methodologies where applicable.\n` : ''}

${keywords ? `### Target Keywords: ${keywords.join(', ')}\n` : ''}

${url ? `### Target URL: ${url}\n` : ''}

## Optimization Steps

### 1. Intent & Entity Analysis
- Identify the primary search intent (informational, navigational, transactional)
- Define 1 primary entity and 3-5 secondary entities
- Extract 3-5 semantic long-tail keywords

### 2. Direct Answer First (AEO)
- Create a concise opening paragraph (≤50 words)
- Pattern: "{Topic} is {definition}. {Value statement}."
- Must be extractable by AI independently

### 3. Modular Content Structure
- Organize with clear H1/H2/H3 hierarchy
- Each H2 should solve one sub-question
- Use lists and tables for scannability
- No cross-references like "as mentioned above"

### 4. Information Gain
- Include at least ONE unique element:
  - Original data/statistics
  - Comparison table
  - Named framework (brand-attributed if possible)
  - Case study with specifics
  - Expert quote with attribution

### 5. E-E-A-T Signals
- Embed first-hand experience
- Include specific data and numbers
- Add authoritative citations

### 6. Technical SEO
- Title: 50-60 characters, keyword front-loaded
- Meta description: 120-160 characters with CTA
- Keywords: 5-8 relevant keywords
- Internal link suggestions

### 7. Schema Generation
- Generate JSON-LD for Article
- Include FAQ schema if applicable
- Add BreadcrumbList if relevant

### 8. GEO Audit
- Score the content (0-100) based on:
  - AI can extract core answer quickly
  - Contains unique information gain
  - Brand bound to method/framework
  - Clear next step (CTA)

## Output Format

Please provide your response in the following JSON format:

\`\`\`json
{
  "optimizedContent": "# Full optimized markdown content here (ensure newlines are escaped as \\n and double quotes as \\\")",
  "summary": "Concise 1-2 sentence summary (150-200 chars)",
  "seoMetadata": {
    "title": "SEO title (50-60 chars)",
    "description": "Meta description (120-160 chars)",
    "keywords": ["keyword1", "keyword2", "..."],
    "slug": "url-friendly-slug",
    "url": "${url || ''}"
  },
  "schema": {
    "article": { /* JSON-LD Article schema */ },
    "faq": { /* JSON-LD FAQ schema if applicable */ }
  },
  "internalLinks": ["related-article-slug-1", "related-article-slug-2"],
  "distributionSnippets": {
    "linkedin": "Professional framework-based LinkedIn post (2-3 paragraphs)",
    "reddit": "Authentic, experience-based Reddit comment (casual tone)",
    "twitter": "Concise Twitter thread (3-5 tweets, each <280 chars)"
  },
  "geoScore": 85,
  "suggestions": ["suggestion 1", "suggestion 2", "..."]
}
\`\`\`

IMPORTANT: 
1. Ensure the JSON is valid. 
2. Escape all double quotes inside strings with backslash (\").
3. Escape all newlines in the 'optimizedContent' and 'snippet' fields with \\n. Do not use actual line breaks within the JSON string values.
4. Do NOT output any text before or after the JSON block.

Generate the optimized content now.`;
    }

    /**
     * Get content type specific guidance
     */
    private getContentTypeGuidance(type: 'TOFU' | 'MOFU' | 'BOFU'): string {
        switch (type) {
            case 'TOFU':
                return '- Focus on awareness: What is X, Why X, Trends\n- Broad educational content\n- High-level concepts';
            case 'MOFU':
                return '- Focus on consideration: How to X, X vs Y, Frameworks\n- Practical guidance\n- Comparison and evaluation';
            case 'BOFU':
                return '- Focus on decision: X tools, X cost, Implementation\n- Specific solutions\n- Clear CTAs and next steps';
            default:
                return '';
        }
    }

    /**
     * Parse the AI response
     */
    private parseOptimizationResponse(
        content: string,
        input: SEOOptimizerInput
    ): SEOOptimizerOutput {
        // Try to extract JSON from the response
        const json = this.extractJSON<SEOOptimizerOutput>(content);

        if (json) {
            return json;
        }

        // Fallback: If JSON parsing fails, create a basic structure
        console.warn('Failed to parse JSON from AI response, creating fallback structure');

        return {
            optimizedContent: this.cleanText(content),
            summary: this.extractDescription(content) || 'SEO optimized content',
            seoMetadata: {
                title: this.extractTitle(content) || 'Optimized Content',
                description: this.extractDescription(content) || 'SEO optimized content',
                keywords: input.keywords || [],
                slug: this.generateSlug(this.extractTitle(content) || 'optimized-content'),
                url: input.url,
            },
            schema: {
                article: this.generateBasicArticleSchema(input),
            },
            internalLinks: [],
            geoScore: 50,
            suggestions: ['Review and manually optimize the content'],
        };
    }

    /**
     * Generate URL-friendly slug from title
     */
    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 60);
    }

    /**
     * Extract title from content
     */
    private extractTitle(content: string): string | null {
        const match = content.match(/^#\s+(.+)$/m);
        return match ? match[1].trim().slice(0, 60) : null;
    }

    /**
     * Extract description from content
     */
    private extractDescription(content: string): string | null {
        // Find first paragraph after H1
        const match = content.match(/^#\s+.+$\n+(.+)/m);
        if (match) {
            return match[1].trim().slice(0, 160);
        }
        return null;
    }

    /**
     * Generate basic Article schema
     */
    private generateBasicArticleSchema(input: SEOOptimizerInput): object {
        return {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: this.extractTitle(input.content) || 'Article',
            author: {
                '@type': 'Organization',
                name: input.brandName || 'Organization',
            },
            datePublished: new Date().toISOString(),
            url: input.url,
        };
    }

    /**
     * Example input for documentation
     */
    exampleInput: SEOOptimizerInput = {
        content: `# What is SEO?

SEO stands for Search Engine Optimization. It's the practice of optimizing your website to rank higher in search results.

## Why is SEO Important?

SEO helps drive organic traffic to your website...`,
        contentType: 'TOFU',
        brandName: 'MyBrand',
        url: 'https://example.com/what-is-seo',
    };
}
