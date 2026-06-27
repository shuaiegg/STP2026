import { NextResponse } from "next/server";
import { withSiteContext } from "@/lib/api-utils";
import prisma from "@/lib/prisma";
import { getProvider } from "@/lib/skills/providers";
import { resolveModelForContext } from "@/lib/skills/model-resolver";
import type { AIProviderName } from "@/lib/skills/types";
import { localeDirective } from "@/lib/skills/locale-directive";
import { getSemanticGap } from "@/lib/site-intelligence/semantic-gap-service";

async function handler(
    req: Request,
    { params, site, session }: { params: { siteId: string }; site: any; session: any }
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
        let semanticDebts = await prisma.semanticDebt.findMany({
            where: { ontologyId: latestOntology.id },
            orderBy: { coverageScore: 'asc' }, // Prioritize low coverage
            take: 10
        });

        // 自愈：该 ontology 版本还没缺口（如刚 re-extract）→ 即时算一遍，避免死给 400。
        if (semanticDebts.length === 0) {
            try {
                await getSemanticGap(siteId, true, latestOntology.sourceLocale || undefined);
            } catch (e) {
                console.error('[strategy/generate] lazy semantic gap failed:', e);
            }
            semanticDebts = await prisma.semanticDebt.findMany({
                where: { ontologyId: latestOntology.id },
                orderBy: { coverageScore: 'asc' },
                take: 10
            });
        }

        if (semanticDebts.length === 0) {
            return NextResponse.json(
                { error: "No semantic debts found to generate a plan from. Run analysis first." },
                { status: 400 }
            );
        }

        // 3. Prepare LLM Prompt
        // For phase 1, we'll pick the top 3 semantic debts to generate pillars for.
        const topDebts = semanticDebts.slice(0, 3);

        const positioning = (latestOntology as any).positioning ?? [];
        const brandTone = (latestOntology as any).brandTone ?? '';

        const prompt = `
        You are an elite SEO and Content Strategist.
        Your task is to create a highly structured "Pillar-Cluster" content strategy based on the identified "Semantic Debts" (topics the website is missing but competitors have).

        Target Domain: ${siteData?.domain || ''}
        Business Offerings: ${JSON.stringify(coreOfferings)}
        Target Audience: ${JSON.stringify(targetAudience)}
        Positioning / Differentiators: ${JSON.stringify(positioning)}
        Brand Tone: ${brandTone}
        
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
        ${localeDirective((session?.user as { locale?: string })?.locale)}
        `;

        // 4. Call LLM — 用 model-resolver 解析（admin 可在 /admin/models 的
        //    "content_strategy" 上下文配置），并按候选顺序兜底（抗 429/配额）。
        const resolved = await resolveModelForContext('content_strategy');
        const candidates: Array<{ provider: AIProviderName; model?: string }> = [
            { provider: resolved.provider, model: resolved.modelId },
        ];
        for (const fb of ['vps', 'deepseek', 'claude'] as AIProviderName[]) {
            if (!candidates.some((c) => c.provider === fb)) candidates.push({ provider: fb });
        }

        let aiResponse: { content?: string } | undefined;
        let lastErr: unknown;
        for (const c of candidates) {
            try {
                aiResponse = await getProvider(c.provider).generateContent(prompt, {
                    model: c.model,
                    temperature: 0.3,
                });
                break;
            } catch (e) {
                lastErr = e;
                console.warn(`[strategy/generate] provider ${c.provider} failed, trying next:`, e instanceof Error ? e.message : e);
            }
        }
        if (!aiResponse) throw lastErr instanceof Error ? lastErr : new Error('All model providers failed');

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
                        sourceOntologyId: latestOntology.id, // 记录基于哪版业务基因（陈旧检测）
                        articles: {
                            create: plan.articles.map((art: any) => ({
                                title: art.title,
                                keyword: art.keyword,
                                language: art.language || (session?.user as { locale?: string })?.locale || 'zh',
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
