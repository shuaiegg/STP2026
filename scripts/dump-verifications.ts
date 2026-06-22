import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Dumping Verification table...");
    const all = await prisma.verification.findMany({
        orderBy: {
            createdAt: 'desc',
        },
        take: 10,
    });
    console.log(JSON.stringify(all, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
