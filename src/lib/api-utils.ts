import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Site } from '@prisma/client';

export type RouteHandlerParams<T = any> = { params: Promise<T> };

export type SiteContextHandler<T = any> = (
    request: Request,
    context: { params: T; site: Site; session: any }
) => Promise<Response>;

/**
 * A wrapper for API routes that require both authentication and site ownership verification.
 * It automatically extracts the `siteId` from the route params, checks permissions,
 * and passes the resolved `site` object to the inner handler.
 */
export function withSiteContext<T extends { siteId: string }>(
    handler: SiteContextHandler<T>
) {
    return async (request: Request, { params }: RouteHandlerParams<T>) => {
        // 1. Authenticate user
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) {
            return NextResponse.json({ error: '未授权访问' }, { status: 401 });
        }

        try {
            // 2. Resolve params
            const resolvedParams = await params;
            const { siteId } = resolvedParams;

            if (!siteId) {
                return NextResponse.json({ error: '缺少 siteId 参数' }, { status: 400 });
            }

            // 3. Verify site ownership
            const site = await prisma.site.findUnique({
                where: { id: siteId, userId: session.user.id }
            });

            if (!site) {
                return NextResponse.json({ error: '站点不存在或无权访问' }, { status: 404 });
            }

            // 4. Pass control to the specific handler
            return await handler(request, { params: resolvedParams, site, session });
        } catch (error: any) {
            console.error('[withSiteContext] Wrapper Error:', error);
            return NextResponse.json({ error: '处理请求时发生内部错误' }, { status: 500 });
        }
    };
}
