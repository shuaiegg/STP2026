import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSiteContext } from '@/lib/api-utils';

export const GET = withSiteContext<{ siteId: string }>(async (request, { site }) => {
    try {
        const competitors = await prisma.competitor.findMany({
            where: { siteId: site.id }
        });

        // 1. Gather our topics
        const ourTopics = new Set<string>();
        const siteData = await prisma.site.findUnique({
            where: { id: site.id },
            include: { keywords: true }
        });

        siteData?.seedKeywords.forEach(k => ourTopics.add(k.toLowerCase().trim()));
        siteData?.keywords.forEach(k => ourTopics.add(k.keyword.toLowerCase().trim()));

        // Tally competitor topics
        const topicTally: Record<string, { topicObj: string, frequency: number, competitors: Set<string>, evidence: Set<string> }> = {};

        competitors.forEach(comp => {
            const topics = comp.topics as string[];
            if (Array.isArray(topics)) {
                topics.forEach(t => {
                    if (!t) return;

                    let topicName = t;
                    let urls: string[] = [];

                    if (t.includes('|')) {
                        const parts = t.split('|');
                        topicName = parts[0].trim();
                        urls = parts[1].split(',').filter(Boolean);
                    }

                    const lower = topicName.toLowerCase();
                    if (!topicTally[lower]) {
                        topicTally[lower] = { topicObj: topicName, frequency: 0, competitors: new Set(), evidence: new Set() };
                    }
                    topicTally[lower].frequency += 1;
                    topicTally[lower].competitors.add(comp.domain);
                    urls.forEach(u => topicTally[lower].evidence.add(u));
                });
            }
        });

        const marketGaps = [];
        for (const [lowerTopic, data] of Object.entries(topicTally)) {
            // Simple match: if any of our exact keywords match the topic
            const haveTopic = Array.from(ourTopics).some(t => t.includes(lowerTopic) || lowerTopic.includes(t));

            if (!haveTopic && data.frequency > 0) {
                marketGaps.push({
                    topic: data.topicObj,
                    frequency: data.frequency,
                    intent: 'Informational', // Simplification
                    competitors: Array.from(data.competitors),
                    evidence: Array.from(data.evidence)
                });
            }
        }

        marketGaps.sort((a, b) => b.frequency - a.frequency);

        // Calculate our strengths (topics we have that standard competitors don't heavily focus on)
        const ourStrengths = Array.from(ourTopics)
            .filter(t => !topicTally[t.toLowerCase()])
            .map(t => ({ topic: t, intent: 'Informational' }));

        return NextResponse.json({
            success: true,
            data: {
                totalCompetitorsScanned: competitors.length,
                marketGaps,
                ourStrengths
            }
        }, {
            headers: {
                'Cache-Control': 'private, max-age=300, stale-while-revalidate=600'
            }
        });

    } catch (error: any) {
        console.error('[MarketGap] Error:', error);
        return NextResponse.json({ error: '获取市场空白分析失败' }, { status: 500 });
    }
});
