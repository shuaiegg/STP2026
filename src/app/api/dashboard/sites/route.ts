import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/sites
 * Returns all Sites for the current user, with their latest SiteAudit summary.
 */
export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const sites = await prisma.site.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: 'desc' },
            include: {
                audits: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        createdAt: true,
                        techScore: true,
                        report: true,
                    },
                },
            },
        });

        const result = sites.map((site) => {
            const latest = site.audits[0] ?? null;
            let report = latest?.report;
            if (typeof report === 'string') {
                try {
                    report = JSON.parse(report);
                } catch (e) {
                    report = {};
                }
            }
            const pageCount: number = (report as any)?.nodes?.length ?? 0;

            return {
                id: site.id,
                domain: site.domain,
                name: site.name,
                createdAt: site.createdAt.toISOString(),
                latestAudit: latest
                    ? {
                        id: latest.id,
                        createdAt: latest.createdAt.toISOString(),
                        pageCount,
                        techScore: latest.techScore,
                    }
                    : null,
            };
        });

        return NextResponse.json({ sites: result });
    } catch (error: any) {
        console.error("Error fetching sites:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
