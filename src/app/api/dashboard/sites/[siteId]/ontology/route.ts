import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSiteContext } from '@/lib/api-utils';
import { getDefaultProvider } from '@/lib/skills/providers';

export const POST = withSiteContext<{ siteId: string }>(async (request, { site: baseSite }) => {
    try {
        const site = await prisma.site.findUnique({
            where: { id: baseSite.id },
            include: {
                audits: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!site) {
            return NextResponse.json({ error: '站点不存在或无权访问' }, { status: 404 });
        }

        // 1. Get the most recent audit report for context
        let siteContext = "Domain: " + site.domain + "\n";

        if (site.audits.length > 0 && site.audits[0].report) {
            const report = site.audits[0].report as any;
            if (report && Array.isArray(report.nodes)) {
                const pages = report.nodes
                    .filter((n: any) => n.type === 'cluster' || n.type === 'pillar')
                    .map((n: any) => ({
                        url: n.id,
                        title: n.meta?.title || n.name,
                        h1: n.meta?.h1 || '',
                        desc: n.meta?.description || ''
                    }))
                    .slice(0, 50); // Take top 50 pages for context

                siteContext += "Crawled Pages:\n" + JSON.stringify(pages, null, 2);
            }
        } else {
            return NextResponse.json({ error: '请先运行一次 Instant Audit (站点审计) 收集页面数据' }, { status: 400 });
        }

        // 2. Extact Ontology via LLM
        const aiProvider = await getDefaultProvider();
        const defaultModel = aiProvider.getDefaultModel();

        const prompt = `
You are an expert Business Strategist and SEO Architect. 
Your task is to perform 'Business DNA Extraction & Identity Modeling' based on the crawled pages of a website.
Analyze the target audience, the core problems solved, the products/services offered, and ultimately deduce an "Ideal Topic Map".
The "Ideal Topic Map" is the perfect semantic tree a leader in this specific niche *should* have to cover all user pain points and build absolute Topical Authority, independent of what competitors are doing.

Additionally, identify the core "Logic Chains" of the business. Each chain should follow the "Problem → Solution → Proof" structure.
- Problem: A specific pain point the customer has.
- Solution: How this website/product solves it.
- Proof: What evidence exists (case studies, data, testimonials) on the site.

Website Data:
${siteContext}

Return ONLY a valid JSON object with the following structure:
{
  "coreOfferings": ["offering 1", "offering 2"],
  "targetAudience": ["audience 1", "audience 2"],
  "painPointsSolved": ["pain point 1", "pain point 2"],
  "logicChains": [
     { "problem": "...", "solution": "...", "proof": "..." }
  ],
  "idealTopicMap": [
     {
       "topic": "Broad Category (e.g., Marketing Automation)",
       "subtopics": ["Specific aspect 1", "Specific aspect 2"]
     }
  ]
}

- Keep explanations concise.
- Ensure 'idealTopicMap' contains 5-10 core semantic pillars a true industry leader in this niche must cover.
- Do NOT wrap it in markdown code blocks like \`\`\`json.
        `.trim();

        const response = await aiProvider.generateContent(prompt, {
            model: defaultModel.id,
            temperature: 0.2, // Slightly higher creative deduction
        });

        if (!response.content) {
            throw new Error("Empty LLM response");
        }

        const match = response.content.match(/\{[\s\S]*\}/);
        if (!match) {
            throw new Error("Could not find JSON object in response");
        }

        const ontologyData = JSON.parse(match[0]);

        // 3. Save to database (New Model)
        const lastOntology = await prisma.siteOntology.findFirst({
            where: { siteId: site.id },
            orderBy: { version: 'desc' }
        });

        const nextVersion = (lastOntology?.version || 0) + 1;

        const newOntology = await prisma.siteOntology.create({
            data: {
                siteId: site.id,
                version: nextVersion,
                coreOfferings: ontologyData.coreOfferings || [],
                targetAudience: ontologyData.targetAudience || [],
                painPointsSolved: ontologyData.painPointsSolved || [],
                logicChains: ontologyData.logicChains || [],
                idealTopicMap: ontologyData.idealTopicMap || [],
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...ontologyData,
                ontologyId: newOntology.id,
                version: newOntology.version
            }
        });

    } catch (error: any) {
        console.error('[Ontology POST] Error:', error);
        return NextResponse.json({ error: '提取业务 DNA 失败: ' + error.message }, { status: 500 });
    }
});
