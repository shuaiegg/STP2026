
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

const VPS_BASE_URL = process.env.VPS_GATEWAY_URL || 'http://154.12.243.94:8317/v1';
const VPS_API_KEY = process.env.VPS_GATEWAY_KEY || 'sk-5DLE3ByOrXqKOkE5i';

export const vpsClient = createOpenAI({
    baseURL: VPS_BASE_URL,
    apiKey: VPS_API_KEY,
});

/**
 * Priority-ordered model fallback chain.
 */
export const MODEL_CHAIN = {
    /** High-quality creative/editorial tasks (articles, rewrites) */
    premium: ['gemini-3.1-pro-high', 'claude-opus-4-5-20251101', 'gpt-oss-120b-medium'],
    /** Fast tasks (scoring, classification, short outputs) */
    fast: ['gemini-2.5-flash', 'claude-3-5-haiku-20241022', 'gpt-oss-120b-medium'],
};

type GenerateParams = Omit<Parameters<typeof generateText>[0], 'model'> & {
    messages: NonNullable<Parameters<typeof generateText>[0]['messages']>;
};

type StreamParams = Omit<Parameters<typeof streamText>[0], 'model'> & {
    messages: NonNullable<Parameters<typeof streamText>[0]['messages']>;
};

/**
 * Attempts `generateText` across a list of models in priority order.
 * Automatically falls back to the next model on any error.
 */
export async function generateWithFallback(
    models: string[],
    params: GenerateParams
): Promise<Awaited<ReturnType<typeof generateText>>> {
    let lastError: unknown;

    for (let i = 0; i < models.length; i++) {
        const modelId = models[i];
        try {
            if (i > 0) console.log(`🔄 [VPS-Fallback] Retrying with model: ${modelId}`);
            const result = await generateText({ model: vpsClient(modelId), ...(params as any) });
            if (i > 0) console.log(`✅ [VPS-Fallback] Succeeded with fallback model: ${modelId}`);
            return result;
        } catch (err: any) {
            console.warn(`⚠️ [VPS-Fallback] Model "${modelId}" failed: ${err?.message || err}`);
            lastError = err;
        }
    }

    throw new Error(`All models in the fallback chain failed. Last error: ${(lastError as any)?.message}`);
}

/**
 * Attempts `streamText` across a list of models in priority order.
 * Automatically falls back to the next model on any error.
 */
export async function streamWithFallback(
    models: string[],
    params: StreamParams
): Promise<Awaited<ReturnType<typeof streamText>>> {
    let lastError: unknown;

    for (let i = 0; i < models.length; i++) {
        const modelId = models[i];
        try {
            if (i > 0) console.log(`🔄 [VPS-Fallback] Retrying stream with model: ${modelId}`);
            const result = await streamText({ model: vpsClient(modelId), ...(params as any) });
            if (i > 0) console.log(`✅ [VPS-Fallback] Streaming succeeded with fallback model: ${modelId}`);
            return result;
        } catch (err: any) {
            console.warn(`⚠️ [VPS-Fallback] Stream model "${modelId}" failed: ${err?.message || err}`);
            lastError = err;
        }
    }

    throw new Error(`All stream models in fallback chain failed. Last error: ${(lastError as any)?.message}`);
}
