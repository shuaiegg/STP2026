import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
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

    try {
        const site = await prisma.site.findUnique({
            where: { id: siteId, userId: session.user.id },
            include: { gscConnections: true }
        });

        if (!site) {
            return NextResponse.json({ error: 'Site not found' }, { status: 404 });
        }

        const gscConnection = site.gscConnections[0];
        if (!gscConnection) {
            return NextResponse.json({ error: 'GSC not connected' }, { status: 400 });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const redirectUri = `${appUrl}/api/dashboard/sites/${siteId}/gsc-sync/callback`;

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        oauth2Client.setCredentials({
            access_token: gscConnection.accessToken,
            refresh_token: gscConnection.refreshToken,
            expiry_date: gscConnection.expiresAt.getTime(),
        });

        // 自动刷新 token 逻辑
        oauth2Client.on('tokens', async (tokens: any) => {
            if (tokens.refresh_token) {
                await prisma.gscConnection.update({
                    where: { id: gscConnection.id },
                    data: {
                        accessToken: tokens.access_token!,
                        refreshToken: tokens.refresh_token,
                        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
                    }
                });
            } else if (tokens.access_token) {
                await prisma.gscConnection.update({
                    where: { id: gscConnection.id },
                    data: {
                        accessToken: tokens.access_token,
                        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
                    }
                });
            }
        });

        const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30); // 过去 30 天

        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        // 优先尝试 sc-domain 属性，如果失败再试带协议的
        let siteUrl = `sc-domain:${site.domain.replace(/^https?:\/\//, '')}`;
        let response;
        try {
            response = await webmasters.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate: formatDate(startDate),
                    endDate: formatDate(endDate),
                    dimensions: ['query'],
                    rowLimit: 1000,
                }
            });
        } catch (e: any) {
            if (e.code === 403 || e.message?.includes('User does not have sufficient permission')) {
                // 回退到 https 协议
                siteUrl = site.domain.startsWith('http') ? site.domain : `https://${site.domain}/`;
                response = await webmasters.searchanalytics.query({
                    siteUrl,
                    requestBody: {
                        startDate: formatDate(startDate),
                        endDate: formatDate(endDate),
                        dimensions: ['query'],
                        rowLimit: 1000,
                    }
                });
            } else {
                throw e;
            }
        }

        const rows = response.data.rows || [];

        // Upsert SiteKeyword (latest state cache)
        let syncCount = 0;
        for (const row of rows) {
            const keyword = row.keys?.[0];
            if (!keyword) continue;

            const impressions = row.impressions || 0;
            const clicks = row.clicks || 0;
            const position = row.position ? Math.round(row.position) : null;

            const existingKwd = await prisma.siteKeyword.findFirst({
                where: { siteId, keyword }
            });

            if (existingKwd) {
                await prisma.siteKeyword.update({
                    where: { id: existingKwd.id },
                    data: { impressions, clicks, position }
                });
            } else {
                await prisma.siteKeyword.create({
                    data: { siteId, keyword, impressions, clicks, position }
                });
            }
            syncCount++;
        }

        // ─── Snapshot Logic ────────────────────────────────────────────────
        const todayUTC = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');
        let snapshotCreated = false;
        let queriesSynced = 0;
        let pagesSynced = 0;
        let pagesError: string | null = null;

        // Check if snapshot already exists for today
        const existingSnapshot = await prisma.siteKeywordSnapshot.findFirst({
            where: { siteId, snapshotDate: todayUTC, dimensionType: 'query' }
        });

        if (!existingSnapshot) {
            // Write query dimension snapshots
            const querySnapshots = rows
                .filter((row: any) => row.keys?.[0])
                .map((row: any) => ({
                    siteId,
                    dimensionType: 'query',
                    value: row.keys![0],
                    clicks: row.clicks || 0,
                    impressions: row.impressions || 0,
                    position: row.position || 0,
                    snapshotDate: todayUTC,
                }));

            if (querySnapshots.length > 0) {
                await prisma.siteKeywordSnapshot.createMany({ data: querySnapshots });
                queriesSynced = querySnapshots.length;
            }

            // Fetch page dimension data (independent try/catch)
            try {
                const pageResponse = await webmasters.searchanalytics.query({
                    siteUrl,
                    requestBody: {
                        startDate: formatDate(startDate),
                        endDate: formatDate(endDate),
                        dimensions: ['page'],
                        rowLimit: 500,
                    }
                });

                const pageRows = pageResponse.data.rows || [];
                const pageSnapshots = pageRows
                    .filter((row: any) => row.keys?.[0])
                    .map((row: any) => ({
                        siteId,
                        dimensionType: 'page',
                        value: row.keys![0],
                        clicks: row.clicks || 0,
                        impressions: row.impressions || 0,
                        position: row.position || 0,
                        snapshotDate: todayUTC,
                    }));

                if (pageSnapshots.length > 0) {
                    await prisma.siteKeywordSnapshot.createMany({ data: pageSnapshots });
                    pagesSynced = pageSnapshots.length;
                }
            } catch (pageErr: any) {
                console.error('Page dimension sync failed (non-blocking):', pageErr.message);
                pagesError = pageErr.message || 'Page dimension sync failed';
            }

            snapshotCreated = true;

            // Async cleanup: remove oldest batch if >104 distinct dates
            (async () => {
                try {
                    const distinctDates = await prisma.siteKeywordSnapshot.findMany({
                        where: { siteId },
                        select: { snapshotDate: true },
                        distinct: ['snapshotDate'],
                        orderBy: { snapshotDate: 'asc' },
                    });

                    if (distinctDates.length > 104) {
                        const oldestDate = distinctDates[0].snapshotDate;
                        await prisma.siteKeywordSnapshot.deleteMany({
                            where: { siteId, snapshotDate: oldestDate }
                        });
                    }
                } catch (cleanupErr) {
                    console.error('Snapshot cleanup failed:', cleanupErr);
                }
            })();
        }

        // 更新最后同步时间
        await prisma.gscConnection.update({
            where: { id: gscConnection.id },
            data: { lastSyncAt: new Date() }
        });

        return NextResponse.json({
            success: true,
            count: syncCount,
            queriesSynced,
            pagesSynced,
            snapshotCreated,
            ...(pagesError ? { pagesError } : {}),
        });
    } catch (error: any) {
        console.error("GSC Sync Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to sync GSC data' }, { status: 500 });
    }
}
