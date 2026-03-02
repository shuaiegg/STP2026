
/**
 * AI Provider Factory and Exports
 */

export * from './base-provider';
export * from './gemini-provider';
export * from './claude-provider';
export * from './deepseek-provider';
export * from './vps-provider';

import { IAIProvider, AIProviderName } from '../types';
import { GeminiProvider } from './gemini-provider';
import { ClaudeProvider } from './claude-provider';
import { DeepSeekProvider } from './deepseek-provider';
import { VPSProvider } from './vps-provider';

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

    const providerNames: AIProviderName[] = ['vps', 'gemini', 'claude', 'deepseek'];

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
 * Get the default provider based on environment configuration
 */
export async function getDefaultProvider(): Promise<IAIProvider> {
    // FORCE DEFAULT TO VPS
    const preferred = (process.env.DEFAULT_AI_PROVIDER || 'vps') as AIProviderName;

    try {
        const provider = getProvider(preferred);
        return provider;
    } catch (error) {
        console.warn(`Preferred provider ${preferred} not available:`, error);
    }

    // Fallback to deepseek
    return getProvider('deepseek');
}
