/**
 * Quick test script for SERP API
 * Run: npx tsx scripts/test-serp-api.ts
 */

import 'dotenv/config';  // Load .env file
import { DataForSEOClient } from '../src/lib/external/dataforseo';

async function testSERPAPI() {
    console.log('🧪 Testing DataForSEO SERP API...\n');

    try {
        console.log('📡 Sending request to /v3/serp/google/organic/live/advanced...');

        const response = await DataForSEOClient.post('/v3/serp/google/organic/live/advanced', [{
            keyword: 'project management software',
            location_name: 'United States',
            language_code: 'en',
            device: 'desktop',
            depth: 10
        }]);

        console.log('\n✅ Response received!');
        console.log('Response structure:', {
            hasTasks: !!response.tasks,
            taskCount: response.tasks?.length || 0,
            hasResult: !!response.tasks?.[0]?.result,
            resultCount: response.tasks?.[0]?.result?.length || 0,
            hasError: !!response.tasks?.[0]?.error
        });

        if (response.tasks?.[0]?.error) {
            console.error('\n❌ API returned error:', response.tasks[0].error);
            return;
        }

        if (response.tasks?.[0]?.result?.[0]) {
            const serpData = response.tasks[0].result[0];
            console.log('\n📊 SERP Data:');
            console.log('  Items count:', serpData.items?.length || 0);
            console.log('  Item types:', [...new Set(serpData.items?.map((i: any) => i.type) || [])]);
            console.log('  Total results:', serpData.se_results_count);

            // Check for specific features
            const hasFeaturedSnippet = serpData.items?.some((i: any) => i.type === 'featured_snippet');
            const hasPAA = serpData.items?.some((i: any) => i.type === 'people_also_ask');
            const paaCount = serpData.items?.filter((i: any) => i.type === 'people_also_ask')
                .reduce((acc: number, item: any) => acc + (item.items?.length || 0), 0);

            console.log('\n🎯 SERP Features:');
            console.log('  Featured Snippet:', hasFeaturedSnippet ? '✅ Found' : '❌ Not found');
            console.log('  People Also Ask:', hasPAA ? `✅ Found (${paaCount} questions)` : '❌ Not found');

            if (hasPAA) {
                const paaItem = serpData.items?.find((i: any) => i.type === 'people_also_ask');
                console.log('\n📋 PAA Questions:');
                paaItem?.items?.slice(0, 3).forEach((q: any, i: number) => {
                    console.log(`  ${i + 1}. ${q.title || 'Unknown question'}`);
                });
            }
        } else {
            console.error('\n❌ No result data in response');
            console.log('Full response:', JSON.stringify(response, null, 2));
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Stack:', error.stack);
        }
    }
}

testSERPAPI();
