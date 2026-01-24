/**
 * Google Gemini AI Provider
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { BaseAIProvider } from './base-provider';
import { AIModel, AIResponse, AIGenerateOptions } from '../types';

export class GeminiProvider extends BaseAIProvider {
    name: 'gemini' = 'gemini';

    models: AIModel[] = [
        {
            id: 'gemini-pro',
            provider: 'gemini',
            displayName: 'Gemini Pro',
            costPerKInput: 0.00125,
            costPerKOutput: 0.005,
            maxTokens: 1000000,
        },
        {
            id: 'gemini-1.5-flash',
            provider: 'gemini',
            displayName: 'Gemini 1.5 Flash',
            costPerKInput: 0.000075,
            costPerKOutput: 0.0003,
            maxTokens: 1000000,
        },
        {
            id: 'gemini-1.5-pro',
            provider: 'gemini',
            displayName: 'Gemini 1.5 Pro',
            costPerKInput: 0.00125,
            costPerKOutput: 0.005,
            maxTokens: 2000000,
        },
    ];

    private client: GoogleGenerativeAI | null = null;

    /**
     * Get API key from environment
     */
    protected getApiKey(): string | undefined {
        return process.env.GEMINI_API_KEY;
    }

    /**
     * Get or initialize Gemini client
     */
    private getClient(): GoogleGenerativeAI {
        if (!this.client) {
            const apiKey = this.getApiKey();
            if (!apiKey) {
                throw new Error('GEMINI_API_KEY not found in environment variables');
            }
            this.client = new GoogleGenerativeAI(apiKey);
        }
        return this.client;
    }

    /**
     * Get a generative model instance
     */
    private getGeminiModel(modelId: string): GenerativeModel {
        const client = this.getClient();
        return client.getGenerativeModel({ model: modelId });
    }

    /**
     * Generate content using Gemini
     */
    async generateContent(
        prompt: string,
        options?: AIGenerateOptions
    ): Promise<AIResponse> {
        const modelId = options?.model || this.getDefaultModel().id;

        return this.withRetry(async () => {
            const model = this.getGeminiModel(modelId);

            const generationConfig: any = {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxOutputTokens ?? 8192,
            };

            if (options?.stopSequences) {
                generationConfig.stopSequences = options.stopSequences;
            }

            // Build the content parts
            const parts: any[] = [];

            if (options?.systemPrompt) {
                parts.push({ text: options.systemPrompt });
            }

            parts.push({ text: prompt });

            // Generate content
            const result = await model.generateContent({
                contents: [{ role: 'user', parts }],
                generationConfig,
            });

            const response = result.response;
            const text = response.text();

            // Extract token usage from response metadata
            const usageMetadata = response.usageMetadata;
            const inputTokens = usageMetadata?.promptTokenCount || this.estimateTokenCount(prompt);
            const outputTokens = usageMetadata?.candidatesTokenCount || this.estimateTokenCount(text);

            return {
                content: text,
                inputTokens,
                outputTokens,
                model: modelId,
                finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
            };
        });
    }

    /**
     * Map Gemini finish reason to our standard format
     */
    private mapFinishReason(reason: string | undefined): AIResponse['finishReason'] {
        if (!reason) return 'stop';

        switch (reason) {
            case 'STOP':
                return 'stop';
            case 'MAX_TOKENS':
                return 'length';
            case 'SAFETY':
            case 'RECITATION':
                return 'content_filter';
            default:
                return 'error';
        }
    }

    /**
     * Check if provider is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const hasKey = await super.isAvailable();
            return hasKey;
        } catch (error) {
            console.error('Gemini provider unavailable:', error);
            return false;
        }
    }
}
