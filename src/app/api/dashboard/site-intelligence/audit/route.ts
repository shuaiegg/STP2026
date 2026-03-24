import { NextResponse } from 'next/server';
import { CrawlerService, CrawlerCircuitBreakerError } from '@/lib/skills/site-intelligence/crawler.service';
import { GraphGeneratorService } from '@/lib/skills/site-intelligence/graph-generator.service';
import { chargeUser, refundUser } from '@/lib/billing/credits';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { AuditProgressEvent } from '@/lib/skills/site-intelligence/types';
import { prisma } from '@/lib/prisma';
import { analyzeAudit } from '@/lib/skills/site-intelligence/audit-analyzer';

export async function POST(request: Request) {
    // 1. 鉴权
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const body = await request.json();
    const { domain: rawDomain } = body;

    if (!rawDomain) {
        return NextResponse.json({ error: '必须提供网站域名' }, { status: 400 });
    }

    const domain = CrawlerService.normalizeDomain(rawDomain);

    // 2. 计费检查
    const billingResult = await chargeUser(
        session.user.id,
        'SITE_AUDIT_BASIC',
        `Manual audit for ${domain}`
    );

    if (!billingResult.success) {
        return NextResponse.json({ error: billingResult.error }, { status: 402 });
    }

    // 3. SSE 流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: AuditProgressEvent) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            };

            try {
                console.log(`[SiteIntelligence] Stream audit for ${domain} by user ${session.user.id}`);

                const auditResult = await CrawlerService.performFullAuditWithProgress(
                    domain,
                    (progressEvent) => {
                        if (progressEvent.type === 'discovery') {
                            // 为全量骨架生成初始图数据
                            progressEvent.graphData = GraphGeneratorService.generateGraphData({
                                domain,
                                sitemapUrl: null,
                                sitemapFound: progressEvent.sitemapFound ?? false,
                                pageCount: progressEvent.urls.length,
                                pages: [],
                                averageLoadTime: 0
                            }, progressEvent.urls);
                        }
                        send(progressEvent);
                    }
                );

                // 4. 尝试获取已有的市场空白数据 (如果站点已保存)
                let marketGapsData: any[] | undefined = undefined;
                const siteRecord = await prisma.site.findFirst({
                    where: { domain: { contains: domain.replace(/^https?:\/\//, '') } },
                    include: { competitors: true }
                });

                if (siteRecord) {
                    try {
                        const { getSemanticGap } = await import('@/lib/site-intelligence/semantic-gap-service');
                        const gapResult = await getSemanticGap(siteRecord.id);
                        if (gapResult.semanticDebts) {
                            marketGapsData = gapResult.semanticDebts;
                        }
                    } catch (e: any) {
                        console.log("[SiteIntelligence] Semantic gap service call failed:", e.message);
                    }
                }

                const graphData = GraphGeneratorService.generateGraphData(auditResult, auditResult.allUrls, marketGapsData);

                // 5. 生成 SEO 体检报告与评分
                const issueReport = analyzeAudit(auditResult.pages, {
                    sitemapFound: auditResult.sitemapFound,
                    sitemapUrls: auditResult.allUrls // 使用 allUrls 作为 sitemap 的参考（sitemap 发现模式下 allUrls 即为 sitemap URLs）
                });
                const techScore = issueReport.techScore;

                send({
                    type: 'done',
                    scanned: auditResult.pages.length,
                    total: auditResult.pageCount,
                    sitemapFound: auditResult.sitemapFound,
                    graphData,
                    techScore,
                    issueReport,
                });
            } catch (error: any) {
                let refunded = false;
                if (error instanceof CrawlerCircuitBreakerError) {
                    console.warn('[SiteIntelligence] Circuit breaker tripped:', error.message);
                    // 自动退款：熔断器触发通常意味着站点无法访问，不应扣分
                    const refundResult = await refundUser(session.user.id, 'SITE_AUDIT_BASIC', '站点无法访问，已自动退还积分');
                    refunded = refundResult.success;
                } else {
                    console.error('[SiteIntelligence] Stream error:', error.message);
                }
                send({ type: 'error', error: error.message, refunded } as any);
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive',
            'X-Billing-Remaining': String(billingResult.success ? billingResult.remainingCredits : 0),
        },
    });
}
