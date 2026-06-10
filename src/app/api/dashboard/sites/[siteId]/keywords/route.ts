import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ siteId: string }> }
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId } = await params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const sortBy = url.searchParams.get('sortBy') || 'impressions'; // clicks | impressions | position

    try {
        const site = await prisma.site.findUnique({
            where: { id: siteId, userId: session.user.id },
        });
        if (!site) {
            return NextResponse.json({ error: 'Site not found' }, { status: 404 });
        }

        const orderField = sortBy === 'clicks' ? { clicks: 'desc' as const }
            : sortBy === 'position' ? { position: 'asc' as const }
            : { impressions: 'desc' as const };

        const [keywords, gscConnection] = await Promise.all([
            prisma.siteKeyword.findMany({
                where: { siteId },
                orderBy: orderField,
                take: limit,
                select: {
                    keyword: true,
                    impressions: true,
                    clicks: true,
                    position: true,
                    updatedAt: true,
                },
            }),
            prisma.gscConnection.findFirst({
                where: { siteId },
                select: { lastSyncAt: true },
            }),
        ]);

        return NextResponse.json({
            success: true,
            keywords,
            total: keywords.length,
            lastSyncAt: gscConnection?.lastSyncAt ?? null,
        });
    } catch (error: any) {
        console.error('Keywords fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
