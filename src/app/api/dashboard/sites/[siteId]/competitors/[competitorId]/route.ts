import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSiteContext } from '@/lib/api-utils';

export const DELETE = withSiteContext<{ siteId: string; competitorId: string }>(async (
    request,
    { params, site }
) => {
    try {
        const { competitorId } = params;

        // Delete the competitor (Prisma will throw if not found, but we can just use deleteMany to be safe/idempotent)
        const result = await prisma.competitor.deleteMany({
            where: {
                id: competitorId,
                siteId: site.id
            }
        });

        if (result.count === 0) {
            return NextResponse.json({ error: '找不到该竞品记录' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: '竞品已删除' });
    } catch (error: any) {
        console.error('[Competitors DELETE] Error:', error);
        return NextResponse.json({ error: '删除竞品失败' }, { status: 500 });
    }
});
