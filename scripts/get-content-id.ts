import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const content = await prisma.content.findFirst({
        orderBy: {
            updatedAt: 'desc',
        },
    });

    if (content) {
        console.log(`FOUND_CONTENT_ID: ${content.id}`);
    } else {
        console.log("NO_CONTENT_FOUND");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
