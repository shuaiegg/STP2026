import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const skill = await prisma.skillConfig.upsert({
        where: { name: 'SITE_AUDIT_BASIC' },
        update: {},
        create: {
            name: 'SITE_AUDIT_BASIC',
            displayName: 'Site Intelligence (3D Map)',
            description: 'Generate 3D Topical Authority map and technical audit.',
            cost: 0,
            isActive: true
        }
    });
    console.log("✅ Skill registered:", skill);
}

main().catch(console.error).finally(() => prisma.$disconnect());
