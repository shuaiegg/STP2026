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
        const site = await prisma.site.findUnique({
            where: { id: siteId, userId: session.user.id },
            include: {
                gscConnections: true,
                ga4Connections: true
            }
        });

        if (!site) {
            return NextResponse.json({ error: 'Site not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, site });
    } catch (error: any) {
        console.error("Error fetching site details:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
