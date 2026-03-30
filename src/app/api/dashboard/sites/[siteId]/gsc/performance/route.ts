import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getGscClient } from '@/lib/gsc-client';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ siteId: string }> }
) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { siteId } = await params;

    try {
        const { searchconsole, existingAuth } = await getGscClient(siteId);

        if (!existingAuth.propertyId) {
            return NextResponse.json({ error: 'GSC Property not selected' }, { status: 400 });
        }

        // Calculate dates for the last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        // Format dates to YYYY-MM-DD
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // Fetch daily series
        const dailyResponse = await searchconsole.searchanalytics.query({
            siteUrl: existingAuth.propertyId,
            requestBody: {
                startDate: startStr,
                endDate: endStr,
                dimensions: ['date'],
                rowLimit: 30,
            }
        });

        // Fetch top queries
        const queriesResponse = await searchconsole.searchanalytics.query({
            siteUrl: existingAuth.propertyId,
            requestBody: {
                startDate: startStr,
                endDate: endStr,
                dimensions: ['query'],
                rowLimit: 10,
            }
        });

        let totalClicks = 0;
        let totalImpressions = 0;

        const dailyData = (dailyResponse.data.rows || []).map(row => {
            totalClicks += row.clicks || 0;
            totalImpressions += row.impressions || 0;
            return {
                date: row.keys ? row.keys[0] : '',
                clicks: row.clicks || 0,
                impressions: row.impressions || 0,
                ctr: row.ctr || 0,
                position: row.position || 0,
            };
        });

        const topQueries = (queriesResponse.data.rows || []).map(row => ({
            query: row.keys ? row.keys[0] : '',
            clicks: row.clicks || 0,
            impressions: row.impressions || 0,
            ctr: row.ctr || 0,
            position: row.position || 0,
        }));

        const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

        return NextResponse.json({
            success: true,
            summary: {
                clicks: totalClicks,
                impressions: totalImpressions,
                ctr: averageCtr,
            },
            daily: dailyData,
            topQueries
        });
    } catch (error: any) {
        const msg = error?.message || '';
        console.error("Failed to fetch GSC performance:", msg, error);

        if (msg === 'GSC_NOT_CONNECTED') {
            return NextResponse.json({ error: 'GSC 尚未绑定，请前往"设置"页完成连接' }, { status: 400 });
        }
        if (msg === 'GSC_TOKEN_EXPIRED') {
            return NextResponse.json({ error: 'GSC 授权已过期，请前往"设置"页重新连接' }, { status: 401 });
        }
        if (msg === 'GSC Property not selected') {
            return NextResponse.json({ error: 'GSC 资源未选择，请前往"设置"页选择 Search Console 资源' }, { status: 400 });
        }
        return NextResponse.json({ error: `GSC 数据获取失败：${msg || '未知错误'}` }, { status: 500 });
    }
}
