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
    const topN = parseInt(url.searchParams.get('topN') || '5', 10);
    const limit = parseInt(url.searchParams.get('limit') || '8', 10);

    try {
        // Verify site ownership
        const site = await prisma.site.findUnique({
            where: { id: siteId, userId: session.user.id },
        });
        if (!site) {
            return NextResponse.json({ error: 'Site not found' }, { status: 404 });
        }

        // Get distinct snapshot dates (most recent first)
        const distinctDates = await prisma.siteKeywordSnapshot.findMany({
            where: { siteId, dimensionType: 'query' },
            select: { snapshotDate: true },
            distinct: ['snapshotDate'],
            orderBy: { snapshotDate: 'desc' },
            take: limit,
        });

        if (distinctDates.length < 2) {
            return NextResponse.json({
                success: true,
                data: [],
                snapshotCount: distinctDates.length,
            });
        }

        const dateRange = distinctDates.map((d: { snapshotDate: Date }) => d.snapshotDate);
        const oldestDate = dateRange[dateRange.length - 1];
        const newestDate = dateRange[0];

        // Find top N keywords by clicks in the latest snapshot
        const topKeywords = await prisma.siteKeywordSnapshot.findMany({
            where: {
                siteId,
                dimensionType: 'query',
                snapshotDate: newestDate,
            },
            orderBy: { clicks: 'desc' },
            take: topN,
            select: { value: true },
        });

        const keywordValues = topKeywords.map((k: { value: string }) => k.value);

        if (keywordValues.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                snapshotCount: distinctDates.length,
            });
        }

        // Get history for these keywords across all snapshot dates
        const snapshots = await prisma.siteKeywordSnapshot.findMany({
            where: {
                siteId,
                dimensionType: 'query',
                value: { in: keywordValues },
                snapshotDate: { gte: oldestDate, lte: newestDate },
            },
            orderBy: { snapshotDate: 'asc' },
            select: {
                value: true,
                position: true,
                clicks: true,
                snapshotDate: true,
            },
        });

        // Group by keyword
        const grouped: Record<string, { date: string; position: number; clicks: number }[]> = {};
        for (const s of snapshots) {
            if (!grouped[s.value]) grouped[s.value] = [];
            grouped[s.value].push({
                date: s.snapshotDate.toISOString().split('T')[0],
                position: s.position,
                clicks: s.clicks,
            });
        }

        // Build chart-ready data: array of { date, [keyword1]: position, ... }
        const dateSet = [...new Set(snapshots.map((s: { snapshotDate: Date }) => s.snapshotDate.toISOString().split('T')[0]))].sort();
        const chartData = dateSet.map(date => {
            const entry: Record<string, any> = { date };
            for (const kw of keywordValues) {
                const point = grouped[kw]?.find(p => p.date === date);
                entry[kw] = point ? point.position : null;
                entry[`${kw}_clicks`] = point ? point.clicks : null;
            }
            return entry;
        });

        return NextResponse.json({
            success: true,
            data: chartData,
            keywords: keywordValues,
            snapshotCount: distinctDates.length,
        });
    } catch (error: any) {
        console.error('Keyword trends error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
