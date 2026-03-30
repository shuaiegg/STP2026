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
            pageCount: true,
            // report is EXCLUDED from initial list to avoid heavy payload
        },
    });

    // Fetch full reports for only the first 5 audits
    const auditIdsWithReports = audits.slice(0, 5).map(a => a.id);
    const auditsWithReports = await prisma.siteAudit.findMany({
        where: { id: { in: auditIdsWithReports } },
        select: {
            id: true,
            report: true,
        }
    });

    const reportMap = new Map(auditsWithReports.map(a => [a.id, a.report]));

    const result = audits.map((a, idx) => {
        const reportRaw = reportMap.get(a.id) as any;
        // Backward compatibility: if it doesn't have graphData key, the whole report IS the graphData
        const report = reportRaw?.graphData ? reportRaw.graphData : reportRaw;
        const issueReport = reportRaw?.issueReport ?? null;
        
        // Use the new pageCount column if available, fallback to report length if we have the report
        const pageCount = a.pageCount ?? report?.nodes?.length ?? 0;
        
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

    return NextResponse.json({ siteId: site.id, domain: site.domain, audits: result }, {
        headers: {
            'Cache-Control': 'private, max-age=60, stale-while-revalidate=120'
        }
    });
});
