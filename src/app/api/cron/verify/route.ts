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
const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_only';

export async function GET(request: NextRequest) {
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
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}
