import { NextResponse } from 'next/server';
import { getSkillRegistry } from '@/lib/skills';
import { registerAllSkills } from '@/lib/skills/skills';

export async function GET() {
    registerAllSkills();
    const registry = getSkillRegistry();
    const stellar = registry.getSkill('stellar-writer');

    if (!stellar) return NextResponse.json({ error: "Stellar not found" });

    // 1. Outline Phase
    const analysisRes = await stellar.execute({
        keywords: ["Next.js App Router vs Pages Router SEO"],
        researchMode: "deep_analysis"
    });

    const outline = (analysisRes.data as any).masterOutline;

    // 2. Production Phase
    console.log("Starting full production with outline:", outline);
    let slimOutline = outline;
    if (outline && outline.length > 3) {
        // Just title + 1 H2 + Takeaway + Q&A for speed
        slimOutline = [
            outline[0], // Title
            outline[1], // First section
            { text: 'Frequently Asked Questions', level: 2 },
            { text: 'Is App Router better for SEO?', level: 3 },
            outline[outline.length - 1] // Takeaways
        ];
    }
    console.log("Slim Outline:", slimOutline);

    const productionRes = await stellar.execute({
        keywords: ["Next.js App Router vs Pages Router SEO"],
        researchMode: "full",
        masterOutline: slimOutline,
        cachedIntelligence: {
            keywords: "Next.js App Router vs Pages Router SEO",
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
    console.log("Production finished!");

    return NextResponse.json({
        outline: outline,
        content: (productionRes.data as any).content
    });
}
