/**
 * Cloud Cron Endpoint: Verify Article Citations
 * POST /api/cron/verify
 * 
 * This endpoint is designed to be called by a cloud cron service (e.g., Vercel Cron).
 * It runs independently of the AI agent.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { DataForSEOClient } from "@/lib/external/dataforseo";

// CRON_SECRET should be set in .env for production security
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
    // Security check: Ensure CRON_SECRET is configured
    if (!CRON_SECRET) {
        console.error('CRON_SECRET is not set in environment variables');
        return new NextResponse('Internal Server Error: Missing Configuration', { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    
    // Security check: Verify cron secret
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting Cloud-Native Citation Verification...');

    try {
        // 1. Fetch articles needing verification
        const articles = await prisma.trackedArticle.findMany({
            where: {
                url: { not: null }, // Only check if a URL is provided
                status: { in: ['PENDING', 'CHECKING'] },
                checkCount: { lt: 10 }
            },
            take: 5 // Process in small batches to avoid timeouts
        });

        const results = [];

        for (const article of articles) {
            if (!article.url || article.keywords.length === 0) continue;

            const primaryKeyword = article.keywords[0];
            
            // 2. Query DataForSEO for SERP data
            const serpResults = await DataForSEOClient.searchGoogleSERP(primaryKeyword);
            
            // 3. Look for the article URL in SERP
            const foundItem = serpResults.find((item: any) => 
                item.url && item.url.includes(article.url)
            );

            let newStatus = 'CHECKING';
            let citationSource = null;

            if (foundItem) {
                // If it's in top 100, we consider it indexed/ranked
                newStatus = 'CITED'; // Or implement more complex logic for badges
                citationSource = 'Google SERP';
            } else if (article.checkCount >= 9) {
                newStatus = 'NOT_CITED';
            }

            // 4. Update database
            await prisma.trackedArticle.update({
                where: { id: article.id },
                data: {
                    status: newStatus,
                    citationSource,
                    lastCheckedAt: new Date(),
                    checkCount: { increment: 1 }
                }
            });

            results.push({ id: article.id, status: newStatus });
        }

        return NextResponse.json({ 
            success: true, 
            processed: results.length,
            results 
        });

    } catch (error) {
        console.error('Cron job error:', error);
    }

    // 5. GSC Health Check & Self-Healing
    console.log('Starting GSC Health Check & Self-Healing...');
    try {
        const sitesWithGsc = await prisma.site.findMany({
            where: {
                gscConnections: { some: { propertyId: { not: null } } }
            },
            include: {
                gscConnections: true,
                semanticDebts: true
            }
        });

        for (const site of sitesWithGsc) {
            try {
                const { getGscClient } = await import('@/lib/gsc-client');
                const { searchconsole } = await getGscClient(site.id);
                const propId = site.gscConnections[0].propertyId!;

                // 2-week date ranges
                const now = new Date();
                const lastWeekEnd = new Date(now); lastWeekEnd.setDate(now.getDate() - 3); // GSC delay
                const lastWeekStart = new Date(lastWeekEnd); lastWeekStart.setDate(lastWeekEnd.getDate() - 7);
                const prevWeekEnd = new Date(lastWeekStart);
                const prevWeekStart = new Date(prevWeekEnd); prevWeekStart.setDate(prevWeekEnd.getDate() - 7);

                const formatDate = (d: Date) => d.toISOString().split('T')[0];

                const [lastWeekRes, prevWeekRes] = await Promise.all([
                    searchconsole.searchanalytics.query({
                        siteUrl: propId,
                        requestBody: { startDate: formatDate(lastWeekStart), endDate: formatDate(lastWeekEnd), dimensions: ['query'] }
                    }),
                    searchconsole.searchanalytics.query({
                        siteUrl: propId,
                        requestBody: { startDate: formatDate(prevWeekStart), endDate: formatDate(prevWeekEnd), dimensions: ['query'] }
                    })
                ]);

                const lastWeekQueries = lastWeekRes.data.rows || [];
                const prevWeekQueries = prevWeekRes.data.rows || [];

                // Compare impressions for keywords matching semantic debts
                for (const debt of site.semanticDebts) {
                    const debtTerms = [debt.topic, ...debt.subtopics].map(t => t.toLowerCase());
                    
                    const lastWeekImpressions = lastWeekQueries
                        .filter(r => r.keys?.[0] && debtTerms.some(term => r.keys![0].toLowerCase().includes(term)))
                        .reduce((sum, r) => sum + (r.impressions || 0), 0);

                    const prevWeekImpressions = prevWeekQueries
                        .filter(r => r.keys?.[0] && debtTerms.some(term => r.keys![0].toLowerCase().includes(term)))
                        .reduce((sum, r) => sum + (r.impressions || 0), 0);

                    if (prevWeekImpressions > 100 && lastWeekImpressions < prevWeekImpressions * 0.7) {
                        // Drop > 30%
                        console.log(`[Self-Healing] Topic "${debt.topic}" dropped > 30% in impressions for site ${site.domain}`);
                        
                        await prisma.$transaction([
                            prisma.semanticDebt.update({
                                where: { id: debt.id },
                                data: { priorityLabel: (debt.priorityLabel ? debt.priorityLabel + ' ' : '') + '⚠️ 流量下跌' }
                            }),
                            prisma.plannedArticle.updateMany({
                                where: { 
                                    contentPlan: { siteId: site.id }, 
                                    keyword: { contains: debt.topic },
                                    status: { not: 'COMPLETED' }
                                },
                                data: { status: 'REFACTORING_NEEDED' }
                            })
                        ]);
                    }
                }
            } catch (siteError) {
                console.error(`GSC check failed for site ${site.domain}:`, siteError);
            }
        }
    } catch (gscError) {
        console.error('Global GSC cron error:', gscError);
    }

    return NextResponse.json({ success: true });
}
