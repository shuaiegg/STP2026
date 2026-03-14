import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSiteContext } from '@/lib/api-utils';

export const POST = withSiteContext<{ siteId: string }>(async (request, { site }) => {
    try {
        const { updates } = await request.json();

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: '无效的更新数据' }, { status: 400 });
        }

        // Use transaction to ensure all updates succeed or fail together
        await prisma.$transaction(
            updates.map((update: any) =>
                prisma.plannedArticle.update({
                    where: { id: update.id },
                    data: {
                        kanbanOrder: update.kanbanOrder,
                        contentPlanId: update.contentPlanId
                    }
                })
            )
        );

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Article Reorder POST] Error:', error);
        return NextResponse.json({ error: '批量更新排序失败' }, { status: 500 });
    }
});
