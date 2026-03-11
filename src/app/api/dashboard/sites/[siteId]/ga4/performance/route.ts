import { NextResponse } from 'next/server';
import { getGa4Client } from '@/lib/ga4-client';
import { withSiteContext } from '@/lib/api-utils';

export const GET = withSiteContext<{ siteId: string }>(async (request, { site }) => {
    try {
        const { analyticsdata, existingAuth } = await getGa4Client(site.id);

        if (!existingAuth.propertyId) {
            return NextResponse.json({ error: '请先选择要关联的 GA4 数据流 (Property)' }, { status: 400 });
        }

        // Calculate dates for the last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // Format for data API is properties/1234567
        let propertyId = existingAuth.propertyId;
        if (!propertyId.startsWith('properties/')) {
            propertyId = `properties/${propertyId}`;
        }

        console.log(`[GA4 Performance] Fetching data for ${propertyId} from ${startStr} to ${endStr}`);

        const response = await analyticsdata.properties.runReport({
            property: propertyId,
            requestBody: {
                dateRanges: [{ startDate: startStr, endDate: endStr }],
                metrics: [
                    { name: 'activeUsers' },
                    { name: 'sessions' },
                    { name: 'engagementRate' },
                    { name: 'averageSessionDuration' }
                ],
                dimensions: [{ name: 'date' }]
            }
        });

        // Parse and format the rows for the frontend chart
        const rows = response.data.rows || [];
        const chartData = rows.map(row => {
            const dateStr = row.dimensionValues?.[0]?.value || ''; // Format: YYYYMMDD
            const formattedDate = dateStr.length === 8
                ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
                : dateStr;

            return {
                date: formattedDate,
                activeUsers: parseInt(row.metricValues?.[0]?.value || '0', 10),
                sessions: parseInt(row.metricValues?.[1]?.value || '0', 10),
                engagementRate: parseFloat(row.metricValues?.[2]?.value || '0'),
                averageSessionDuration: parseFloat(row.metricValues?.[3]?.value || '0'),
            };
        });

        // Sort by date ascending
        chartData.sort((a, b) => a.date.localeCompare(b.date));

        // Calculate totals
        const totals = {
            activeUsers: chartData.reduce((sum, day) => sum + day.activeUsers, 0),
            sessions: chartData.reduce((sum, day) => sum + day.sessions, 0),
        };

        // Averages for rates
        const avgEngagementRate = chartData.length > 0
            ? chartData.reduce((sum, day) => sum + day.engagementRate, 0) / chartData.length
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                chartData,
                totals: {
                    ...totals,
                    engagementRate: avgEngagementRate
                }
            }
        });

    } catch (error: any) {
        console.error('[GA4 Performance GET] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch GA4 performance data' }, { status: 500 });
    }
});
