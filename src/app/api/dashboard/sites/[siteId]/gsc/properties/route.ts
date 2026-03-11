import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getGscClient } from '@/lib/gsc-client';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ siteId: string }> }
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { siteId } = await params;

    try {
        const { searchconsole } = await getGscClient(siteId);

        const response = await searchconsole.sites.list();
        const siteEntries = response.data.siteEntry || [];

        return NextResponse.json({
            success: true,
            properties: siteEntries.map(entry => ({
                siteUrl: entry.siteUrl,
                permissionLevel: entry.permissionLevel
            }))
        });
    } catch (error: any) {
        console.error("Failed to fetch GSC properties:", error);
        return NextResponse.json({ error: 'Failed to fetch GSC properties' }, { status: 500 });
    }
}
