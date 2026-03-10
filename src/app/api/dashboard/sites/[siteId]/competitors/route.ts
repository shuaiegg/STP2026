import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSiteContext } from '@/lib/api-utils';

export const GET = withSiteContext<{ siteId: string }>(async (request, { site }) => {
    try {
        const competitors = await prisma.competitor.findMany({
            where: { siteId: site.id },
            orderBy: { domain: 'asc' }
        });

        return NextResponse.json({ success: true, competitors });
    } catch (error: any) {
        console.error('[Competitors GET] Error:', error);
        return NextResponse.json({ error: '获取竞品列表失败' }, { status: 500 });
    }
});

export const POST = withSiteContext<{ siteId: string }>(async (request, { site }) => {
    try {
        const body = await request.json();
        const { domain } = body;

        if (!domain) {
            return NextResponse.json({ error: '缺失域名参数' }, { status: 400 });
        }

        // Clean domain
        let cleanDomain = domain.toLowerCase().trim();
        cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, ''); // Extract naked domain
        if (!cleanDomain) {
            return NextResponse.json({ error: '域名格式不正确' }, { status: 400 });
        }

        // Check limits (max 5 competitors per site)
        const competitorCount = await prisma.competitor.count({
            where: { siteId: site.id }
        });

        if (competitorCount >= 5) {
            return NextResponse.json({ error: '每个站点最多只能追踪 5 个竞品' }, { status: 400 });
        }

        // Check if already exists
        const existing = await prisma.competitor.findFirst({
            where: { siteId: site.id, domain: cleanDomain }
        });

        if (existing) {
            return NextResponse.json({ error: '该竞品已存在' }, { status: 400 });
        }

        const competitor = await prisma.competitor.create({
            data: {
                siteId: site.id,
                domain: cleanDomain,
                topics: []
            }
        });

        return NextResponse.json({ success: true, competitor });
    } catch (error: any) {
        console.error('[Competitors POST] Error:', error);
        return NextResponse.json({ error: '添加竞品失败' }, { status: 500 });
    }
});
