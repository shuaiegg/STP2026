/**
 * Anthropic Claude AI Provider
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './base-provider';
import { AIModel, AIResponse, AIGenerateOptions } from '../types';

export class ClaudeProvider extends BaseAIProvider {
    name: 'claude' = 'claude';

    models: AIModel[] = [
        {
            id: 'claude-3-5-sonnet-20241022',
            provider: 'claude',
            displayName: 'Claude 3.5 Sonnet',
            costPerKInput: 0.003,
            costPerKOutput: 0.015,
            maxTokens: 200000,
        },
        {
            id: 'claude-3-5-haiku-20241022',
            provider: 'claude',
            displayName: 'Claude 3.5 Haiku',
            costPerKInput: 0.0008,
            costPerKOutput: 0.004,
            maxTokens: 200000,
        },
        {
            id: 'claude-3-opus-20240229',
            provider: 'claude',
            displayName: 'Claude 3 Opus',
            costPerKInput: 0.015,
            costPerKOutput: 0.075,
            maxTokens: 200000,
        },
    ];

    private client: Anthropic | null = null;

    /**
     * Get API key from environment
     */
    protected getApiKey(): string | undefined {
        return process.env.ANTHROPIC_API_KEY;
    }

    /**
     * Get or initialize Claude client
     */
    private getClient(): Anthropic {
        if (!this.client) {
            const apiKey = this.getApiKey();
            if (!apiKey) {
                throw new Error('ANTHROPIC_API_KEY not found in environment variables');
            }
            this.client = new Anthropic({ apiKey });
        }
        return this.client;
    }

    /**
     * Generate content using Claude
     */
    async generateContent(
        prompt: string,
        options?: AIGenerateOptions
    ): Promise<AIResponse> {
        const modelId = options?.model || this.getDefaultModel().id;

        return this.withRetry(async () => {
            const client = this.getClient();

            const requestParams: Anthropic.MessageCreateParams = {
                model: modelId,
                max_tokens: options?.maxOutputTokens ?? 4096,
                temperature: options?.temperature ?? 0.7,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            };

            // Add system prompt if provided
            if (options?.systemPrompt) {
                requestParams.system = options.systemPrompt;
            }

            // Add stop sequences if provided
            if (options?.stopSequences) {
                requestParams.stop_sequences = options.stopSequences;
            }

            // Generate content
            const response = await client.messages.create(requestParams);

            // Extract text from content blocks
            const text = response.content
                .filter(block => block.type === 'text')
                .map(block => (block as any).text)
                .join('\n');

            return {
                content: text,
                inputTokens: response.usage.input_tokens,
                outputTokens: response.usage.output_tokens,
                model: modelId,
                finishReason: this.mapStopReason(response.stop_reason),
            };
        });
    }

    /**
     * Map Claude stop reason to our standard format
     */
    private mapStopReason(reason: string | null): AIResponse['finishReason'] {
        if (!reason) return 'stop';

        switch (reason) {
            case 'end_turn':
                return 'stop';
            case 'max_tokens':
                return 'length';
            case 'stop_sequence':
                return 'stop';
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
            if (!hasKey) return false;

            // Claude doesn't have a simple health check, so we'll just verify the key exists
            return true;
        } catch (error) {
            console.error('Claude provider unavailable:', error);
            return false;
        }
    }
}
