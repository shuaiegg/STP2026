import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

/**
 * Helper to get an authenticated Google Search Console client.
 * Automatically handles token refresh if the token is expired.
 */
export async function getGscClient(siteId: string) {
    const existingAuth = await prisma.gscConnection.findFirst({
        where: { siteId }
    });

    if (!existingAuth) {
        throw new Error('GSC_NOT_CONNECTED');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('OAUTH_NOT_CONFIGURED');
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({
        access_token: existingAuth.accessToken,
        refresh_token: existingAuth.refreshToken,
    });

    // Handle token refresh
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
            // Ensure the client uses the new tokens for this request
            oauth2Client.setCredentials(credentials);
        } catch (error) {
            console.error("Token refresh failed:", error);
            // We ignore throwing here, as the Google API call itself will throw an auth error if the token is completely invalid.
        }
    }

    const searchconsole = google.searchconsole({
        version: 'v1',
        auth: oauth2Client,
    });

    return { searchconsole, existingAuth };
}
