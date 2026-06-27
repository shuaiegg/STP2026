/**
 * Resolves which provider + model to use for a given business context.
 * Priority chain:
 *   1. ModelConfig[context-specific key] (DB)
 *   2. ModelConfig['skill_default'] (DB)
 *   3. DEFAULT_AI_PROVIDER env var
 *   4. Hardcoded fallback: vps
 */

import prisma from '@/lib/prisma';
import type { AIProviderName, AIResponse } from './types';
import { GeminiEmbeddingProvider } from './providers/gemini-embedding-provider';
import { getProvider } from './providers';

export interface ResolvedModel {
  provider: AIProviderName;
  modelId: string | undefined;
}

const VALID_PROVIDERS: AIProviderName[] = ['vps', 'claude', 'gemini', 'deepseek', 'openai'];

function isValidProvider(p: string): p is AIProviderName {
  return VALID_PROVIDERS.includes(p as AIProviderName);
}

export async function resolveModelForContext(context: string): Promise<ResolvedModel> {
  try {
    // 1. Per-context DB config
    const specific = await prisma.modelConfig.findUnique({ where: { context } });
    if (specific && isValidProvider(specific.provider)) {
      return { provider: specific.provider as AIProviderName, modelId: specific.modelId };
    }

    // 2. skill_default DB config (skip if we're already looking for skill_default)
    if (context !== 'skill_default') {
      const def = await prisma.modelConfig.findUnique({ where: { context: 'skill_default' } });
      if (def && isValidProvider(def.provider)) {
        return { provider: def.provider as AIProviderName, modelId: def.modelId };
      }
    }
  } catch {
    // DB unavailable — fall through to env
  }

  // 3. Env var fallback
  const envProvider = process.env.DEFAULT_AI_PROVIDER;
  if (envProvider && isValidProvider(envProvider)) {
    return { provider: envProvider, modelId: undefined };
  }

  // 4. Hardcoded fallback
  return { provider: 'vps', modelId: undefined };
}

export async function resolveSkillModel(skillId: string): Promise<ResolvedModel> {
  try {
    const perSkill = await prisma.modelConfig.findUnique({ where: { context: `skill:${skillId}` } });
    if (perSkill && isValidProvider(perSkill.provider)) {
      return { provider: perSkill.provider as AIProviderName, modelId: perSkill.modelId };
    }
  } catch {
    // fall through
  }
  return resolveModelForContext('skill_default');
}

const FALLBACK_CHAIN: AIProviderName[] = ['vps', 'deepseek', 'claude'];

/**
 * Resolve the primary model for `context`, then try the fixed fallback chain
 * [primary, vps, deepseek, claude] (deduped) until one succeeds.
 * Every failure is logged; the last error is re-thrown if all candidates fail.
 */
export async function generateWithFallback(
  prompt: string,
  opts: { context: string; temperature?: number; systemPrompt?: string },
): Promise<AIResponse> {
  const { context, temperature, systemPrompt } = opts;
  const resolved = await resolveModelForContext(context);

  const candidates: Array<{ provider: AIProviderName; modelId?: string }> = [
    { provider: resolved.provider, modelId: resolved.modelId },
  ];
  for (const fb of FALLBACK_CHAIN) {
    if (!candidates.some((c) => c.provider === fb)) candidates.push({ provider: fb });
  }

  let lastErr: unknown;
  for (const c of candidates) {
    try {
      return await getProvider(c.provider).generateContent(prompt, { model: c.modelId, temperature, systemPrompt });
    } catch (e) {
      lastErr = e;
      console.warn(
        `[generateWithFallback] context=${context} provider=${c.provider} failed, trying next:`,
        e instanceof Error ? e.message : e,
      );
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('All model providers failed');
}

/**
 * Returns a GeminiEmbeddingProvider configured with the model from ModelConfig[embedding].
 * Falls back to text-embedding-004 if no config saved.
 */
export async function resolveEmbeddingProvider(): Promise<{ provider: GeminiEmbeddingProvider; modelId: string }> {
  let modelId = 'text-embedding-004';
  try {
    const config = await prisma.modelConfig.findUnique({ where: { context: 'embedding' } });
    if (config?.modelId) modelId = config.modelId;
  } catch {
    // use default
  }
  return { provider: new GeminiEmbeddingProvider(), modelId };
}
