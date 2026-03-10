import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSiteContext } from '@/lib/api-utils';

/**
 * GET /api/dashboard/sites/[siteId]/audits/[auditId]
 * Returns a specific audit record, including its full graphData report.
 */
export const GET = withSiteContext<{ siteId: string, auditId: string }>(async (_request, { site, params }) => {
    const auditId = params.auditId;

    if (!auditId) {
        return NextResponse.json({ success: false, error: 'Audit ID is required' }, { status: 400 });
    }

    const audit = await prisma.siteAudit.findFirst({
        where: {
            id: auditId,
            siteId: site.id, // Ensure the audit actually belongs to the requested site (and thus the user)
        },
    });

    if (!audit) {
        return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });
    }

    return NextResponse.json({
        success: true,
        data: {
            id: audit.id,
            createdAt: audit.createdAt.toISOString(),
            techScore: audit.techScore,
            graphData: audit.report,
        }
    });
});
