/**
 * Quick test script for SERP API with location code
 * Run: npx tsx scripts/test-serp-location.ts
 */

import 'dotenv/config';  // Load .env file
import { DataForSEOClient } from '../src/lib/external/dataforseo';

async function testWithLocationCode() {
    console.log('🧪 Testing SERP API with location_code...\n');

    try {
        // Use location_code instead of location_name
        // 2840 = United States
        const response = await DataForSEOClient.post('/v3/serp/google/organic/live/advanced', [{
            keyword: 'project management software',
            location_code: 2840,  // United States
            language_code: 'en',
            device: 'desktop',
            depth: 10
        }]);

        console.log('✅ Response:', JSON.stringify(response, null, 2));

        if (response.tasks?.[0]?.result?.[0]) {
            const serpData = response.tasks[0].result[0];
            console.log('\n📊 Success! Items count:', serpData.items?.length || 0);
            console.log('Item types:', [...new Set(serpData.items?.map((i: any) => i.type) || [])]);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testWithLocationCode();
