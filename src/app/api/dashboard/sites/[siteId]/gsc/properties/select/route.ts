import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidateSiteCache } from '@/lib/site-intelligence/sites';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ siteId: string }> }
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { siteId } = await params;

    try {
        const body = await request.json();
        const { propertyId } = body;

        if (!propertyId) {
            return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
        }

        const existingAuth = await prisma.gscConnection.findFirst({
            where: { siteId }
        });

        if (!existingAuth) {
            return NextResponse.json({ error: 'OAuth connection not found' }, { status: 404 });
        }

        const updated = await prisma.gscConnection.update({
            where: { id: existingAuth.id },
            data: {
                propertyId
            }
        });

        revalidateSiteCache(siteId);

        // Fire-and-forget: trigger initial GSC data sync so snapshots start populating
        // without the user having to visit any other tab. Failure is logged, not surfaced.
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const cookieHeader = request.headers.get('cookie') || '';
        fetch(`${appUrl}/api/dashboard/sites/${siteId}/gsc-sync`, {
            method: 'POST',
            headers: { cookie: cookieHeader },
        }).catch((err: Error) => console.error('[gsc-auto-sync] initial sync failed:', err.message));

        return NextResponse.json({ success: true, connection: updated });
    } catch (error: any) {
        console.error("Failed to select GSC property:", error);
        return NextResponse.json({ error: 'Failed to select GSC property' }, { status: 500 });
    }
}
