import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

export const GA4_SCOPES = [
    'https://www.googleapis.com/auth/analytics.readonly'
];

export function getGoogleOAuthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        // E.g., http://localhost:3000/api/auth/google-callback
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-callback`
    );
}

/**
 * Helper to fetch a site's GA4 connection, refresh token if necessary, 
 * and return the initialized GA4 clients (Admin & Data API).
 */
export async function getGa4Client(siteId: string) {
    const site = await prisma.site.findUnique({
        where: { id: siteId },
        include: { ga4Connections: true }
    });

    if (!site || !site.ga4Connections || site.ga4Connections.length === 0) {
        throw new Error("Site not connected to GA4.");
    }

    const existingAuth = site.ga4Connections[0];
    const oauth2Client = getGoogleOAuthClient();

    oauth2Client.setCredentials({
        access_token: existingAuth.accessToken,
        refresh_token: existingAuth.refreshToken,
        expiry_date: existingAuth.expiresAt.getTime()
    });

    // Check if token is expired (or expires within 5 minutes)
    const isExpired = Date.now() >= (existingAuth.expiresAt.getTime() - 5 * 60 * 1000);

    if (isExpired && existingAuth.refreshToken) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            await prisma.ga4Connection.update({
                where: { id: existingAuth.id },
                data: {
                    accessToken: credentials.access_token!,
                    expiresAt: new Date(credentials.expiry_date || Date.now() + 3600 * 1000),
                }
            });
            oauth2Client.setCredentials(credentials);
        } catch (error) {
            console.error('[GA4 Client] Token refresh failed:', error);
            throw new Error("Google Analytics authentication expired. Please reconnect.");
        }
    }

    // Return both the admin client (listing properties) and data client (fetching reports)
    const analyticsadmin = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client });
    const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: oauth2Client });

    return { analyticsadmin, analyticsdata, existingAuth, site };
}
