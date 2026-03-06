
import { streamText } from 'ai';
import { streamWithFallback, MODEL_CHAIN } from '@/lib/vps-proxy';
import { StrategyComposer } from '@/lib/skills/skills/stellar/StrategyComposer';
import { IntelligenceContext } from '@/lib/skills/skills/stellar/types';
import { humanizePro } from '@/lib/utils/humanize';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { chargeUser } from '@/lib/billing/credits';
import prisma from "@/lib/prisma";

export const maxDuration = 300;



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
                            const text = buffer;
                            if (text.trim().startsWith('#')) {
                                controller.enqueue(encoder.encode(text));
                            } else {
                                controller.enqueue(encoder.encode(humanizePro(text)));
                            }
                        }
                        controller.close();
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });

                    // OPTIMIZATION: Chunk by sentences or length to avoid waiting for newlines
                    // But we must protect markdown headings (which start with # at the beginning of a line)

                    let lastProcessedIndex = 0;
                    for (let i = 0; i < buffer.length; i++) {
                        // Look for sentence enders followed by space or newline
                        const char = buffer[i];
                        const nextChar = buffer[i + 1] || '';

                        // Condition: End of sentence (. ! ?) or Newline
                        if (char === '\n' || ((char === '.' || char === '!' || char === '?') && (nextChar === ' ' || nextChar === '\n' || nextChar === ''))) {
                            const chunk = buffer.slice(lastProcessedIndex, i + 1);

                            // If it's a heading line, it must be the very first thing in a "line"
                            const isAtLineStart = lastProcessedIndex === 0 || buffer[lastProcessedIndex - 1] === '\n';

                            if (isAtLineStart && chunk.trim().startsWith('#')) {
                                controller.enqueue(encoder.encode(chunk));
                            } else {
                                controller.enqueue(encoder.encode(humanizePro(chunk)));
                            }
                            lastProcessedIndex = i + 1;
                        }

                        // Fallback: If chunk gets too large (e.g. 300 chars) without a sentence ender, flush it
                        if (i - lastProcessedIndex > 300) {
                            const chunk = buffer.slice(lastProcessedIndex, i + 1);
                            controller.enqueue(encoder.encode(humanizePro(chunk)));
                            lastProcessedIndex = i + 1;
                        }
                    }

                    if (lastProcessedIndex > 0) {
                        buffer = buffer.slice(lastProcessedIndex);
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

        const { input, cachedIntelligence, executionId: providedId } = await req.json();

        // Billing check
        const chargeResult = await chargeUser(session.user.id, 'GEO_WRITER_FULL', `GEO Writer: ${input.keywords}`);
        if (!chargeResult.success) return new Response(JSON.stringify({ error: chargeResult.error }), { status: 402 });

        // 1.5 INITIAL LOGGING (Ensure "background data" exists immediately)
        const executionId = providedId || `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const initialLog = await prisma.skillExecution.create({
            data: {
                id: executionId,
                skillName: 'stellar-writer',
                userId: session.user.id,
                status: 'processing',
                input: input as any,
                transactionId: chargeResult.transactionId,
            }
        });
        console.log(`📝 [Stream] Created initial execution log: ${executionId}`);

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

        // 2. SELECT MODEL CHAIN (Auto-Failover across providers)
        console.log(`🚀 [Stream-Start] Using model chain: ${MODEL_CHAIN.premium.join(' → ')}`);

        // 3. TRIGGER CLOUD PROXY GENERATION
        // We implement a custom ReadableStream to orchestrate section-by-section streaming
        const customStream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    // Update progress: Initializing
                    await prisma.skillExecution.update({
                        where: { id: executionId },
                        data: { metadata: { progress: '🔍 Initializing GEO content strategy...' } as any }
                    });

                    const outline = cachedIntelligence?.masterOutline;

                    if (!outline || outline.length === 0) {
                        // Update progress: No outline fallback
                        await prisma.skillExecution.update({
                            where: { id: executionId },
                            data: { metadata: { progress: '📋 Crafting custom outline from keywords...' } as any }
                        });
                        // Fallback to giant prompt if no outline is available
                        const fallbackPrompt = strategy.buildFullArticlePrompt([{ level: 1, text: input.keywords || 'Article' }]);
                        const result = await streamWithFallback(MODEL_CHAIN.premium, {
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

                    // Update progress: Generating
                    await prisma.skillExecution.update({
                        where: { id: executionId },
                        data: { metadata: { progress: '✍️ Writing full-scale article sections (Gemini 3.1 Pro)...' } as any }
                    });

                    const result = await streamWithFallback(MODEL_CHAIN.premium, {
                        system: strategy.systemPrompt,
                        messages: [{ role: 'user', content: fullArticlePrompt }],
                        temperature: 0.7,
                        onFinish: async ({ text, usage }) => {
                            try {
                                await prisma.skillExecution.update({
                                    where: { id: executionId },
                                    data: {
                                        status: 'success',
                                        output: { content: text } as any,
                                        executionTimeMs: Date.now() - timestamp,
                                        tokensUsed: usage.totalTokens,
                                        modelUsed: MODEL_CHAIN.premium[0],
                                        provider: 'vps-proxy'
                                    }
                                });
                                console.log(`✅ [Stream-Log] Updated execution log: ${executionId}`);
                            } catch (logErr) {
                                console.error('Failed to update execution log:', logErr);
                            }
                        }
                    });

                    // Pipe the entire stream directly to the client
                    const timestamp = Date.now();
                    for await (const chunk of result.textStream) {
                        controller.enqueue(encoder.encode(chunk));
                    }

                    controller.close();
                    console.log(`✅ [Stream] Completed Single-Shot Article Streaming!`);
                } catch (e) {
                    console.error('[Stream] Orchestration error:', e);
                    // Update log on error
                    try {
                        await prisma.skillExecution.update({
                            where: { id: executionId },
                            data: {
                                status: 'failed',
                                errorMessage: e instanceof Error ? e.message : 'Unknown streaming error'
                            }
                        });
                    } catch (ignore) { }
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
                'x-execution-id': executionId,
            },
        });

    } catch (error: any) {
        console.error('Streaming error:', error);
        return new Response(JSON.stringify({ error: 'Streaming failed', details: error.message }), { status: 500 });
    }
}
