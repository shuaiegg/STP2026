import { NextRequest, NextResponse } from "next/server";
import { withSiteContext } from "@/lib/api-utils";
import prisma from "@/lib/prisma";
import { getLLMProvider } from "@/lib/skills/providers";

async function handler(
    req: NextRequest,
    { params }: { params: { siteId: string } },
    site: any
) {
    try {
        const { siteId } = params;

        // 1. Fetch site and ontology
        const siteData = await prisma.site.findUnique({
            where: { id: siteId },
            select: { businessOntology: true, domain: true }
        });

        if (!siteData?.businessOntology) {
            return NextResponse.json(
                { error: "Business ontology not found. Run analysis first." },
                { status: 400 }
            );
        }

        const ontology = siteData.businessOntology as any;

        if (!ontology.semanticDebts || ontology.semanticDebts.length === 0) {
            return NextResponse.json(
                { error: "No semantic debts found to generate a plan from." },
                { status: 400 }
            );
        }

        // 2. Prepare LLM Prompt
        // For phase 1, we'll pick the top 3 semantic debts to generate pillars for.
        const topDebts = ontology.semanticDebts.slice(0, 3);

        const prompt = `
        You are an elite SEO and Content Strategist. 
        Your task is to create a highly structured "Pillar-Cluster" content strategy based on the identified "Semantic Debts" (topics the website is missing but competitors have).
        
        Target Domain: ${siteData.domain}
        Business Offerings: ${JSON.stringify(ontology.coreOfferings)}
        Target Audience: ${JSON.stringify(ontology.targetAudience)}
        
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

        // 3. Call LLM
        const provider = getLLMProvider('gemini');
        const aiResponse = await provider.generateText(prompt, {
            model: 'gemini-2.5-flash',
            temperature: 0.3,
            maxTokens: 4000
        });

        // 4. Parse JSON Response
        let planData;
        try {
            // Strip markdown formatting if the model wrapped the JSON in blockquotes
            const cleanedText = aiResponse.replace(/```json\n?|\n?```/gi, '').trim();
            planData = JSON.parse(cleanedText);
        } catch (e: any) {
            console.error("Failed to parse LLM JSON output for plan generation:", e.message, "\nRaw output:", aiResponse);
            return NextResponse.json({ error: "Failed to parse AI strategy plan." }, { status: 500 });
        }

        if (!planData.plans || !Array.isArray(planData.plans)) {
            return NextResponse.json({ error: "Invalid AI strategy plan format." }, { status: 500 });
        }

        // 5. Persist to Database within a transaction
        const createdPlans = await prisma.$transaction(async (tx) => {
            const results = [];
            let priorityCounter = 0; // Kanban column order

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

export const POST = withSiteContext(handler);
