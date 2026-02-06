
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { DataForSEOClient } from '../src/lib/external/dataforseo';

async function testChineseKeywords() {
    const keywords = ["杭州旅游攻略", "出口海外获客"];

    // Explicitly using China (2156) and Chinese (zh)
    const locationCode = 2156;
    const languageCode = "zh";

    console.log("----------------------------------------------------------------");
    console.log(`Testing Chinese Keywords with Loc: ${locationCode}, Lang: ${languageCode}`);
    console.log("----------------------------------------------------------------");

    for (const keyword of keywords) {
        console.log(`\n🔍 Analyzing: "${keyword}"...`);
        try {
            const results = await DataForSEOClient.getRelatedTopics(keyword, locationCode, languageCode);
            console.log(`✅ Result Count: ${results.length}`);
            if (results.length > 0) {
                console.log("First 5 results:");
                results.slice(0, 5).forEach(r => {
                    console.log(`   - ${r.keyword}: Vol=${r.volume}, Comp=${r.competition}`);
                });
            } else {
                console.log("❌ No related keywords found.");
            }
        } catch (error) {
            console.error(`❌ Error fetching data for ${keyword}:`, error);
        }
    }
}

testChineseKeywords();
