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
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
