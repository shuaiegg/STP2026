/**
 * AI Provider Factory and Exports
 */

export * from './base-provider';
export * from './gemini-provider';
export * from './claude-provider';
export * from './deepseek-provider';

import { IAIProvider, AIProviderName } from '../types';
import { GeminiProvider } from './gemini-provider';
import { ClaudeProvider } from './claude-provider';
import { DeepSeekProvider } from './deepseek-provider';

/**
 * Provider registry - singleton instances
 */
const providers: Map<AIProviderName, IAIProvider> = new Map();

/**
 * Get an AI provider instance (singleton)
 */
export function getProvider(name: AIProviderName): IAIProvider {
    // Return cached instance if exists
    if (providers.has(name)) {
        return providers.get(name)!;
    }

    // Create new instance
    let provider: IAIProvider;
    switch (name) {
        case 'gemini':
            provider = new GeminiProvider();
            break;
        case 'claude':
            provider = new ClaudeProvider();
            break;
        case 'deepseek':
            provider = new DeepSeekProvider();
            break;
        default:
            throw new Error(`Unknown provider: ${name}`);
    }

    // Cache and return
    providers.set(name, provider);
    return provider;
}

/**
 * Get all available providers
 */
export async function getAvailableProviders(): Promise<AIProviderName[]> {
    const available: AIProviderName[] = [];

    const providerNames: AIProviderName[] = ['gemini', 'claude', 'deepseek'];

    for (const name of providerNames) {
        try {
            const provider = getProvider(name);
            if (await provider.isAvailable()) {
                available.push(name);
            }
        } catch (error) {
            console.warn(`Provider ${name} check failed:`, error);
        }
    }

    return available;
}

/**
 * Get the default provider based on environment configuration
 */
export async function getDefaultProvider(): Promise<IAIProvider> {
    // Check environment variable for preferred provider
    const preferred = (process.env.DEFAULT_AI_PROVIDER || 'deepseek') as AIProviderName;

    try {
        const provider = getProvider(preferred);
        if (await provider.isAvailable()) {
            return provider;
        }
    } catch (error) {
        console.warn(`Preferred provider ${preferred} not available:`, error);
    }

    // Fallback to first available provider
    const available = await getAvailableProviders();
    if (available.length === 0) {
        throw new Error('No AI providers available. Please configure GEMINI_API_KEY, ANTHROPIC_API_KEY, or DEEPSEEK_API_KEY');
    }

    return getProvider(available[0]);
}

/**
 * Get provider statistics
 */
export function getProviderStats() {
    const stats: Record<AIProviderName, { models: number; cached: boolean }> = {} as any;

    const allProviders: AIProviderName[] = ['gemini', 'claude', 'deepseek'];

    for (const name of allProviders) {
        const cached = providers.has(name);
        const provider = cached ? providers.get(name)! : getProvider(name);

        stats[name] = {
            models: provider.models.length,
            cached,
        };
    }

    return stats;
}
