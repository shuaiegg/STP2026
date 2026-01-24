/**
 * Base AI Provider implementation
 * Provides common functionality for all AI providers
 */

import { IAIProvider, AIModel, AIResponse, AIGenerateOptions } from '../types';

export abstract class BaseAIProvider implements IAIProvider {
    abstract name: 'gemini' | 'claude' | 'deepseek';
    abstract models: AIModel[];

    /**
     * Generate content - must be implemented by subclasses
     */
    abstract generateContent(
        prompt: string,
        options?: AIGenerateOptions
    ): Promise<AIResponse>;

    /**
     * Check if provider is available (has API key configured)
     */
    async isAvailable(): Promise<boolean> {
        const apiKey = this.getApiKey();
        return !!apiKey && apiKey.length > 0;
    }

    /**
     * Get API key from environment
     */
    protected abstract getApiKey(): string | undefined;

    /**
     * Estimate cost based on token usage
     */
    estimateCost(inputTokens: number, outputTokens: number, modelId: string): number {
        const model = this.models.find(m => m.id === modelId);
        if (!model) {
            console.warn(`Model ${modelId} not found, using default cost`);
            return 0;
        }

        const inputCost = (inputTokens / 1000) * model.costPerKInput;
        const outputCost = (outputTokens / 1000) * model.costPerKOutput;

        return inputCost + outputCost;
    }

    /**
     * Get default model for this provider
     */
    getDefaultModel(): AIModel {
        return this.models[0];
    }

    /**
     * Get model by ID
     */
    getModel(modelId: string): AIModel | undefined {
        return this.models.find(m => m.id === modelId);
    }

    /**
     * Handle rate limiting with exponential backoff
     */
    protected async withRetry<T>(
        fn: () => Promise<T>,
        maxRetries: number = 3,
        baseDelay: number = 1000
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;

                // Check if it's a rate limit error
                const isRateLimit = this.isRateLimitError(error);

                if (!isRateLimit || attempt === maxRetries - 1) {
                    throw error;
                }

                // Exponential backoff
                const delay = baseDelay * Math.pow(2, attempt);
                console.warn(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                await this.sleep(delay);
            }
        }

        throw lastError || new Error('Max retries exceeded');
    }

    /**
     * Check if error is a rate limit error
     */
    protected isRateLimitError(error: any): boolean {
        const message = error?.message?.toLowerCase() || '';
        const status = error?.status || error?.statusCode;

        return (
            status === 429 ||
            message.includes('rate limit') ||
            message.includes('too many requests')
        );
    }

    /**
     * Sleep helper
     */
    protected sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Count tokens (approximate)
     * Uses a simple heuristic: ~4 characters per token for English text
     */
    protected estimateTokenCount(text: string): number {
        return Math.ceil(text.length / 4);
    }
}
