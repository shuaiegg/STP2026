import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidateSiteCache } from '@/lib/site-intelligence/sites';
import { withSiteContext } from '@/lib/api-utils';

export const POST = withSiteContext<{ siteId: string }>(async (request, { site }) => {
    try {
        const body = await request.json();
        const { propertyId } = body;

        if (!propertyId) {
            return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
        }

        const existingAuth = await prisma.ga4Connection.findFirst({
            where: { siteId: site.id }
        });

        if (!existingAuth) {
            return NextResponse.json({ error: 'No GA4 connection found for this site. Connect GA4 first.' }, { status: 404 });
        }

        const updated = await prisma.ga4Connection.update({
            where: { id: existingAuth.id },
            data: { propertyId }
        });

        revalidateSiteCache(site.id);

        return NextResponse.json({
            success: true,
            message: 'GA4 Property selected successfully',
            connection: {
                id: updated.id,
                propertyId: updated.propertyId
            }
        });

    } catch (error) {
        console.error('[GA4 Select Property Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
});
