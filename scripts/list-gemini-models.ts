/**
 * Quick script to list available Gemini models
 */

// Load environment variables
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('GEMINI_API_KEY not found!');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log('Listing available Gemini models...\n');

        // List models
        const models = await genAI.listModels();

        console.log(`Found ${models.length} models:\n`);

        for (const model of models) {
            console.log(`- ${model.name}`);
            console.log(`  Display Name: ${model.displayName}`);
            console.log(`  Supported: ${model.supportedGenerationMethods?.join(', ')}`);
            console.log('');
        }
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

main();
