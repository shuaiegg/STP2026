/**
 * Core type definitions for the AI Skills system
 */

// ==================== Skill Types ====================

/**
 * Input structure for skill execution
 */
export interface SkillInput {
    /** Main content to process (for content-based skills) */
    content?: string;
    /** Target keywords (for SEO skills) */
    keywords?: string[];
    /** Target URL (for SEO metadata) */
    url?: string;
    /** Brand name for entity binding */
    brandName?: string;
    /** Content type for SEO strategy */
    contentType?: 'TOFU' | 'MOFU' | 'BOFU';
    /** Additional custom parameters */
    [key: string]: any;
}

/**
 * Output structure from skill execution
 */
export interface SkillOutput<T = any> {
    /** Whether execution was successful */
    success: boolean;
    /** Skill-specific output data */
    data: T;
    /** Execution metadata */
    metadata: SkillExecutionMetadata;
    /** Error message if execution failed */
    error?: string;
}

/**
 * Metadata about skill execution
 */
export interface SkillExecutionMetadata {
    /** AI model used for execution */
    modelUsed: string;
    /** AI provider used (gemini, claude, etc.) */
    provider: string;
    /** Number of tokens consumed */
    tokensUsed?: number;
    /** Execution time in milliseconds */
    executionTime: number;
    /** Estimated cost in USD */
    cost?: number;
    /** Timestamp of execution */
    timestamp: Date;
}

// ==================== Skill Interface ====================

/**
 * Base interface that all skills must implement
 */
export interface ISkill {
    /** Unique skill identifier */
    name: string;
    /** Human-readable description */
    description: string;
    /** Skill version (semver) */
    version: string;
    /** Category for organization */
    category: 'seo' | 'content' | 'analysis' | 'other';
    /** Execute the skill with given input */
    execute(input: SkillInput): Promise<SkillOutput>;
    /** Validate input before execution */
    validateInput(input: SkillInput): { valid: boolean; errors?: string[] };
}

// ==================== AI Provider Types ====================

/**
 * Supported AI providers
 */
export type AIProviderName = 'gemini' | 'claude' | 'deepseek';

/**
 * AI model configurations
 */
export interface AIModel {
    /** Model identifier */
    id: string;
    /** Provider name */
    provider: AIProviderName;
    /** Model display name */
    displayName: string;
    /** Cost per 1k input tokens (USD) */
    costPerKInput: number;
    /** Cost per 1k output tokens (USD) */
    costPerKOutput: number;
    /** Maximum context window */
    maxTokens: number;
}

/**
 * Options for AI content generation
 */
export interface AIGenerateOptions {
    /** AI model to use */
    model?: string;
    /** Sampling temperature (0-1) */
    temperature?: number;
    /** Maximum tokens to generate */
    maxOutputTokens?: number;
    /** System prompt */
    systemPrompt?: string;
    /** Stop sequences */
    stopSequences?: string[];
}

/**
 * Response from AI provider
 */
export interface AIResponse {
    /** Generated text content */
    content: string;
    /** Input tokens used */
    inputTokens: number;
    /** Output tokens generated */
    outputTokens: number;
    /** Model used */
    model: string;
    /** Finish reason */
    finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
}

/**
 * Base interface for AI providers
 */
export interface IAIProvider {
    /** Provider name */
    name: AIProviderName;
    /** Available models */
    models: AIModel[];
    /** Generate content using AI */
    generateContent(
        prompt: string,
        options?: AIGenerateOptions
    ): Promise<AIResponse>;
    /** Estimate cost for token usage */
    estimateCost(inputTokens: number, outputTokens: number, model: string): number;
    /** Check if provider is available */
    isAvailable(): Promise<boolean>;
}

// ==================== Skill Registry Types ====================

/**
 * Skill metadata for registry
 */
export interface SkillMetadata {
    name: string;
    description: string;
    version: string;
    category: string;
    /** Required input fields */
    requiredInputs: string[];
    /** Optional input fields */
    optionalInputs: string[];
    /** Example input */
    exampleInput: SkillInput;
    /** Estimated cost per execution (USD) */
    estimatedCost: number;
}

// ==================== Execution Tracking Types ====================

/**
 * Skill execution record for database
 */
export interface SkillExecutionRecord {
    id: string;
    skillName: string;
    input: SkillInput;
    output: SkillOutput;
    status: 'success' | 'error';
    provider: string;
    modelUsed: string;
    tokensUsed?: number;
    cost?: number;
    executionTime: number;
    userId?: string;
    createdAt: Date;
}

/**
 * Daily usage statistics
 */
export interface SkillUsageStats {
    date: Date;
    totalCost: number;
    totalTokens: number;
    executionCount: number;
    skillBreakdown: {
        [skillName: string]: {
            count: number;
            cost: number;
            tokens: number;
        };
    };
}
