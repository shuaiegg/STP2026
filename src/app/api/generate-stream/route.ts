
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

                    let lastProcessedIndex = 0;
                    for (let i = 0; i < buffer.length; i++) {
                        const char = buffer[i];
                        const nextChar = buffer[i + 1] || '';

                        if (char === '\n' || ((char === '.' || char === '!' || char === '?') && (nextChar === ' ' || nextChar === '\n' || nextChar === ''))) {
                            const chunk = buffer.slice(lastProcessedIndex, i + 1);
                            const isAtLineStart = lastProcessedIndex === 0 || buffer[lastProcessedIndex - 1] === '\n';

                            if (isAtLineStart && chunk.trim().startsWith('#')) {
                                controller.enqueue(encoder.encode(chunk));
                            } else {
                                controller.enqueue(encoder.encode(humanizePro(chunk)));
                            }
                            lastProcessedIndex = i + 1;
                        }

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

        const executionId = providedId || `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        await prisma.skillExecution.create({
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

        const customStream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                const startTime = Date.now();
                let status = 'success';
                let finalOutput = '';
                let finalUsage: any = null;
                let errorMsg = '';

                try {
                    const outline = cachedIntelligence?.masterOutline;

                    if (!outline || outline.length === 0) {
                        const fallbackPrompt = strategy.buildFullArticlePrompt([{ level: 1, text: input.keywords || 'Article' }]);
                        const result = await streamWithFallback(MODEL_CHAIN.premium, {
                            system: strategy.systemPrompt,
                            messages: [{ role: 'user', content: fallbackPrompt }],
                            temperature: 0.7,
                            onFinish: ({ text, usage }) => {
                                finalOutput = text;
                                finalUsage = usage;
                            }
                        });

                        for await (const chunk of result.textStream) {
                            controller.enqueue(encoder.encode(chunk));
                        }
                    } else {
                        const fullArticlePrompt = strategy.buildFullArticlePrompt(outline);
                        const result = await streamWithFallback(MODEL_CHAIN.premium, {
                            system: strategy.systemPrompt,
                            messages: [{ role: 'user', content: fullArticlePrompt }],
                            temperature: 0.7,
                            onFinish: ({ text, usage }) => {
                                finalOutput = text;
                                finalUsage = usage;
                            }
                        });

                        for await (const chunk of result.textStream) {
                            controller.enqueue(encoder.encode(chunk));
                        }
                    }
                    controller.close();
                } catch (e) {
                    console.error('[Stream] Orchestration error:', e);
                    status = 'failed';
                    errorMsg = e instanceof Error ? e.message : 'Unknown streaming error';
                    controller.error(e);
                } finally {
                    try {
                        await prisma.skillExecution.update({
                            where: { id: executionId },
                            data: {
                                status: status as any,
                                output: status === 'success' ? { content: finalOutput } as any : undefined,
                                errorMessage: status === 'failed' ? errorMsg : undefined,
                                executionTimeMs: Date.now() - startTime,
                                tokensUsed: finalUsage?.totalTokens || 0,
                                modelUsed: MODEL_CHAIN.premium[0],
                                provider: 'vps-proxy'
                            }
                        });
                        console.log(`✅ [Stream-Log] Final update for ${executionId}: ${status}`);
                    } catch (logErr) {
                        console.error('Failed to perform final execution log update:', logErr);
                    }
                }
            }
        });

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
