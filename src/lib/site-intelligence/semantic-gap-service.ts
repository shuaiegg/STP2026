import { prisma } from '@/lib/prisma';
import { getDefaultProvider } from '@/lib/skills/providers';
import { isBlacklistedTopic } from '@/lib/skills/site-intelligence/constants';

export async function getSemanticGap(siteId: string, forceRefresh: boolean = false) {
    try {
        const site = await prisma.site.findUnique({
            where: { id: siteId },
            include: {
                keywords: true,
                audits: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!site) {
            throw new Error('站点不存在');
        }

        const latestOntology = await prisma.siteOntology.findFirst({
            where: { siteId: site.id },
            orderBy: { version: 'desc' }
        });

        if (!latestOntology) {
            throw new Error('尚未提取业务本体数据 (Business Ontology)。请先执行业务提取。');
        }

        // Check for cached analysis
        const existingDebts = await prisma.semanticDebt.findMany({
            where: { ontologyId: latestOntology.id }
        });

        if (existingDebts.length > 0 && !forceRefresh) {
            console.log(`[Semantic Gap Service] Returning cached analysis for ${site.domain}`);
            return {
                ontology: latestOntology,
                semanticDebts: existingDebts,
                isCached: true
            };
        }

        const idealTopics = (latestOntology.idealTopicMap as any) || [];

        // 1. Gather our actual topics
        const ourTopics = new Set<string>();
        if (site.seedKeywords) {
            site.seedKeywords.forEach(k => ourTopics.add(k.toLowerCase()));
        }
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
        let semanticDebts: any[] = [];

        const aiProvider = await getDefaultProvider();
        const defaultModel = aiProvider.getDefaultModel();

        const prompt = `
You are an expert SEO Strategist performing a 'Semantic Debt Analysis'.
Compare the "Ideal Topic Map" (what a leader in this niche MUST cover) with "Our Existing Content Topics".

Your Goal:
1. Identify "Semantic Debts": Pillars or subtopics from the Ideal Map that are entirely missing or weakly covered in Our Content.
2. Identify "Core Strengths": Pillars from the Ideal Map that are well-covered by Our Content. 

For each Semantic Debt, provide:
- coverageScore (0-100): How well is this topic currently covered? (0=No content, 50=Basic intro, 100=Comprehensive guide)
- proofDensity (0-100): Are there case studies, data, or testimonials for this topic? (0=Pure opinion, 100=Extensive evidence)

Context:
- Ideal Topic Map: ${JSON.stringify(idealTopics)}
- Our Existing Content Topics: ${JSON.stringify(allOurTopics)}

Return ONLY a JSON object with this exact structure:
{
  "semanticDebts": [
     { 
       "topic": "Name of missing pillar", 
       "subtopics": ["missing sub 1", "missing sub 2"], 
       "relevance": "Why this is critical for business",
       "coverageScore": 20,
       "proofDensity": 10
     }
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
            if (!match) throw new Error("JSON not found in LLM response");
            const parsed = JSON.parse(match[0]);
            semanticDebts = parsed.semanticDebts || [];

            // --- Enrich Semantic Debts with GSC Data ---
            let searchQueries: Array<{ keyword: string, impressions: number, clicks: number, ctr: number }> = [];

            try {
                const { getGscClient } = await import('@/lib/gsc-client');
                const { searchconsole, existingAuth } = await getGscClient(site.id);

                if ((existingAuth as any).propertyId) {
                    const propId = (existingAuth as any).propertyId;
                    const endDate = new Date();
                    const startDate = new Date();
                    startDate.setDate(endDate.getDate() - 30);
                    const startStr = startDate.toISOString().split('T')[0];
                    const endStr = endDate.toISOString().split('T')[0];

                    const queriesResponse = await searchconsole.searchanalytics.query({
                        siteUrl: propId,
                        requestBody: {
                            startDate: startStr,
                            endDate: endStr,
                            dimensions: ['query'],
                            rowLimit: 500,
                        }
                    });

                    const rows = queriesResponse.data.rows || [];
                    searchQueries = rows.map(row => ({
                        keyword: row.keys ? row.keys[0] : '',
                        impressions: row.impressions || 0,
                        clicks: row.clicks || 0,
                        ctr: row.ctr || 0
                    }));
                }
            } catch (e: any) {
                console.log("[Semantic Gap Service] GSC Data fetch failed:", e.message);
            }

            if (searchQueries.length === 0 && site.keywords && site.keywords.length > 0) {
                searchQueries = site.keywords.map(kw => ({
                    keyword: kw.keyword,
                    impressions: kw.impressions || 0,
                    clicks: kw.clicks || 0,
                    ctr: (kw.impressions && kw.impressions > 0) ? (kw.clicks || 0) / kw.impressions : 0
                }));
            }

            if (searchQueries.length > 0) {
                semanticDebts = semanticDebts.map(debt => {
                    let totalImpressions = 0;
                    let totalClicks = 0;
                    const debtTerms = Array.from(new Set([
                        ...debt.topic.toLowerCase().split(/[\s\-_]+/),
                        ...(debt.subtopics || []).flatMap((s: string) => s.toLowerCase().split(/[\s\-_]+/))
                    ])).filter(t => t.length > 3);

                    searchQueries.forEach(sq => {
                        const kwLower = sq.keyword.toLowerCase();
                        if (debtTerms.some(term => kwLower.includes(term))) {
                            totalImpressions += sq.impressions;
                            totalClicks += sq.clicks;
                        }
                    });

                    let priorityLabel = '';
                    if (totalImpressions > 0) {
                        const ctr = totalClicks / totalImpressions;
                        if (ctr < 0.05 && totalImpressions > 50) {
                            priorityLabel = '🔥 高搜索 · 低点击';
                        } else {
                            priorityLabel = '🟢 稳定获取流量';
                        }
                    }

                    return {
                        ...debt,
                        gscData: totalImpressions > 0 ? { impressions: totalImpressions, clicks: totalClicks } : undefined,
                        priorityLabel
                    };
                });
            }

            // 3. Save analysis result back to ontology cache
            if (semanticDebts.length > 0) {
                await prisma.$transaction([
                    prisma.semanticDebt.deleteMany({
                        where: { ontologyId: latestOntology.id }
                    }),
                    prisma.semanticDebt.createMany({
                        data: semanticDebts.map(debt => ({
                            siteId: site.id,
                            ontologyId: latestOntology.id,
                            topic: debt.topic,
                            subtopics: debt.subtopics || [],
                            relevance: debt.relevance || '',
                            coverageScore: debt.coverageScore || 0,
                            proofDensity: debt.proofDensity || 0,
                            gscImpressions: debt.gscData?.impressions || 0,
                            gscClicks: debt.gscData?.clicks || 0,
                            priorityLabel: debt.priorityLabel || '',
                        }))
                    })
                ]);
            }

            // Refetch to get the IDs if we created new ones, or just return them
            const finalDebts = await prisma.semanticDebt.findMany({
                where: { ontologyId: latestOntology.id }
            });

            return {
                ontology: latestOntology,
                semanticDebts: finalDebts,
                isCached: false
            };
        }

        throw new Error("No content generated by AI provider");
    } catch (error) {
        console.error('[Semantic Gap Service] Error:', error);
        throw error;
    }
}
