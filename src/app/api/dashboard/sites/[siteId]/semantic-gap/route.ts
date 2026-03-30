import { NextResponse } from 'next/server';
import { withSiteContext } from '@/lib/api-utils';
import { getSemanticGap } from '@/lib/site-intelligence/semantic-gap-service';

export const GET = withSiteContext<{ siteId: string }>(async (request, { site }) => {
    try {
        const url = new URL(request.url);
        const forceRefresh = url.searchParams.get('refresh') === 'true';

        const result = await getSemanticGap(site.id, forceRefresh);

        return NextResponse.json({
            success: true,
            data: result
        }, {
            headers: {
                'Cache-Control': 'private, max-age=300, stale-while-revalidate=600'
            }
        });

    } catch (error: any) {
        console.error('[Semantic Gap GET] Error:', error);
        
        const status = error.message.includes('尚未提取') ? 400 : 500;
        return NextResponse.json({ error: error.message || '获取语义缺口失败' }, { status });
    }
});
