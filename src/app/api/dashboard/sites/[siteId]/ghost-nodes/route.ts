import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSiteContext } from '@/lib/api-utils';

export const GET = withSiteContext<{ siteId: string }>(async (request, { site }) => {
    try {
        // 1. Get latest ontology
        const latestOntology = await prisma.siteOntology.findFirst({
            where: { siteId: site.id },
            orderBy: { version: 'desc' }
        });

        if (!latestOntology || !latestOntology.idealTopicMap) {
            return NextResponse.json({ nodes: [] });
        }

        const idealTopicMap = latestOntology.idealTopicMap as any[];
        
        // 2. Get latest audit graph data
        const latestAudit = await prisma.siteAudit.findFirst({
            where: { siteId: site.id, status: 'completed' },
            orderBy: { createdAt: 'desc' }
        });

        const existingNodes = (latestAudit?.report as any)?.nodes || [];
        const existingNodeLabels = existingNodes.map((n: any) => (n.name || n.id || '').toLowerCase());

        // 3. Identify Ghost Nodes (uncovered topics)
        const ghostNodes: any[] = [];
        
        idealTopicMap.forEach((pillar: any, index: number) => {
            const topic = pillar.topic;
            const isCovered = existingNodeLabels.some((label: string) => 
                label.includes(topic.toLowerCase()) || topic.toLowerCase().includes(label)
            );

            if (!isCovered) {
                // Find related existing nodes for coordinate calculation
                const relatedExistingNodes = existingNodes.filter((n: any) => {
                    const label = (n.name || n.id || '').toLowerCase();
                    return pillar.subtopics?.some((sub: string) => 
                        label.includes(sub.toLowerCase()) || sub.toLowerCase().includes(label)
                    );
                });

                let x = 0, y = 0, z = 0;

                if (relatedExistingNodes.length > 0) {
                    // Average position + some offset
                    x = relatedExistingNodes.reduce((sum: number, n: any) => sum + (n.x || 0), 0) / relatedExistingNodes.length + (Math.random() - 0.5) * 50;
                    y = relatedExistingNodes.reduce((sum: number, n: any) => sum + (n.y || 0), 0) / relatedExistingNodes.length + (Math.random() - 0.5) * 50;
                    z = relatedExistingNodes.reduce((sum: number, n: any) => sum + (n.z || 0), 0) / relatedExistingNodes.length + (Math.random() - 0.5) * 50;
                } else {
                    // Random position in a reasonable range
                    x = (Math.random() - 0.5) * 400;
                    y = (Math.random() - 0.5) * 400;
                    z = (Math.random() - 0.5) * 400;
                }

                ghostNodes.push({
                    id: `ghost-${topic}`,
                    name: topic,
                    type: 'ghost',
                    val: 15, // Size
                    x, y, z,
                    subtopics: pillar.subtopics || []
                });
            }
        });

        return NextResponse.json({ nodes: ghostNodes });

    } catch (error: any) {
        console.error('[Ghost Nodes GET] Error:', error);
        return NextResponse.json({ error: '获取 Ghost Nodes 失败' }, { status: 500 });
    }
});
