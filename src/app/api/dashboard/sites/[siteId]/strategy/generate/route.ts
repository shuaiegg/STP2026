import { NextResponse } from "next/server";
import { withSiteContext } from "@/lib/api-utils";
import prisma from "@/lib/prisma";
import { getProvider } from "@/lib/skills/providers";

async function handler(
    req: Request,
    { params, site }: { params: { siteId: string }; site: any; session: any }
) {
    try {
        const { siteId } = params;
        const body = await req.json().catch(() => ({}));
        const { override = false } = body;

        // 1. Check for existing plans (Conflict Detection)
        const existingPlans = await prisma.contentPlan.findMany({
            where: {
                siteId,
                status: { in: ['IDEATION', 'PLANNED'] }
            }
        });

        if (existingPlans.length > 0 && !override) {
            return NextResponse.json({
                success: false,
                conflict: true,
                existingCount: existingPlans.length,
                message: `已存在 ${existingPlans.length} 个进行中的战略计划。重新生成将归档旧计划。`
            });
        }

        // If override is true, archive existing plans first
        if (override && existingPlans.length > 0) {
            await prisma.$transaction([
                prisma.contentPlan.updateMany({
                    where: { siteId, status: { in: ['IDEATION', 'PLANNED'] } },
                    data: { status: 'ARCHIVED' }
                }),
                prisma.plannedArticle.updateMany({
                    where: { contentPlan: { siteId }, status: { in: ['IDEATION', 'PLANNED'] } },
                    data: { status: 'ARCHIVED' }
                })
            ]);
        }

        // 2. Fetch site and ontology (now only use SiteOntology)
        const latestOntology = await prisma.siteOntology.findFirst({
            where: { siteId },
            orderBy: { version: 'desc' }
        });

        const siteData = await prisma.site.findUnique({
            where: { id: siteId },
            select: { domain: true }
        });

        if (!latestOntology) {
            return NextResponse.json(
                { error: "Business ontology not found. Run analysis first." },
                { status: 400 }
            );
        }

        const coreOfferings = latestOntology.coreOfferings;
        const targetAudience = latestOntology.targetAudience;
        
        // Need to fetch semantic debts from table
        const semanticDebts = await prisma.semanticDebt.findMany({
            where: { ontologyId: latestOntology.id },
            orderBy: { coverageScore: 'asc' }, // Prioritize low coverage
            take: 10
        });

        if (semanticDebts.length === 0) {
            return NextResponse.json(
                { error: "No semantic debts found to generate a plan from. Run analysis first." },
                { status: 400 }
            );
        }

        // 3. Prepare LLM Prompt
        // For phase 1, we'll pick the top 3 semantic debts to generate pillars for.
        const topDebts = semanticDebts.slice(0, 3);

        const prompt = `
        You are an elite SEO and Content Strategist. 
        Your task is to create a highly structured "Pillar-Cluster" content strategy based on the identified "Semantic Debts" (topics the website is missing but competitors have).
        
        Target Domain: ${siteData?.domain || ''}
        Business Offerings: ${JSON.stringify(coreOfferings)}
        Target Audience: ${JSON.stringify(targetAudience)}
        
        Semantic Debts to address (These must be your Pillars!):
        ${JSON.stringify(topDebts, null, 2)}
        
        REQUIREMENTS:
        For EACH Semantic Debt provided above, create a "Content Plan" (Pillar/Theme).
        For each Content Plan, propose exactly 3 "Cluster Articles" that will comprehensively cover the topic and support the main pillar.
        
        Output valid JSON only matching this TypeScript interface exactly:
        {
          "plans": [
            {
              "title": "string (The core semantic debt topic, e.g., 'B2B Marketing Automation Strategy')",
              "description": "string (A brief 1-sentence instruction for the AI writer on how to approach this cluster)",
              "theme": "string (Short categorizing tag)",
              "articles": [
                {
                  "title": "string (The proposed article headline, highly clickable)",
                  "keyword": "string (The primary target SEO keyword)",
                  "language": "string (e.g., 'zh' or 'en' based on target audience)",
                  "kanbanOrder": number (1, 2, or 3 representing reading/writing priority)
                }
              ]
            }
          ]
        }
        `;

        // 4. Call LLM
        const provider = getProvider('gemini');
        const aiResponse = await provider.generateContent(prompt, {
            model: 'gemini-2.0-flash',
            temperature: 0.3
        });

        // 5. Parse JSON Response
        let planData;
        try {
            const content = aiResponse.content || '';
            const match = content.match(/\{[\s\S]*\}/);
            if (!match) throw new Error("No JSON found");
            planData = JSON.parse(match[0]);
        } catch (e: any) {
            console.error("Failed to parse LLM JSON output for plan generation:", e.message);
            return NextResponse.json({ error: "Failed to parse AI strategy plan." }, { status: 500 });
        }

        if (!planData.plans || !Array.isArray(planData.plans)) {
            return NextResponse.json({ error: "Invalid AI strategy plan format." }, { status: 500 });
        }

        // 6. Persist to Database within a transaction
        const createdPlans = await prisma.$transaction(async (tx) => {
            const results = [];
            
            // Get current max priority to append to end
            const lastPlan = await tx.contentPlan.findFirst({
                where: { siteId },
                orderBy: { priority: 'desc' }
            });
            let priorityCounter = (lastPlan?.priority || 0) + 1;

            for (const plan of planData.plans) {
                const dbPlan = await tx.contentPlan.create({
                    data: {
                        siteId,
                        title: plan.title,
                        description: plan.description,
                        theme: plan.theme,
                        priority: priorityCounter++,
                        status: 'IDEATION',
                        articles: {
                            create: plan.articles.map((art: any) => ({
                                title: art.title,
                                keyword: art.keyword,
                                language: art.language || 'zh',
                                kanbanOrder: art.kanbanOrder,
                                status: 'IDEATION',
                                targetChannel: 'SEO'
                            }))
                        }
                    },
                    include: {
                        articles: true
                    }
                });
                results.push(dbPlan);
            }
            return results;
        });

        return NextResponse.json({ success: true, plans: createdPlans });

    } catch (error: any) {
        console.error("Strategy Generation Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

export const POST = withSiteContext<{ siteId: string }>(handler);
