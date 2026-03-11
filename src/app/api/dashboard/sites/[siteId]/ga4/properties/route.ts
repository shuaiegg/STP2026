import { NextResponse } from 'next/server';
import { getGa4Client } from '@/lib/ga4-client';
import { withSiteContext } from '@/lib/api-utils';

export const GET = withSiteContext<{ siteId: string }>(async (request, { site }) => {
    try {
        const { analyticsadmin, existingAuth } = await getGa4Client(site.id);

        // Fetch accounts
        const accountsResponse = await analyticsadmin.accounts.list();
        const accounts = accountsResponse.data.accounts || [];

        let properties: Array<{ id: string; name: string; displayName: string }> = [];

        await Promise.all(accounts.map(async (account) => {
            if (!account.name) return;
            try {
                const propsRes = await analyticsadmin.properties.list({ filter: `parent:${account.name}` });
                const props = propsRes.data.properties || [];
                props.forEach(p => {
                    if (p.name && p.displayName) {
                        properties.push({
                            id: p.name,
                            name: p.name,
                            displayName: `${p.displayName} (${account.displayName || 'Unknown Account'})`
                        });
                    }
                });
            } catch (e) {
                console.warn(`Could not list properties for account ${account.name}`, e);
            }
        }));

        return NextResponse.json({
            success: true,
            properties,
            selectedPropertyId: existingAuth.propertyId
        });

    } catch (error: any) {
        console.error('[GA4 Properties GET]', error);

        // Handle unauthenticated case specifically so frontend can prompt reconnect
        if (error.message?.includes('invalid_grant') || error.message?.includes('expired') || error.message?.includes('Site not connected')) {
            return NextResponse.json({ error: 'GA4 Authentication expired or missing.', needsReauth: true }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to fetch GA4 properties' }, { status: 500 });
    }
});
