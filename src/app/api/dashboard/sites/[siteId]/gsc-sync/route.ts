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

        // 自动刷新 token 逻辑 (OAuth2 client 内部处理，但我们需要拿到新的存入数据库)
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

        // 准备更新到数据库
        // 我们用批量操作更新 SiteKeyword
        // 因为 Keyword 可能会有很多，先删除老的同步出来的数据，或者进行 upsert
        // 简单处理：全量读取，然后 upsert

        let syncCount = 0;
        for (const row of rows) {
            const keyword = row.keys?.[0];
            if (!keyword) continue;

            const impressions = row.impressions || 0;
            const clicks = row.clicks || 0;
            const position = row.position ? Math.round(row.position) : null;

            // Prisma 不原生支持基于非唯一的普通字段组合的 upsert (需满足唯一约束)
            // 所以我们先用 findFirst，如果没有再 create
            const existingKwd = await prisma.siteKeyword.findFirst({
                where: { siteId, keyword }
            });

            if (existingKwd) {
                await prisma.siteKeyword.update({
                    where: { id: existingKwd.id },
                    data: {
                        impressions,
                        clicks,
                        position,
                        // volume 不动，由其他 API 处理
                    }
                });
            } else {
                await prisma.siteKeyword.create({
                    data: {
                        siteId,
                        keyword,
                        impressions,
                        clicks,
                        position,
                    }
                });
            }
            syncCount++;
        }

        // 更新最后同步时间
        await prisma.gscConnection.update({
            where: { id: gscConnection.id },
            data: { lastSyncAt: new Date() }
        });

        return NextResponse.json({ success: true, count: syncCount });
    } catch (error: any) {
        console.error("GSC Sync Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to sync GSC data' }, { status: 500 });
    }
}
