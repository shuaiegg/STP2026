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

    try {
        // Verify site ownership
        const site = await prisma.site.findUnique({
            where: { id: siteId, userId: session.user.id },
        });
        if (!site) {
            return NextResponse.json({ error: 'Site not found' }, { status: 404 });
        }

        // Get the latest snapshot date for page dimension
        const latestSnapshot = await prisma.siteKeywordSnapshot.findFirst({
            where: { siteId, dimensionType: 'page' },
            orderBy: { snapshotDate: 'desc' },
            select: { snapshotDate: true },
        });

        if (!latestSnapshot) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Get all page snapshots for the latest date
        const pageSnapshots = await prisma.siteKeywordSnapshot.findMany({
            where: {
                siteId,
                dimensionType: 'page',
                snapshotDate: latestSnapshot.snapshotDate,
            },
            select: {
                value: true,
                clicks: true,
                impressions: true,
                position: true,
            },
        });

        return NextResponse.json({ success: true, data: pageSnapshots });
    } catch (error: any) {
        console.error('Page attribution error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
