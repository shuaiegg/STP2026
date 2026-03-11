import { NextResponse } from 'next/server';
import { google } from 'googleapis';
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

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/auth/gsc-callback`;

    if (!clientId || !clientSecret) {
        console.error("Missing Google OAuth credentials");
        return NextResponse.json({ error: '系统尚未配置 Google OAuth' }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );

    // Generate a url that asks permissions for Google Search Console scope
    const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Need offline to get refresh token
        scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
        state: JSON.stringify({ siteId, userId: session.user.id }),
        prompt: 'consent' // Force to get refresh token
    });

    return NextResponse.json({ url: authorizeUrl });
}
