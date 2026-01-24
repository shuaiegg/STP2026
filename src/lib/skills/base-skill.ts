/**
 * Abstract base class for all skills
 * Provides common functionality like timing, error handling, and validation
 */

import {
    ISkill,
    SkillInput,
    SkillOutput,
    IAIProvider,
    AIGenerateOptions,
    AIResponse,
    SkillExecutionMetadata,
} from './types';

export abstract class BaseSkill implements ISkill {
    abstract name: string;
    abstract description: string;
    abstract version: string;
    abstract category: 'seo' | 'content' | 'analysis' | 'other';

    /**
     * Preferred AI provider for this skill
     */
    protected preferredProvider: 'gemini' | 'claude' | 'deepseek' = 'gemini';

    /**
     * Preferred model for this skill
     */
    protected preferredModel?: string;

    /**
     * Execute the skill with timing and error handling
     */
    async execute(input: SkillInput): Promise<SkillOutput> {
        const startTime = Date.now();

        try {
            // Validate input
            const validation = this.validateInput(input);
            if (!validation.valid) {
                return {
                    success: false,
                    data: null,
                    metadata: {
                        modelUsed: 'none',
                        provider: 'none',
                        executionTime: Date.now() - startTime,
                        timestamp: new Date(),
                        tokensUsed: 0,
                        cost: 0,
                    },
                    error: `Input validation failed: ${validation.errors?.join(', ')}`,
                };
            }

            // Execute the skill-specific logic
            const result = await this.executeInternal(input);

            return {
                success: true,
                data: result.data,
                metadata: {
                    modelUsed: result.metadata.modelUsed || 'unknown',
                    provider: result.metadata.provider || 'unknown',
                    tokensUsed: result.metadata.tokensUsed || 0,
                    cost: result.metadata.cost || 0,
                    executionTime: Date.now() - startTime,
                    timestamp: new Date(),
                },
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                metadata: {
                    modelUsed: 'error',
                    provider: 'error',
                    executionTime: Date.now() - startTime,
                    timestamp: new Date(),
                    tokensUsed: 0,
                    cost: 0,
                },
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Validate input before execution
     * Override this in subclasses for custom validation
     */
    validateInput(input: SkillInput): { valid: boolean; errors?: string[] } {
        const errors: string[] = [];
        const required = this.getRequiredInputs();

        for (const field of required) {
            if (!(field in input) || input[field] === undefined || input[field] === null) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }

    /**
     * Internal execution logic - must be implemented by subclasses
     */
    protected abstract executeInternal(
        input: SkillInput
    ): Promise<{
        data: any;
        metadata: Partial<SkillExecutionMetadata>;
    }>;

    /**
     * Get required input fields - override in subclasses
     */
    protected getRequiredInputs(): string[] {
        return [];
    }

    /**
     * Helper method to generate content using AI provider
     */
    protected async generateWithAI(
        provider: IAIProvider,
        prompt: string,
        options?: AIGenerateOptions
    ): Promise<{ response: AIResponse; cost: number }> {
        const response = await provider.generateContent(prompt, {
            model: options?.model || this.preferredModel,
            ...options,
        });

        const cost = provider.estimateCost(
            response.inputTokens,
            response.outputTokens,
            response.model
        );

        return { response, cost };
    }

    /**
     * Helper method to build a structured prompt
     */
    protected buildPrompt(
        systemPrompt: string,
        userPrompt: string,
        context?: Record<string, any>
    ): string {
        let prompt = `${systemPrompt}\n\n`;

        if (context) {
            prompt += '## Context\n';
            for (const [key, value] of Object.entries(context)) {
                prompt += `- **${key}**: ${JSON.stringify(value)}\n`;
            }
            prompt += '\n';
        }

        prompt += `## Task\n${userPrompt}`;

        return prompt;
    }

    /**
     * Helper method to extract JSON from AI response
     */
    protected extractJSON<T = any>(content: string): T | null {
        try {
            // Try to find JSON in code blocks first
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }

            // Try to find JSON object
            const objectMatch = content.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                return JSON.parse(objectMatch[0]);
            }

            // Try to parse the whole content
            return JSON.parse(content);
        } catch (error) {
            console.error('Failed to extract JSON from AI response:', error);
            return null;
        }
    }

    /**
     * Helper method to clean and normalize text
     */
    protected cleanText(text: string): string {
        return text
            .trim()
            .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
            .replace(/\s+$/gm, ''); // Remove trailing spaces from each line
    }

    /**
     * Get skill metadata
     */
    getMetadata() {
        return {
            name: this.name,
            description: this.description,
            version: this.version,
            category: this.category,
            requiredInputs: this.getRequiredInputs(),
            preferredProvider: this.preferredProvider,
            preferredModel: this.preferredModel,
        };
    }
}
