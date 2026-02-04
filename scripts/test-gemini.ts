import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('No API key');
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    
    try {
        console.log('--- Testing Gemini Pro ---');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent("Hello!");
        console.log(result.response.text());
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testGemini();
