import { DataForSEOClient } from '../src/lib/external/dataforseo';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const TEST_KEYWORDS = [
    "AI Marketing Automation",
    "Best SEO Tools 2026",
    "Digital Marketing Trends",
    "How to use Gemini for SEO",
    "SaaS growth strategies"
];

async function runPressureTest(concurrency: number = 3) {
    console.log(`🚀 Starting DataForSEO Pressure Test (Concurrency: ${concurrency})...`);
    console.log(`📊 Target Endpoints: Related Keywords, SERP Search, Maps Search\n`);
    
    // Check credentials
    if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
        console.error("❌ Error: DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD missing in .env");
        return;
    }
    
    console.log(`🔑 Credentials Found: ${process.env.DATAFORSEO_LOGIN}`);
    console.log(`🎭 Mock Mode: ${process.env.USE_DATAFORSEO_MOCK === 'true' ? 'ON' : 'OFF'}\n`);

    const startTime = Date.now();
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;

    // Define a single test unit
    const testUnit = async (keyword: string, index: number) => {
        const unitStart = Date.now();
        console.log(`[Task ${index}] Testing keyword: "${keyword}"`);
        
        try {
            // Task 1: Related Keywords (Labs API)
            console.log(`  [Task ${index}.1] Fetching Related Keywords...`);
            const related = await DataForSEOClient.getRelatedTopics(keyword);
            console.log(`  [Task ${index}.1] ✅ Success: Found ${related.length} topics`);
            successfulRequests++;
            
            // Task 2: SERP Search
            console.log(`  [Task ${index}.2] Fetching SERP Data...`);
            const serp = await DataForSEOClient.searchGoogleSERP(keyword);
            console.log(`  [Task ${index}.2] ✅ Success: Found ${serp.length} SERP items`);
            successfulRequests++;

            // Task 3: Maps Search
            console.log(`  [Task ${index}.3] Fetching Maps Data...`);
            const maps = await DataForSEOClient.searchGoogleMaps(keyword, "New York");
            console.log(`  [Task ${index}.3] ✅ Success: Found ${maps.length} businesses`);
            successfulRequests++;

        } catch (error: any) {
            console.error(`  [Task ${index}] ❌ Failed:`, error.message);
            failedRequests++;
        }
        
        totalRequests += 3;
        console.log(`[Task ${index}] Completed in ${Date.now() - unitStart}ms\n`);
    };

    // Run tests with controlled concurrency
    const chunks = [];
    for (let i = 0; i < TEST_KEYWORDS.length; i += concurrency) {
        chunks.push(TEST_KEYWORDS.slice(i, i + concurrency));
    }

    for (let i = 0; i < chunks.length; i++) {
        console.log(`--- Executing Batch ${i + 1}/${chunks.length} ---`);
        await Promise.all(chunks[i].map((kw, idx) => testUnit(kw, i * concurrency + idx)));
    }

    const duration = Date.now() - startTime;
    console.log(`\n✨ Pressure Test Results ✨`);
    console.log(`--------------------------`);
    console.log(`Total Time: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Success: ${successfulRequests}`);
    console.log(`Failed: ${failedRequests}`);
    console.log(`Average Latency: ${(duration / totalRequests).toFixed(2)}ms/req`);
    console.log(`--------------------------\n`);

    if (failedRequests > 0) {
        console.error("⚠️ Warning: Some requests failed. Check credentials or rate limits.");
    } else {
        console.log("✅ All systems go! DataForSEO is stable under current load.");
    }
}

runPressureTest(3).catch(console.error);
