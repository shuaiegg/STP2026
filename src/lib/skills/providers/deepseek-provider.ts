/**
 * DeepSeek AI Provider
 * Uses OpenAI-compatible API
 */

import OpenAI from 'openai';
import { BaseAIProvider } from './base-provider';
import { AIModel, AIResponse, AIGenerateOptions } from '../types';

export class DeepSeekProvider extends BaseAIProvider {
    name: 'deepseek' = 'deepseek';

    models: AIModel[] = [
        {
            id: 'deepseek-chat',
            provider: 'deepseek',
            displayName: 'DeepSeek Chat',
            costPerKInput: 0.00014,  // $0.14 per 1M tokens
            costPerKOutput: 0.00028, // $0.28 per 1M tokens
            maxTokens: 64000,
        },
        {
            id: 'deepseek-coder',
            provider: 'deepseek',
            displayName: 'DeepSeek Coder',
            costPerKInput: 0.00014,
            costPerKOutput: 0.00028,
            maxTokens: 64000,
        },
    ];

    private client: OpenAI | null = null;

    /**
     * Get API key from environment
     */
    protected getApiKey(): string | undefined {
        return process.env.DEEPSEEK_API_KEY;
    }

    /**
     * Get or initialize DeepSeek client
     */
    private getClient(): OpenAI {
        if (!this.client) {
            const apiKey = this.getApiKey();
            if (!apiKey) {
                throw new Error('DEEPSEEK_API_KEY not found in environment variables');
            }
            this.client = new OpenAI({
                apiKey,
                baseURL: 'https://api.deepseek.com',
            });
        }
        return this.client;
    }

    /**
     * Generate content using DeepSeek
     */
    async generateContent(
        prompt: string,
        options?: AIGenerateOptions
    ): Promise<AIResponse> {
        const modelId = options?.model || this.getDefaultModel().id;

        return this.withRetry(async () => {
            const client = this.getClient();

            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

            // Add system prompt if provided
            if (options?.systemPrompt) {
                messages.push({
                    role: 'system',
                    content: options.systemPrompt,
                });
            }

            // Add user prompt
            messages.push({
                role: 'user',
                content: prompt,
            });

            // Generate content
            const response = await client.chat.completions.create({
                model: modelId,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxOutputTokens ?? 4096,
                stop: options?.stopSequences,
            });

            const choice = response.choices[0];
            const content = choice.message.content || '';

            return {
                content,
                inputTokens: response.usage?.prompt_tokens || this.estimateTokenCount(prompt),
                outputTokens: response.usage?.completion_tokens || this.estimateTokenCount(content),
                model: modelId,
                finishReason: this.mapFinishReason(choice.finish_reason),
            };
        });
    }

    /**
     * Map DeepSeek finish reason to our standard format
     */
    private mapFinishReason(reason: string | null | undefined): AIResponse['finishReason'] {
        if (!reason) return 'stop';

        switch (reason) {
            case 'stop':
                return 'stop';
            case 'length':
                return 'length';
            case 'content_filter':
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
            console.error('DeepSeek provider unavailable:', error);
            return false;
        }
    }
}
