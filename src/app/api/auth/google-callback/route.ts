import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateStr = url.searchParams.get('state');

    if (!code) {
        return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
    }

    let userId = null;
    let siteId = null;
    let connectionType = 'gsc'; // default

    if (stateStr) {
        try {
            const state = JSON.parse(stateStr);
            userId = state.userId;
            siteId = state.siteId;
            if (state.type === 'ga4') connectionType = 'ga4';
        } catch (e) {
            console.error('Error parsing state:', e);
        }
    }

    if (!siteId) {
        return NextResponse.json({ error: 'Missing siteId in state' }, { status: 400 });
    }

    if (!userId) {
        // Fallback to session
        const session = await auth.api.getSession({ headers: await headers() });
        userId = session?.user?.id;
    }

    if (!userId) {
        return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/auth/google-callback`;

    if (!clientId || !clientSecret) {
        return NextResponse.json({ error: 'System not configured for OAuth' }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);

        // Default expiry is 1 hour if not provided
        const expiryDate = tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : new Date(Date.now() + 3600 * 1000);

        if (connectionType === 'ga4') {
            const existingAuth = await prisma.ga4Connection.findFirst({
                where: { siteId }
            });

            if (existingAuth) {
                await prisma.ga4Connection.update({
                    where: { id: existingAuth.id },
                    data: {
                        accessToken: tokens.access_token || existingAuth.accessToken,
                        refreshToken: tokens.refresh_token || existingAuth.refreshToken,
                        expiresAt: expiryDate,
                    }
                });
            } else {
                await prisma.ga4Connection.create({
                    data: {
                        siteId,
                        accessToken: tokens.access_token!,
                        refreshToken: tokens.refresh_token || '',
                        expiresAt: expiryDate,
                    }
                });
            }
        } else {
            const existingAuth = await prisma.gscConnection.findFirst({
                where: { siteId }
            });

            if (existingAuth) {
                await prisma.gscConnection.update({
                    where: { id: existingAuth.id },
                    data: {
                        accessToken: tokens.access_token || existingAuth.accessToken,
                        refreshToken: tokens.refresh_token || existingAuth.refreshToken,
                        expiresAt: expiryDate,
                    }
                });
            } else {
                await prisma.gscConnection.create({
                    data: {
                        siteId,
                        accessToken: tokens.access_token!,
                        refreshToken: tokens.refresh_token || '',
                        expiresAt: expiryDate,
                    }
                });
            }
        }

        // Redirect back to overview
        return NextResponse.redirect(`${appUrl}/dashboard/site-intelligence/${siteId}`);
    } catch (error: any) {
        console.error("Google Token Auth Error:", error);
        return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 500 });
    }
}
