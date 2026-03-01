
import { streamText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { StrategyComposer } from '@/lib/skills/skills/stellar/StrategyComposer';
import { IntelligenceContext } from '@/lib/skills/skills/stellar/types';
import fs from 'fs';
import path from 'path';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { chargeUser } from '@/lib/billing/credits';

// Allow streaming responses up to 5 minutes
export const maxDuration = 300;

/**
 * LIVE HUMANIZER INTERCEPTOR
 * Replaces AI tells and forces contractions in real-time as the stream flows.
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
                        // Flush remaining buffer
                        if (buffer) {
                            controller.enqueue(encoder.encode(applyHumanizerRules(buffer)));
                        }
                        controller.close();
                        break;
                    }

                    // Decode and add to buffer
                    buffer += decoder.decode(value, { stream: true });

                    // Process buffer if it gets too large or has a sentence end
                    // We look for boundaries like spaces or newlines to ensure we don't cut words
                    if (buffer.length > 100 || /[\s\n\.\!\?]/.test(buffer)) {
                        const processed = applyHumanizerRules(buffer);
                        controller.enqueue(encoder.encode(processed));
                        buffer = '';
                    }
                }
            } catch (e) {
                controller.error(e);
            }
        }
    });
}

/**
 * CORE HUMANIZATION RULES (Real-time regex)
 */
function applyHumanizerRules(text: string): string {
    let result = text;
    
    // 1. Force Contractions (Basic set for real-time)
    result = result.replace(/\bwill not\b/gi, "won't")
                   .replace(/\bcannot\b/gi, "can't")
                   .replace(/\bit is\b/gi, "it's")
                   .replace(/\bthat is\b/gi, "that's")
                   .replace(/\bdo not\b/gi, "don't")
                   .replace(/\bdoes not\b/gi, "doesn't")
                   .replace(/\bwe are\b/gi, "we're")
                   .replace(/\byou are\b/gi, "you're");

    // 2. Kill AI Phrases
    result = result.replace(/It'?s worth noting that,?\s*/gi, '')
                   .replace(/It'?s important to (remember|note) that,?\s*/gi, '')
                   .replace(/In conclusion,?\s*/gi, '')
                   .replace(/Furthermore,?\s*/gi, 'Also, ')
                   .replace(/Moreover,?\s*/gi, 'Plus, ')
                   .replace(/Additionally,?\s*/gi, 'Also, ')
                   .replace(/pivotal role/gi, 'key role')
                   .replace(/evolving landscape/gi, 'industry')
                   .replace(/In this article, we will/gi, 'We will');

    // 3. Cleanup spacing issues caused by removal
    result = result.replace(/\s{2,}/g, ' ');
    
    return result;
}

export async function POST(req: Request) {
    try {
        // 1. Authentication Check
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || !session.user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { input, cachedIntelligence } = await req.json();

        // 2. Billing
        const skillName = 'GEO_WRITER_FULL';
        const chargeResult = await chargeUser(
            session.user.id,
            skillName,
            `GEO Writer Generation: ${input.keywords || 'Untitled'}`
        );

        if (!chargeResult.success) {
            return new Response(JSON.stringify({
                error: chargeResult.error || 'Billing failed', 
                details: { required: chargeResult.required, current: chargeResult.current }
            }), {
                status: 402, 
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Reconstruct Intelligence Context
        const intelligenceContext: IntelligenceContext = {
            keywords: input.keywords || 'Industrial Pumps',
            location: input.location || 'United States',
            entities: cachedIntelligence?.entities || [],
            topics: cachedIntelligence?.topics || [],
            serpAnalysis: cachedIntelligence?.serpAnalysis || {},
            competitors: cachedIntelligence?.competitors || [],
            rawSerp: [],
            contentBrief: ""
        };

        // 4. Use StrategyComposer
        const strategy = StrategyComposer.compose(intelligenceContext, input);

        const streamingPrompt = strategy.userPrompt + `
        \nIMPORTANT OVERRIDE:\nFor this streaming response, DO NOT return JSON.\nReturn ONLY the raw Markdown content for the article.\nStart directly with the H1 Title.\n\nFORMATTING REQUIREMENTS:\n- Use H3 subsections within H2 sections for depth.\n- Include at least one comparison table.\n- Use bullet points and numbered lists frequently for readability.\n- Use > blockquotes for \"Pro Tips\".\n- Do not include metadata, summary, or schema in this stream.\n`;

        // 5. Stream the text
        const result = await streamText({
            model: deepseek('deepseek-chat'),
            system: strategy.systemPrompt,
            messages: [
                { role: 'user', content: streamingPrompt }
            ],
            temperature: 0.85, // Higher temp for more human variety
            onChunk: async ({ chunk }) => {
                // Log chunks for debugging if needed
            }
        });

        // 6. WRAP WITH HUMANIZER STREAM (REAL-TIME OPTIMIZATION)
        const rawStream = result.toTextStreamResponse().body;
        if (!rawStream) throw new Error("Stream body is null");

        const humanizedStream = createHumanizerStream(rawStream);

        return new Response(humanizedStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('Streaming error:', error);
        return new Response(JSON.stringify({ error: 'Streaming failed', details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
