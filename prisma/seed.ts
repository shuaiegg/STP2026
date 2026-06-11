import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL

    if (!adminEmail) {
        console.warn('⚠️ INITIAL_ADMIN_EMAIL not set in .env, skipping admin creation.')
        return
    }

    console.log(`🌱 Seeding database...`)

    const admin = await prisma.user.upsert({
        where: { email: adminEmail.toLowerCase() },
        update: {
            role: 'ADMIN',
            emailVerified: true,
        },
        create: {
            email: adminEmail.toLowerCase(),
            name: 'Super Admin',
            role: 'ADMIN',
            emailVerified: true,
            credits: 9999,
        },
    })

    console.log(`✅ Admin user ${admin.email} is ready.`)

    // Skill configs — upsert so re-running seed is safe
    const skillConfigs = [
        { name: 'SITE_AUDIT_BASIC',  displayName: '站点 SEO 体检',     cost: 5,  description: '全站技术 SEO 扫描与可视化星图审计', isActive: true },
        { name: 'GEO_WRITER_FULL',   displayName: 'StellarWriter 智作',  cost: 15, description: 'AI 驱动的深度内容生成与 SEO 优化', isActive: true },
        { name: 'GEO_WRITER_AUDIT',  displayName: 'StellarWriter 审计',  cost: 5,  description: 'SERP 分析 + 关键词研究审计报告',   isActive: true },
    ]

    for (const skill of skillConfigs) {
        await prisma.skillConfig.upsert({
            where: { name: skill.name },
            update: { cost: skill.cost, isActive: skill.isActive, displayName: skill.displayName },
            create: skill,
        })
    }

    console.log(`✅ SkillConfig (${skillConfigs.length} skills) seeded.`)
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
