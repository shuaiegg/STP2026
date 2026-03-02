
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai'; // <--- CORRECT IMPORT
import { StrategyComposer } from '@/lib/skills/skills/stellar/StrategyComposer';
import { IntelligenceContext } from '@/lib/skills/skills/stellar/types';
import { humanizePro } from '@/lib/utils/humanize';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { chargeUser } from '@/lib/billing/credits';

export const maxDuration = 300;

// 1. CONFIGURE CLOUD PROXY CLIENT
const vpsProxy = createOpenAI({
    baseURL: "http://154.12.243.94:8317/v1",
    apiKey: "sk-5DLE3ByOrXqKOkE5i",
});

/**
 * FAILOVER MODEL RESOLVER
 * Attempts to find a working model before starting the stream
 */
async function resolveWorkingModel(models: string[]) {
    // Note: We probe the models endpoint to check VPS connectivity
    try {
        const probe = await fetch("http://154.12.243.94:8317/v1/models", {
            headers: { 'Authorization': `Bearer sk-5DLE3ByOrXqKOkE5i` }
        });
        if (!probe.ok) throw new Error("VPS Gateway Down");

        // If gateway is up, we trust the model list for now or pick the first candidate
        // In a real prod env, we'd probe each specific model
        return models[0];
    } catch (e) {
        console.warn(`⚠️ [Stream-Failover] Gateway probe failed. Falling back to next candidate.`);
        return models[1] || models[0];
    }
}

/**
 * LIVE HUMANIZER INTERCEPTOR
 */
function createHumanizerStream(readable: ReadableStream) {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = '';

    return new ReadableStream({
        async start(controller) {
            const reader = readable.getReader();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        if (buffer) {
                            // Process remaining buffer
                            const line = buffer;
                            if (line.trim().startsWith('#')) {
                                controller.enqueue(encoder.encode(line));
                            } else {
                                controller.enqueue(encoder.encode(humanizePro(line)));
                            }
                        }
                        controller.close();
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });

                    // Process line by line to protect headings
                    let newlineIndex;
                    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                        const line = buffer.slice(0, newlineIndex + 1); // keep the newline
                        buffer = buffer.slice(newlineIndex + 1);

                        // If it's a markdown heading, bypass humanizer entirely
                        if (line.trim().startsWith('#')) {
                            controller.enqueue(encoder.encode(line));
                        } else {
                            // Only humanize body text
                            controller.enqueue(encoder.encode(humanizePro(line)));
                        }
                    }
                }
            } catch (e) { controller.error(e); }
        }
    });
}

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || !session.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

        const { input, cachedIntelligence } = await req.json();

        // Billing check
        const chargeResult = await chargeUser(session.user.id, 'GEO_WRITER_FULL', `GEO Writer: ${input.keywords}`);
        if (!chargeResult.success) return new Response(JSON.stringify({ error: chargeResult.error }), { status: 402 });

        const intelligenceContext: IntelligenceContext = {
            keywords: input.keywords || 'SaaS Growth',
            location: input.location || 'United States',
            entities: cachedIntelligence?.entities || [],
            topics: cachedIntelligence?.topics || [],
            serpAnalysis: cachedIntelligence?.serpAnalysis || {},
            competitors: cachedIntelligence?.competitors || [],
            language: 'en',
            timestamp: Date.now(),
            internalContent: []
        };

        const strategy = StrategyComposer.compose(intelligenceContext, input);

        // 2. RESOLVE BEST AVAILABLE MODEL (Auto-Failover Choice)
        const candidates = ['gemini-3.1-pro-high', 'claude-opus-4-5-20251101', 'gpt-oss-120b-medium'];
        const targetModelId = await resolveWorkingModel(candidates);
        console.log(`🚀 [Stream-Start] Selected Backbone: ${targetModelId}`);

        // 3. TRIGGER CLOUD PROXY GENERATION
        // We implement a custom ReadableStream to orchestrate section-by-section streaming
        const customStream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    const outline = cachedIntelligence?.masterOutline;

                    if (!outline || outline.length === 0) {
                        // Fallback to giant prompt if no outline is available
                        const fallbackPrompt = strategy.buildFullArticlePrompt([{ level: 1, text: input.keywords || 'Article' }]);
                        const result = await streamText({
                            model: vpsProxy(targetModelId),
                            system: strategy.systemPrompt,
                            messages: [{ role: 'user', content: fallbackPrompt }],
                            temperature: 0.7,
                        });

                        for await (const chunk of result.textStream) {
                            controller.enqueue(encoder.encode(chunk));
                        }
                        controller.close();
                        return;
                    }

                    console.log(`🚀 [Stream] Executing Outline in a Single Stream Pass`);

                    const fullArticlePrompt = strategy.buildFullArticlePrompt(outline);

                    const result = await streamText({
                        model: vpsProxy(targetModelId),
                        system: strategy.systemPrompt,
                        messages: [{ role: 'user', content: fullArticlePrompt }],
                        temperature: 0.7,
                    });

                    // Pipe the entire stream directly to the client
                    for await (const chunk of result.textStream) {
                        controller.enqueue(encoder.encode(chunk));
                    }

                    controller.close();
                    console.log(`✅ [Stream] Completed Single-Shot Article Streaming!`);
                } catch (e) {
                    console.error('[Stream] Orchestration error:', e);
                    controller.error(e);
                }
            }
        });

        // Re-enable humanizer, but the new version safely bypasses headings
        const humanizedStream = createHumanizerStream(customStream);

        return new Response(humanizedStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('Streaming error:', error);
        return new Response(JSON.stringify({ error: 'Streaming failed', details: error.message }), { status: 500 });
    }
}
