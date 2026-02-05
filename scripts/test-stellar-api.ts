/**
 * Test stellarwriter API call with auditOnly
 */

import 'dotenv/config';

async function testStellarWriterAPI() {
    console.log('🧪 Testing stellar-writer API endpoint...\n');

    try {
        const response = await fetch('http://localhost:3001/api/skills/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                skillName: 'stellar-writer',
                input: {
                    keywords: 'project management software',
                    location: 'United States',
                    auditOnly: true
                }
            })
        });

        const data = await response.json();

        console.log('Response status:', response.status);
        console.log('Response OK:', response.ok);
        console.log('\n📦 Response data:');
        console.log(JSON.stringify(data, null, 2));

        if (data.success && data.output?.data) {
            const outputData = data.output.data;
            console.log('\n✅ Success! Output includes:');
            console.log('  - Topics:', outputData.topics?.length || 0);
            console.log('  - Entities:', outputData.entities?.length || 0);
            console.log('  - SERP Analysis:', !!outputData.serpAnalysis ? 'YES ✅' : 'NO ❌');

            if (outputData.serpAnalysis) {
                console.log('\n📊 SERP Analysis Details:');
                console.log('  - Featured Snippet:', outputData.serpAnalysis.featuredSnippet?.exists);
                console.log('  - PAA Questions:', outputData.serpAnalysis.peopleAlsoAsk?.length || 0);
                console.log('  - Recommendations:', outputData.serpAnalysis.recommendations?.length || 0);
            }
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error);
    }
}

testStellarWriterAPI();
