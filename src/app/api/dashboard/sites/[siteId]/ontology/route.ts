import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { withSiteContext } from '@/lib/api-utils';
import { CrawlerService } from '@/lib/skills/site-intelligence/crawler.service';
import { getSemanticGap } from '@/lib/site-intelligence/semantic-gap-service';
import { coachHomeTag } from '@/lib/coach/home';

export const GET = withSiteContext<{ siteId: string }>(async (_request, { site }) => {
    const ontology = await prisma.siteOntology.findFirst({
        where: { siteId: site.id },
        orderBy: { version: 'desc' },
    });
    return NextResponse.json({ success: true, ontology });
});

export const POST = withSiteContext<{ siteId: string }>(async (_request, { site: baseSite }) => {
    try {
        const site = await prisma.site.findUnique({
            where: { id: baseSite.id },
            select: { id: true, domain: true }
        });

        if (!site) {
            return NextResponse.json({ error: '站点不存在或无权访问' }, { status: 404 });
        }

        // Use unified extractor — fetches homepage + business pages fresh (no audit required)
        const homeUrl = site.domain.startsWith('http') ? site.domain : `https://${site.domain}`;
        const dna = await CrawlerService.extractBusinessDna(homeUrl);

        if (!dna) {
            return NextResponse.json({
                error: '站点内容不足，无法提取业务基因。请在业务基因卡片中手动填写您的业务描述。'
            }, { status: 400 });
        }

        const lastOntology = await prisma.siteOntology.findFirst({
            where: { siteId: site.id },
            orderBy: { version: 'desc' }
        });

        const nextVersion = (lastOntology?.version || 0) + 1;

        const newOntology = await prisma.siteOntology.create({
            data: {
                siteId: site.id,
                version: nextVersion,
                coreOfferings: dna.coreOfferings || [],
                targetAudience: dna.targetAudience || [],
                painPointsSolved: dna.painPoints || [],
                logicChains: (dna.logicChains || []) as any,
                idealTopicMap: (dna.idealTopicMap || []) as any,
                positioning: dna.positioning || [],
                brandTone: dna.brandTone || null,
                sourceLocale: dna.sourceLocale || null,
                pagesRead: dna.pagesRead || [],
            }
        });

        // 重算语义缺口（用 DNA 的规范语言，与 idealTopicMap 同语言 → 蓝图 join 命中、
        // strategy/generate 有缺口可用）。await 确保返回时 debts 已就绪；失败不阻断（DNA 已存）。
        try {
            await getSemanticGap(site.id, true, newOntology.sourceLocale || undefined);
        } catch (e) {
            console.error('[Ontology POST] semantic gap refresh failed:', e);
        }
        revalidateTag(coachHomeTag(site.id), 'max');

        return NextResponse.json({
            success: true,
            data: {
                ...dna,
                ontologyId: newOntology.id,
                version: newOntology.version
            }
        });

    } catch (error: any) {
        console.error('[Ontology POST] Error:', error);
        return NextResponse.json({ error: '提取业务 DNA 失败: ' + error.message }, { status: 500 });
    }
});
