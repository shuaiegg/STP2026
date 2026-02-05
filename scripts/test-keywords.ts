/**
 * Test DataForSEO Keyword Ideas API
 * Usage: npx tsx scripts/test-keywords.ts [keyword]
 */
import 'dotenv/config';

async function testKeywords() {
    const keyword = process.argv[2] || 'project management software';
    const baseUrl = 'https://api.dataforseo.com/v3';

    // Auth header construction (matching dataforseo.ts logic)
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    const authHeader = `Basic ${Buffer.from(`${login}:${password}`).toString('base64')}`;

    console.log(`🧪 Testing Keyword Ideas for: "${keyword}"`);

    const payload = [{
        keywords: [keyword],
        location_code: 2840, // US
        language_code: "en",
        include_seed_keyword: true,
        limit: 20
    }];

    try {
        console.log('📡 Sending request to DataForSEO...');
        const response = await fetch(`${baseUrl}/keywords_data/google/keyword_ideas/live`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const results = data.tasks?.[0]?.result?.[0]?.items || [];

        console.log('\n📊 Results:');
        console.log(`Status Code: ${data.status_code} (${data.status_message})`);
        console.log(`Found ${results.length} keywords`);

        if (results.length > 0) {
            console.log('\nTop 5 Keywords:');
            results.slice(0, 5).forEach((item: any) => {
                console.log(`- ${item.keyword} (Vol: ${item.keyword_info.search_volume})`);
            });
        } else {
            console.log('⚠️  No related keywords found!');
        }

    } catch (error) {
        console.error('❌ Error testing keyword ideas:', error);
    }

    console.log('\n----------------------------------------\n');
    console.log(`🧪 Testing Related Searches for: "${keyword}"`);

    const relatedPayload = [{
        keyword: keyword,
        location_code: 2840,
        language_code: "en",
        depth: 2
    }];

    try {
        console.log('📡 Sending request to DataForSEO (Related Searches)...');
        // Note: related_searches is under keywords_data usually, or sometimes part of SERP.
        // Actually DataForSEO has keywords_data/google/related_searches/live

        const response = await fetch(`${baseUrl}/keywords_data/google/related_searches/live`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(relatedPayload)
        });

        const data = await response.json();

        // Structure for related searches might be different
        const results = data.tasks?.[0]?.result?.[0]?.items || [];

        console.log('\n📊 Related Search Results:');
        console.log(`Status Code: ${data.status_code} (${data.status_message})`);
        console.log(`Found ${results.length} related items`);

        if (results.length > 0) {
            console.log('\nTop 5 Related:');
            results.slice(0, 5).forEach((item: any) => {
                console.log(`- ${item.keyword_properties?.keyword || item.keyword} (Vol: ${item.keyword_info?.search_volume})`);
            });
        }

    } catch (error) {
        console.error('❌ Error testing related searches:', error);
    }

    console.log('\n----------------------------------------\n');
    console.log(`🧪 Testing DataForSEO Labs Related Keywords for: "${keyword}"`);

    const labsPayload = {
        keyword: keyword,
        location_code: 2840,
        language_code: "en",
        limit: 20
    };

    try {
        console.log('📡 Sending request to DataForSEO Labs...');
        const response = await fetch(`${baseUrl}/dataforseo_labs/google/related_keywords/live`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([labsPayload]) // Labs API usually expects an array of task objects
        });

        const data = await response.json();

        const results = data.tasks?.[0]?.result?.[0]?.items || [];

        console.log('\n📊 Labs Results:');
        console.log(`Status Code: ${data.status_code} (${data.status_message})`);
        console.log(`Found ${results.length} related keywords`);

        if (results.length > 0) {
            console.log('\nTop 5 Related (Labs):');
            results.slice(0, 5).forEach((item: any) => {
                console.log(`- ${item.keyword_data?.keyword || item.keyword} (Vol: ${item.keyword_data?.keyword_info?.search_volume || 'N/A'})`);
            });
        }

    } catch (error) {
        console.error('❌ Error testing labs API:', error);
    }
}

testKeywords();
