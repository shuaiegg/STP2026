export interface IntelligenceContext {
    keywords: string;
    location: string;
    language: string;
    serpAnalysis?: any;
    entities: any[];
    topics: any[];
    competitors: any[];
    internalContent: any[];
    timestamp: number;
}

export interface PromptStrategy {
    systemPrompt: string;
    buildFullArticlePrompt: (outline: any[]) => string;
    model: string;
    temperature: number;
}

export interface GenerationAsset {
    content: string;
    summary: string;
    metadata: {
        title: string;
        description: string;
        keywords: string[];
        slug: string;
    };
    schema: any;
    scores: {
        seo: number;
        geo: number;
        human: number;
    };
}

// ==================== Skill-Level Types ====================

export interface StellarWriterInput {
    keywords: string;
    location?: string;
    brandName?: string;
    tone?: string;
    type?: string;
    originalContent?: string;
    url?: string;
    autoVisuals?: boolean;
    researchMode?: 'discovery' | 'deep_analysis' | 'full' | 'section_regenerate';
    /** For section_regenerate mode */
    sectionHeading?: string;
    sectionContent?: string;
    sectionInstruction?: string;
    /** Cached intelligence from previous steps */
    cachedIntelligence?: IntelligenceContext;
    /** User-provided or pre-generated outline */
    masterOutline?: any[];
}

export interface StellarWriterOutput {
    content: string;
    summary: string;
    seoMetadata: {
        title: string;
        description: string;
        keywords: string[];
        slug: string;
    };
    schema: any;
    entities: any[];
    topics: any[];
    competitors: any[];
    internalLinks: string[];
    imageSuggestions: string[];
    distribution: {
        twitter?: { thread: string[]; hashtags: string[] };
        linkedin?: { post: string; hashtags: string[] };
    };
    scores: {
        seo: number;
        geo: number;
    };
    humanScore: number;
    suggestions: string[];
    serpAnalysis?: any;
    masterOutline?: any[];
}
