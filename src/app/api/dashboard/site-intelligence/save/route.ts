import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { domain, graphData, techScore, businessDna } = body;

        if (!domain || !graphData) {
            return NextResponse.json({ error: '缺失必要字段 (域名或图表数据)' }, { status: 400 });
        }

        let site = await prisma.site.findFirst({
            where: { userId: session.user.id, domain },
        });

        if (!site) {
            site = await prisma.site.create({
                data: {
                    userId: session.user.id,
                    domain,
                    name: domain,
                    businessOntology: businessDna ? businessDna : undefined
                },
            });
        } else if (businessDna) {
            // Update existing site with new DNA
            site = await prisma.site.update({
                where: { id: site.id },
                data: { businessOntology: businessDna }
            });
        }

        const audit = await prisma.siteAudit.create({
            data: {
                siteId: site.id,
                status: 'done',
                techScore: techScore ?? null,
                report: graphData as any,
            },
        });

        return NextResponse.json({
            success: true,
            siteId: site.id,
            auditId: audit.id
        });

    } catch (error: any) {
        console.error('[SiteIntelligence Save] Error:', error);
        return NextResponse.json({ error: error.message || '保存审计记录时发生错误' }, { status: 500 });
    }
}
