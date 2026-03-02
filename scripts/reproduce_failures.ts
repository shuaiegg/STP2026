
import fetch from 'node-fetch';

async function runAudit() {
    console.log("🕵️ Starting Automated Quality Audit...");
    const API_URL = 'http://localhost:3000/api/skills/execute';
    
    // TEST 1: Deep Analysis Outline Check
    console.log("\n[TEST 1] Checking Deep Analysis Outline...");
    const res1 = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            skillName: 'stellar-writer',
            input: {
                keywords: 'Industrial Pumps',
                researchMode: 'deep_analysis'
            }
        })
    });
    
    const data1 = await res1.json();
    console.log("Raw API Response:", JSON.stringify(data1, null, 2));
    const outline = data1.output?.data?.masterOutline || [];
    
    if (outline.length === 0) {
        console.error("❌ FAILURE: masterOutline is EMPTY in Deep Analysis mode.");
    } else {
        console.log("✅ SUCCESS: masterOutline generated with", outline.length, "sections.");
    }

    // TEST 2: Markdown Structure Check (Simulated)
    // We will check the StrategyComposer directly since we can't easily stream in a script
    console.log("\n[TEST 2] Verifying Markdown Structure Prompt...");
    // This part is manual logic check in the code
}

runAudit().catch(console.error);
