import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSiteContext } from '@/lib/api-utils';
import { getDefaultProvider } from '@/lib/skills/providers';
import { isBlacklistedTopic } from '@/lib/skills/site-intelligence/constants';

export const GET = withSiteContext<{ siteId: string }>(async (request, { site: baseSite }) => {
    try {
        const site = await prisma.site.findUnique({
            where: { id: baseSite.id },
            include: {
                keywords: true,
                audits: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!site) {
            return NextResponse.json({ error: '站点不存在或无权访问' }, { status: 404 });
        }

        if (!site.businessOntology) {
            return NextResponse.json({ error: '尚未提取业务本体数据 (Business Ontology)。请先执行业务提取。' }, { status: 400 });
        }

        const ontology = site.businessOntology as any;
        const idealTopics = ontology.idealTopicMap || [];

        // 1. Gather our actual topics
        const ourTopics = new Set<string>();
        site.seedKeywords.forEach(k => ourTopics.add(k.toLowerCase()));
        site.keywords.forEach(k => ourTopics.add(k.keyword.toLowerCase()));

        // FALLBACK: If no explicit keywords, pull from audit report nodes
        if (ourTopics.size === 0 && site.audits.length > 0) {
            const report = site.audits[0].report as any;
            if (report && Array.isArray(report.nodes)) {
                report.nodes.forEach((node: any) => {
                    if (node.type === 'pillar' || node.type === 'cluster') {
                        let name = node.name;
                        if (name.startsWith('/')) name = name.substring(1);
                        if (name.startsWith('topic:')) name = name.replace('topic:', '');
                        if (name) ourTopics.add(name.toLowerCase());
                    }
                });
            }
        }

        const allOurTopics = Array.from(ourTopics).filter(t => !isBlacklistedTopic(t));

        // 2. Semantic Debt Analysis via LLM
        let semanticDebts: Array<{ topic: string; subtopics: string[]; relevance: string }> = [];
        let ourStrengths: Array<{ topic: string; matchLevel: string }> = [];

        const aiProvider = await getDefaultProvider();
        const defaultModel = aiProvider.getDefaultModel();

        try {
            const prompt = `
You are an expert SEO Strategist performing a 'Semantic Debt Analysis'.
Compare the "Ideal Topic Map" (what a leader in this niche MUST cover) with "Our Existing Content Topics".

Your Goal:
1. Identify "Semantic Debts": Pillars or subtopics from the Ideal Map that are entirely missing or weakly covered in Our Content.
2. Identify "Core Strengths": Pillars from the Ideal Map that are well-covered by Our Content. 

Context:
- Ideal Topic Map: ${JSON.stringify(idealTopics)}
- Our Existing Content Topics: ${JSON.stringify(allOurTopics)}

Return ONLY a JSON object with this exact structure:
{
  "semanticDebts": [
     { "topic": "Name of missing pillar", "subtopics": ["missing sub 1", "missing sub 2"], "relevance": "Why this is critical for business" }
  ],
  "ourStrengths": [
     { "topic": "Name of covered pillar", "matchLevel": "High/Medium" }
  ]
}
Do NOT wrap it in markdown code blocks like \`\`\`json.
            `.trim();

            const response = await aiProvider.generateContent(prompt, {
                model: defaultModel.id,
                temperature: 0.1,
            });

            if (response.content) {
                const match = response.content.match(/\{[\s\S]*\}/);
                if (!match) throw new Error("JSON not found");
                const parsed = JSON.parse(match[0]);
                semanticDebts = parsed.semanticDebts || [];
                ourStrengths = parsed.ourStrengths || [];

                // --- Enrich Semantic Debts with GSC Data ---
                if (site.keywords && site.keywords.length > 0) {
                    semanticDebts = semanticDebts.map(debt => {
                        let totalImpressions = 0;
                        let totalClicks = 0;
                        let matchedKeywords: string[] = [];

                        // Simple matching: look for words from the topic/subtopics in our GSC keyword list
                        const debtTerms = Array.from(new Set([
                            ...debt.topic.toLowerCase().split(/[\s\-_]+/),
                            ...(debt.subtopics || []).flatMap(s => s.toLowerCase().split(/[\s\-_]+/))
                        ])).filter(t => t.length > 3); // ignore small words

                        site.keywords.forEach(kw => {
                            const kwLower = kw.keyword.toLowerCase();
                            // If any significant term from the debt is in the GSC keyword
                            if (debtTerms.some(term => kwLower.includes(term))) {
                                totalImpressions += (kw.impressions || 0);
                                totalClicks += (kw.clicks || 0);
                                matchedKeywords.push(kw.keyword);
                            }
                        });

                        // Calculate priority: High impressions but low clicks = Burning 🔥 Priority
                        let priorityScore = 0;
                        let priorityLabel = '';

                        if (totalImpressions > 0) {
                            const ctr = totalClicks / totalImpressions;
                            if (ctr < 0.05 && totalImpressions > 50) {
                                // High demand, low capture -> burning priority
                                priorityScore = Math.min(100, Math.round(totalImpressions / 5));
                                priorityLabel = '🔥 高搜索 · 低点击';
                            } else {
                                priorityScore = 50;
                                priorityLabel = '🟢 稳定获取流量';
                            }
                        }

                        return {
                            ...debt,
                            gscData: totalImpressions > 0 ? {
                                impressions: totalImpressions,
                                clicks: totalClicks,
                                matchedKeywords: matchedKeywords.slice(0, 3)
                            } : undefined,
                            priorityScore,
                            priorityLabel
                        };
                    });

                    // Sort by priority descending
                    semanticDebts.sort((a: any, b: any) => (b.priorityScore || 0) - (a.priorityScore || 0));
                }
                // ------------------------------------------
            }
        } catch (error) {
            console.error('[Semantic Gap GET] Analysis failed:', error);
            // Fallback gracefully
            return NextResponse.json({ error: '语义分析失败' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                businessOntology: ontology,
                semanticDebts,
                ourStrengths
            }
        });

    } catch (error: any) {
        console.error('[Semantic Gap GET] Error:', error);
        return NextResponse.json({ error: '获取语义缺口失败' }, { status: 500 });
    }
});
