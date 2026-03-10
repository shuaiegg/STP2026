import { NextResponse } from 'next/server';
import { CrawlerService } from '@/lib/skills/site-intelligence/crawler.service';
import { GraphGeneratorService } from '@/lib/skills/site-intelligence/graph-generator.service';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || 'https://scaletotop.com';

    try {
        console.log(`[TestAPI] Triggering audit for ${domain}...`);
        const auditResult = await CrawlerService.performFullAudit(domain);
        const graphData = GraphGeneratorService.generateGraphData(auditResult);

        return NextResponse.json({
            success: true,
            domain,
            summary: {
                pageCount: auditResult.pageCount,
                scrapedCount: auditResult.pages.length,
                avgLoadTime: auditResult.averageLoadTime
            },
            graphData
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
