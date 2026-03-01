
import { StellarWriterSkill } from '../src/lib/skills/skills/stellar-writer';
import fs from 'fs';
import path from 'path';

async function runBaseline() {
    console.log("📊 Running Baseline Test for StellarWriter v2.3...");
    
    const skill = new StellarWriterSkill();
    const input = {
        keywords: "High Efficiency Industrial Pumps",
        location: "United States",
        researchMode: "generate",
        auditOnly: false
    };

    try {
        console.log("⏳ This might take 30-60s (Live API calls)...");
        const startTime = Date.now();
        
        // We use executeInternal to test the raw logic
        // @ts-ignore - accessing protected for testing
        const result = await skill.executeInternal(input);
        
        const duration = Date.now() - startTime;
        console.log(`✅ Baseline completed in ${duration}ms`);

        const baselineData = {
            input,
            outputStructure: Object.keys(result.data),
            contentLength: result.data.content?.length || 0,
            seoScore: result.data.scores.seo,
            humanScore: result.data.humanScore,
            metadata: result.metadata
        };

        const outputPath = path.join(process.cwd(), 'test-baseline-stellar.json');
        fs.writeFileSync(outputPath, JSON.stringify(baselineData, null, 2));
        
        console.log(`💾 Baseline saved to ${outputPath}`);
        console.log("--- Summary ---");
        console.log(`Content Length: ${baselineData.contentLength} chars`);
        console.log(`SEO Score: ${baselineData.seoScore}`);
        console.log(`Human Score: ${baselineData.humanScore}`);

    } catch (error) {
        console.error("❌ Baseline failed:", error);
        process.exit(1);
    }
}

runBaseline().catch(console.error);
