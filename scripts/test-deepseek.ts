
import { streamText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function main() {
    console.log('Testing DeepSeek Stream...');
    console.log('API Key present:', !!process.env.DEEPSEEK_API_KEY);

    try {
        const result = await streamText({
            model: deepseek('deepseek-chat'),
            messages: [{ role: 'user', content: 'Count to 10 slowly.' }],
            onChunk: ({ chunk }) => {
                console.log('Chunk received:', JSON.stringify(chunk, null, 2));
            }
        });

        console.log('\nStream started. Waiting for completion...');

        let fullText = '';
        for await (const chunk of result.textStream) {
            fullText += chunk;
        }

        console.log('\n\nFinal Text Length:', fullText.length);
        console.log('Done.');
    } catch (e) {
        console.error('Error:', e);
    }
}

main().catch(console.error);
