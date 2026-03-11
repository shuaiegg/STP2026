import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { google } from 'googleapis';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ siteId: string }> }
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { siteId } = await params;

    const existingAuth = await prisma.gscConnection.findFirst({
        where: { siteId }
    });

    if (!existingAuth) {
        return NextResponse.json({ error: 'OAuth connection not found' }, { status: 404 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'OAuth credentials not set up' }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({
        access_token: existingAuth.accessToken,
        refresh_token: existingAuth.refreshToken,
    });

    // Check optional token refresh
    if (new Date() >= existingAuth.expiresAt) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            await prisma.gscConnection.update({
                where: { id: existingAuth.id },
                data: {
                    accessToken: credentials.access_token!,
                    refreshToken: credentials.refresh_token || existingAuth.refreshToken,
                    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600 * 1000)
                }
            });
        } catch (error) {
            console.error("Token refresh failed:", error);
            // Optionally, handle forced re-auth needed
        }
    }

    try {
        const searchconsole = google.searchconsole({
            version: 'v1',
            auth: oauth2Client,
        });

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
