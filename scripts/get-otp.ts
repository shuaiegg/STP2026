import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const latest = await prisma.verification.findFirst({
        where: {
            OR: [
                { identifier: 'jack47.chn@gmail.com' },
                { identifier: 'sign-in-otp-jack47.chn@gmail.com' }
            ]
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    if (latest) {
        const code = latest.value.split(':')[0];
        console.log(`FOUND_OTP: ${code}`);
    } else {
        console.log("NO_OTP_FOUND");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
