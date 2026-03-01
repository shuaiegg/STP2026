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
    userPrompt: string;
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
