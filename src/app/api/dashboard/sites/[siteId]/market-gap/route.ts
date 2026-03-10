import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSiteContext } from '@/lib/api-utils';
import { getDefaultProvider } from '@/lib/skills/providers';
import { isBlacklistedTopic } from '@/lib/skills/site-intelligence/constants';

export const GET = withSiteContext<{ siteId: string }>(async (request, { site: baseSite }) => {
    try {
        // Fetch the extra relations we need for Market Gap analysis
        const site = await prisma.site.findUnique({
            where: { id: baseSite.id },
            include: {
                competitors: true,
                keywords: true, // Assuming SiteKeyword stores the user's existing topics
                audits: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!site) {
            return NextResponse.json({ error: '站点不存在或无权访问' }, { status: 404 });
        }

        // 1. Gather our topics
        const ourTopics = new Set<string>();
        // Add seed keywords
        site.seedKeywords.forEach(k => ourTopics.add(k.toLowerCase()));
        // Add tracked keywords
        site.keywords.forEach(k => ourTopics.add(k.keyword.toLowerCase()));

        // FALLBACK: If no explicit keywords/seeds, pull from most recent audit report
        if (ourTopics.size === 0 && site.audits.length > 0) {
            const report = site.audits[0].report as any;
            if (report && Array.isArray(report.nodes)) {
                report.nodes.forEach((node: any) => {
                    if (node.type === 'pillar') {
                        // Clean up node name (e.g. "/blog" -> "blog", "topic:AI" -> "AI")
                        let name = node.name;
                        if (name.startsWith('/')) name = name.substring(1);
                        if (name.startsWith('topic:')) name = name.replace('topic:', '');
                        if (name) ourTopics.add(name.toLowerCase());
                    }
                });
            }
        }

        console.log(`[Market Gap GET] Site: ${site.domain}, final ourTopics count: ${ourTopics.size}`);

        // 2. Gather competitor topics and track frequencies
        const competitorTopicsFreq: Record<string, { count: number; domains: string[] }> = {};

        for (const comp of site.competitors) {
            for (const topic of comp.topics) {
                const normalized = topic.toLowerCase();
                if (!competitorTopicsFreq[normalized]) {
                    competitorTopicsFreq[normalized] = { count: 0, domains: [] };
                }
                competitorTopicsFreq[normalized].count += 1;
                competitorTopicsFreq[normalized].domains.push(comp.domain);
            }
        }

        // 3. Prepare for Semantic Market Gaps
        let marketGaps: Array<{ topic: string; frequency: number; competitors: string[]; intent?: string }> = [];
        let sharedTopics: Array<{ topic: string; frequency: number; intent?: string }> = [];
        let ourStrengths: Array<{ topic: string; intent?: string }> = [];

        const allOurTopics = Array.from(ourTopics).filter(t => !isBlacklistedTopic(t));
        const allCompetitorTopics = Object.keys(competitorTopicsFreq).filter(t => !isBlacklistedTopic(t.split('|')[0]));

        const aiProvider = await getDefaultProvider();
        const defaultModel = aiProvider.getDefaultModel();

        console.log(`[Market Gap GET] competitorTopics count: ${allCompetitorTopics.length}`);

        // 4. Analyze via LLM Semantic Clustering
        // We only invoke LLM clustering if there are actually topics to compare
        if (allOurTopics.length > 0 || allCompetitorTopics.length > 0) {
            try {
                const prompt = `
You are an expert SEO strategist.
Your task is to analyze two lists of SEO topics: "Our Topics" and "Competitor Topics".
Group similar or synonymous topics together semantically (e.g. "AI" and "Artificial Intelligence" should be grouped).
Then, categorize each grouped topic into exactly one of three buckets:
1. "sharedTopics": Topics that are present in BOTH "Our Topics" and "Competitor Topics".
2. "marketGaps": Topics that are present ONLY in "Competitor Topics" (they are writing about it, but we are not).
3. "ourStrengths": Topics that are present ONLY in "Our Topics" (we are writing about it, but they are not).

Here are the lists:
Our Topics: ${JSON.stringify(allOurTopics)}
Competitor Topics: ${JSON.stringify(allCompetitorTopics)}

Return ONLY a JSON object with this exact structure, using the best representative phrase for the grouped topic. Classify each into one of: 'Informational', 'Navigational', 'Commercial', 'Transactional'.

{
  "sharedTopics": [{ "topic": "A", "intent": "Informational" }],
  "marketGaps": [{ "topic": "C", "intent": "Commercial" }],
  "ourStrengths": [{ "topic": "E", "intent": "Informational" }]
}

IMPORTANT: ONLY include topics that are relevant to business growth, product features, or content marketing. EXCLUDE all administrative, legal, or generic system topics (e.g., "Privacy Policy", "Contact").

Do NOT wrap it in markdown code blocks like \`\`\`json.
                `.trim();

                const response = await aiProvider.generateContent(prompt, {
                    model: defaultModel.id,
                    temperature: 0.1,
                });

                console.log(`[Market Gap GET] LLM Response: ${response.content?.slice(0, 100)}...`);

                if (response.content) {
                    const match = response.content.match(/\{[\s\S]*\}/);
                    if (!match) {
                        throw new Error("Could not find JSON object in response");
                    }
                    const parsed = JSON.parse(match[0]);

                    // Re-calculate frequencies and competitors based on LLM's semantic groupings
                    // We map the LLM's "grouped topic" back to the original frequency by fuzzy matching
                    // the grouped topic against the original competitor topics.
                    // For a robust implementation, the LLM should also return WHICH original topics it grouped,
                    // but for v1, we will approximate frequency.

                    const calculateFreqs = (groupedTopic: string) => {
                        let count = 0;
                        let domains = new Set<string>();
                        let evidenceUrls = new Set<string>();
                        for (const [origFullTopic, data] of Object.entries(competitorTopicsFreq)) {
                            // Extract topic from "Topic|URL1,URL2"
                            const [origTopic, urlsStr] = origFullTopic.split('|');

                            // Simple substring match to assign original metrics back to the grouped topic
                            if (origTopic.toLowerCase().includes(groupedTopic.toLowerCase()) ||
                                groupedTopic.toLowerCase().includes(origTopic.toLowerCase())) {
                                count += data.count;
                                data.domains.forEach(d => domains.add(d));
                                if (urlsStr) {
                                    urlsStr.split(',').forEach(u => evidenceUrls.add(u));
                                }
                            }
                        }
                        return {
                            frequency: Math.max(1, count),
                            competitors: Array.from(domains),
                            evidence: Array.from(evidenceUrls).slice(0, 3) // Top 3 examples
                        };
                    };

                    marketGaps = (parsed.marketGaps || []).map((t: any) => ({
                        topic: t.topic,
                        intent: t.intent,
                        ...calculateFreqs(t.topic)
                    }));
                    sharedTopics = (parsed.sharedTopics || []).map((t: any) => ({
                        topic: t.topic,
                        intent: t.intent,
                        ...calculateFreqs(t.topic)
                    }));
                    ourStrengths = (parsed.ourStrengths || []).map((t: any) => ({
                        topic: t.topic,
                        intent: t.intent
                    }));
                }
            } catch (error) {
                console.error('[Market Gap GET] LLM Semantic Clustering failed, falling back to exact match', error);

                // Fallback: Exact String Matching
                Object.entries(competitorTopicsFreq).forEach(([topic, data]) => {
                    if (ourTopics.has(topic)) {
                        sharedTopics.push({ topic, frequency: data.count });
                    } else {
                        marketGaps.push({ topic, frequency: data.count, competitors: data.domains });
                    }
                });
                for (const topic of Array.from(ourTopics)) {
                    if (!competitorTopicsFreq[topic]) {
                        ourStrengths.push({ topic });
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                totalCompetitorsScanned: site.competitors.filter(c => c.topics.length > 0).length,
                marketGaps: marketGaps.map(g => ({ ...g, competitors: Array.from(new Set(g.competitors)) })).sort((a, b) => b.frequency - a.frequency),
                sharedTopics: sharedTopics.sort((a, b) => b.frequency - a.frequency),
                ourStrengths: ourStrengths
            }
        });

    } catch (error: any) {
        console.error('[Market Gap GET] Error:', error);
        return NextResponse.json({ error: '获取市场空白分析失败' }, { status: 500 });
    }
});
