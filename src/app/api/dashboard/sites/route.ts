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
            select: {
                id: true,
                domain: true,
                name: true,
                createdAt: true,
                audits: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        createdAt: true,
                        techScore: true,
                        pageCount: true,
                    },
                },
            },
        });

        const result = sites.map((site) => {
            const latest = site.audits[0] ?? null;

            return {
                id: site.id,
                domain: site.domain,
                name: site.name,
                createdAt: site.createdAt.toISOString(),
                latestAudit: latest
                    ? {
                        id: latest.id,
                        createdAt: latest.createdAt.toISOString(),
                        pageCount: latest.pageCount ?? 0,
                        techScore: latest.techScore,
                    }
                    : null,
            };
        });

        return NextResponse.json({ sites: result }, {
            headers: {
                'Cache-Control': 'private, max-age=0, s-maxage=30, stale-while-revalidate=60'
            }
        });
    } catch (error: any) {
        console.error("Error fetching sites:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
