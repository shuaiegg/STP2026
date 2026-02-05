
import { streamText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { StellarWriterSkill } from '@/lib/skills/skills/stellar-writer';
import fs from 'fs';
import path from 'path';

// Allow streaming responses up to 5 minutes
export const maxDuration = 300;

export async function POST(req: Request) {
    try {
        const { input, cachedIntelligence } = await req.json();
        console.log('Stream Request Input:', JSON.stringify(input, null, 2));
        console.log('Stream Context Keys:', Object.keys(cachedIntelligence || {}));

        // 1. Reconstruct Context from Cached Data (Step 1)
        const entities = cachedIntelligence?.entities || [];
        const topics = cachedIntelligence?.topics || [];
        const serpAnalysis = cachedIntelligence?.serpAnalysis;
        const competitors = cachedIntelligence?.competitors || [];

        // 2. Build the exact same prompt as the full skill
        const systemPrompt = StellarWriterSkill.buildStellarPrompt(
            input,
            entities,
            topics,
            competitors,
            serpAnalysis
        );

        // Append instruction to force Markdown output only (no JSON)
        // We override the JSON requirement in the original prompt for streaming
        const streamingPrompt = systemPrompt + `
        
IMPORTANT OVERRIDE:
For this streaming response, DO NOT return JSON.
Return ONLY the raw Markdown content for the article.
Start directly with the H1 Title.
Do not include metadata, summary, or schema in this stream.
`;
        console.log('Generated Prompt Length:', streamingPrompt.length);
        console.log('Prompt Start:', streamingPrompt.substring(0, 100));

        try {
            const logPath = path.join(process.cwd(), 'debug_stream_log.txt');
            fs.writeFileSync(logPath, `INPUT:\n${JSON.stringify(input, null, 2)}\n\nPROMPT:\n${streamingPrompt}`);
        } catch (e) {
            console.error('Failed to write debug log', e);
        }



        // 4. Stream the text
        const result = await streamText({
            model: deepseek('deepseek-chat'),
            system: "You are an expert SEO Content Writer.",
            messages: [
                { role: 'user', content: streamingPrompt }
            ],
            temperature: 0.7,
            onChunk: async ({ chunk }) => {
                try {
                    const logPath = path.join(process.cwd(), 'debug_chunks.txt');
                    if (chunk.type === 'text-delta') {
                        // @ts-ignore
                        const text = chunk.textDelta || chunk.text || '';
                        fs.appendFileSync(logPath, text);
                    } else {
                        fs.appendFileSync(logPath, `\n[${chunk.type}]\n`);
                    }
                } catch (e) {
                    // ignore logging errors
                }
            }
        });

        return result.toTextStreamResponse();

    } catch (error) {
        console.error('Streaming error:', error);
        try {
            const logPath = path.join(process.cwd(), 'debug_stream_error.txt');
            fs.writeFileSync(logPath, `ERROR:\n${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
        } catch (e) {
            console.error('Failed to write error log', e);
        }
        return new Response(JSON.stringify({ error: 'Streaming failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
