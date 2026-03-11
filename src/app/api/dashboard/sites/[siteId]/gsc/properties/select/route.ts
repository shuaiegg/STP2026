import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

        return NextResponse.json({ success: true, connection: updated });
    } catch (error: any) {
        console.error("Failed to select GSC property:", error);
        return NextResponse.json({ error: 'Failed to select GSC property' }, { status: 500 });
    }
}
