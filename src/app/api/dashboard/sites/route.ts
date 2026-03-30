import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { revalidateSiteCache } from '@/lib/site-intelligence/sites';

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
                isCompetitor: true,
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
                isCompetitor: site.isCompetitor,
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

/**
 * POST /api/dashboard/sites
 * Creates a new Site record for the user.
 */
export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { domain, name, isCompetitor = false } = body;

        if (!domain) {
            return NextResponse.json({ error: 'Missing required field: domain' }, { status: 400 });
        }

        // Check if site already exists for this user
        const existing = await prisma.site.findFirst({
            where: { userId: session.user.id, domain },
        });

        if (existing) {
            return NextResponse.json({ error: 'Site already exists' }, { status: 409 });
        }

        const site = await prisma.site.create({
            data: {
                userId: session.user.id,
                domain,
                name: name || domain,
                isCompetitor: !!isCompetitor,
            },
        });

        // Revalidate cache
        revalidateSiteCache();

        return NextResponse.json({
            success: true,
            site: {
                id: site.id,
                domain: site.domain,
                name: site.name,
                isCompetitor: site.isCompetitor,
            }
        });
    } catch (error: any) {
        console.error("Error creating site:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
