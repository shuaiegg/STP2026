import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getGoogleOAuthClient, GA4_SCOPES } from '@/lib/ga4-client';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ siteId: string }> }
) {
    try {
        const { siteId } = await params;
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }

        const userId = session.user.id;

        const oauth2Client = getGoogleOAuthClient();

        // Generate the url that will be used for authorization
        const authorizeUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Need offline to get refresh token
            scope: GA4_SCOPES,
            // Pass siteId, userId and type in state to know which site this auth is for
            state: JSON.stringify({ siteId, userId, type: 'ga4' }),
            prompt: 'consent' // Force to get refresh token
        });

        return NextResponse.json({ url: authorizeUrl });

    } catch (error: any) {
        console.error("[GA4 Auth Error]", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
