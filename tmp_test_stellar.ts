import { registerAllSkills } from './src/lib/skills/skills';
import { getSkillRegistry } from './src/lib/skills';

async function test() {
    registerAllSkills();
    const registry = getSkillRegistry();
    const stellar = registry.getSkill('stellar-writer');

    console.log("Starting deep analysis...");

    // Test the deep analysis phase first (gives us an outline)
    const analysisRes = await stellar.execute({
        keywords: "Next.js App Router SEO best practices",
        researchMode: "deep_analysis"
    });

    console.log("--- OUTLINE GENERATED ---");
    console.log((analysisRes.data as any).masterOutline);

    console.log("\nStarting full production...");

    // Now test full production with the cached context and outline
    const productionRes = await stellar.execute({
        keywords: "Next.js App Router SEO best practices",
        researchMode: "full",
        masterOutline: (analysisRes.data as any).masterOutline,
        cachedIntelligence: {
            keywords: "Next.js App Router SEO best practices",
            location: 'United States',
            language: 'en',
            topics: (analysisRes.data as any).topics,
            entities: (analysisRes.data as any).entities,
            competitors: (analysisRes.data as any).competitors,
            serpAnalysis: (analysisRes.data as any).serpAnalysis,
            internalContent: (analysisRes.data as any).internalContent,
            timestamp: Date.now()
        }
    });

    console.log("--- FINAL CONTENT GENERATED ---");
    console.log((productionRes.data as any).content.substring(0, 500) + '...\n[TRUNCATED]');
    console.log(`Word Count approx: ${(productionRes.data as any).content.split(' ').length}`);
}

test().catch(console.error);
