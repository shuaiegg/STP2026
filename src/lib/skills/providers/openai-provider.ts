/**
 * OpenAI Provider
 * Uses the @ai-sdk/openai package with the official OpenAI API endpoint
 */

import OpenAI from 'openai';
import { BaseAIProvider } from './base-provider';
import { AIModel, AIResponse, AIGenerateOptions } from '../types';
import { getProviderApiKey } from '@/lib/integrations/config';

export class OpenAIProvider extends BaseAIProvider {
    name: 'openai' = 'openai';

    models: AIModel[] = [
        {
            id: 'gpt-4o',
            provider: 'openai',
            displayName: 'GPT-4o',
            costPerKInput: 0.005,
            costPerKOutput: 0.015,
            maxTokens: 128000,
        },
        {
            id: 'gpt-4o-mini',
            provider: 'openai',
            displayName: 'GPT-4o Mini',
            costPerKInput: 0.00015,
            costPerKOutput: 0.0006,
            maxTokens: 128000,
        },
        {
            id: 'o3-mini',
            provider: 'openai',
            displayName: 'o3-mini (reasoning)',
            costPerKInput: 0.0011,
            costPerKOutput: 0.0044,
            maxTokens: 65536,
        },
    ];

    protected getApiKey(): string | undefined {
        return process.env.OPENAI_API_KEY;
    }

    private async resolveKey(): Promise<string> {
        const key = await getProviderApiKey('openai');
        if (!key) throw new Error('OpenAI API Key 未配置（env 或 DB）');
        return key;
    }

    /**
     * Generate content using OpenAI
     */
    async generateContent(
        prompt: string,
        options?: AIGenerateOptions
    ): Promise<AIResponse> {
        const modelId = options?.model || this.getDefaultModel().id;

        return this.withRetry(async () => {
            const client = new OpenAI({ apiKey: await this.resolveKey() });

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
     * Map OpenAI finish reason to our standard format
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
            console.error('OpenAI provider unavailable:', error);
            return false;
        }
    }
}
