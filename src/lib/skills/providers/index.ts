
/**
 * AI Provider Factory and Exports
 */

export * from './base-provider';
export * from './gemini-provider';
export * from './claude-provider';
export * from './deepseek-provider';
export * from './vps-provider';
export * from './openai-provider';

import { IAIProvider, AIProviderName } from '../types';
import { GeminiProvider } from './gemini-provider';
import { ClaudeProvider } from './claude-provider';
import { DeepSeekProvider } from './deepseek-provider';
import { VPSProvider } from './vps-provider';
import { OpenAIProvider } from './openai-provider';

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
        case 'vps':
            provider = new VPSProvider();
            break;
        case 'gemini':
            provider = new GeminiProvider();
            break;
        case 'claude':
            provider = new ClaudeProvider();
            break;
        case 'deepseek':
            provider = new DeepSeekProvider();
            break;
        case 'openai':
            provider = new OpenAIProvider();
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

    const providerNames: AIProviderName[] = ['vps', 'gemini', 'claude', 'deepseek', 'openai'];

    for (const name of providerNames) {
        try {
            const provider = getProvider(name);
            // vps-provider assumes availability if the VPS is up
            available.push(name);
        } catch (error) {
            console.warn(`Provider ${name} check failed:`, error);
        }
    }

    return available;
}

/**
 * Get the default provider, respecting ModelConfig DB settings.
 * Falls back to DEFAULT_AI_PROVIDER env var → 'vps' → 'deepseek'.
 */
export async function getDefaultProvider(): Promise<IAIProvider> {
    try {
        const { resolveModelForContext } = await import('../model-resolver');
        const resolved = await resolveModelForContext('skill_default');
        return getProvider(resolved.provider);
    } catch {
        // DB unavailable or resolver failed — use env var fallback
    }

    const preferred = (process.env.DEFAULT_AI_PROVIDER || 'vps') as AIProviderName;
    try {
        return getProvider(preferred);
    } catch {
        return getProvider('deepseek');
    }
}
