import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // 1. SITE_AUDIT_BASIC
    const auditSkill = await prisma.skillConfig.upsert({
        where: { name: 'SITE_AUDIT_BASIC' },
        update: { cost: 5, isActive: true },
        create: {
            name: 'SITE_AUDIT_BASIC',
            displayName: '站点全景审计 (3D)',
            description: '生成 3D 主题权威图及技术 SEO 审计报告。',
            cost: 5,
            isActive: true
        }
    });
    console.log("✅ SITE_AUDIT_BASIC updated:", auditSkill.cost);

    // 2. GEO_WRITER_FULL
    const writerSkill = await prisma.skillConfig.upsert({
        where: { name: 'GEO_WRITER_FULL' },
        update: { cost: 15, isActive: true },
        create: {
            name: 'GEO_WRITER_FULL',
            displayName: 'StellarWriter 文章优化',
            description: 'AI 驱动的文章写作与 GEO 优化信息增益补全。',
            cost: 15,
            isActive: true
        }
    });
    console.log("✅ GEO_WRITER_FULL updated:", writerSkill.cost);

    // 3. COMPETITOR_ANALYSIS
    const competitorSkill = await prisma.skillConfig.upsert({
        where: { name: 'COMPETITOR_ANALYSIS' },
        update: { cost: 8, isActive: true },
        create: {
            name: 'COMPETITOR_ANALYSIS',
            displayName: '竞争对手深度分析',
            description: '深度分析竞争对手关键词、流量策略及内容空白。',
            cost: 8,
            isActive: true
        }
    });
    console.log("✅ COMPETITOR_ANALYSIS updated:", competitorSkill.cost);
}

main().catch(console.error).finally(() => prisma.$disconnect());
