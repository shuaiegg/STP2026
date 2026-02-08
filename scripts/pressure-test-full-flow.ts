import { DataForSEOClient } from '../src/lib/external/dataforseo';
import { SkeletonExtractor } from '../src/lib/external/skeleton-extractor';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const TEST_KEYWORDS = [
    "AI Marketing Automation",
    "Best SEO Tools 2026",
    "Digital Marketing Trends"
];

async function runEndToEndPressureTest() {
    console.log(`🚀 Starting STP Full-Flow Pressure Test (E2E)...`);
    console.log(`📊 Flow: DataForSEO SERP -> Skeleton Extraction (Heading Analysis)\n`);
    
    const startTime = Date.now();
    let totalUrlsFound = 0;
    let successfulExtractions = 0;

    for (const keyword of TEST_KEYWORDS) {
        console.log(`\n--- Processing Keyword: "${keyword}" ---`);
        
        try {
            // Step 1: Get SERP from DataForSEO
            console.log(`🔍 [SERP] Fetching Google results...`);
            const serpItems = await DataForSEOClient.searchGoogleSERP(keyword);
            
            // Filter only organic results with real URLs
            const organicUrls = serpItems
                .filter((item: any) => item.type === 'organic' && item.url)
                .slice(0, 3) // Test top 3 competitors
                .map((item: any) => item.url);

            console.log(`✅ [SERP] Found ${organicUrls.length} competitor URLs`);
            totalUrlsFound += organicUrls.length;

            // Step 2: Extract Skeletons (The heavy lifting)
            if (organicUrls.length > 0) {
                console.log(`🦴 [Skeleton] Extracting heading structures in parallel...`);
                const skeletons = await SkeletonExtractor.batchExtract(organicUrls);
                
                skeletons.forEach((s, idx) => {
                    console.log(`   [${idx+1}] Title: ${s.title.substring(0, 50)}...`);
                    console.log(`   [${idx+1}] Headings found: ${s.headings.length}`);
                });
                
                successfulExtractions += skeletons.length;
            }

        } catch (error: any) {
            console.error(`❌ [Error] Keyword "${keyword}" failed:`, error.message);
        }
    }

    const duration = Date.now() - startTime;
    console.log(`\n✨ Full-Flow Test Results ✨`);
    console.log(`--------------------------`);
    console.log(`Total Time: ${(duration / 1000).toFixed(2)}s`);
    console.log(`URLs Found: ${totalUrlsFound}`);
    console.log(`Skeletons Extracted: ${successfulExtractions}`);
    console.log(`Success Rate: ${((successfulExtractions / totalUrlsFound) * 100).toFixed(1)}%`);
    console.log(`--------------------------\n`);
}

runEndToEndPressureTest().catch(console.error);
