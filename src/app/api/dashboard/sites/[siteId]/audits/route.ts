import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSiteContext } from '@/lib/api-utils';

/**
 * GET /api/dashboard/sites/[siteId]/audits
 * Returns audit history for a specific site (ownership verified).
 * Includes graphData (report) only for the most recent record to avoid heavy payload.
 */
export const GET = withSiteContext<{ siteId: string }>(async (_request, { site }) => {

    const audits = await prisma.siteAudit.findMany({
        where: { siteId: site.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
            id: true,
            createdAt: true,
            techScore: true,
            report: true,
        },
    });

    const result = audits.map((a, idx) => {
        const reportRaw = a.report as any;
        // Backward compatibility: if it doesn't have graphData key, the whole report IS the graphData
        const report = reportRaw?.graphData ? reportRaw.graphData : reportRaw;
        const issueReport = reportRaw?.issueReport ?? null;
        
        const pageCount: number = report?.nodes?.length ?? 0;
        return {
            id: a.id,
            createdAt: a.createdAt.toISOString(),
            pageCount,
            techScore: a.techScore,
            // Only include full graphData for the 5 most recent audits to keep payload manageable
            graphData: idx < 5 ? (report ?? null) : null,
            issueReport: idx < 5 ? (issueReport ?? null) : null,
        };
    });

    return NextResponse.json({ siteId: site.id, domain: site.domain, audits: result });
});
