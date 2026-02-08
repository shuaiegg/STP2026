import prisma from "../src/lib/prisma";

async function peekOtp() {
    console.log("🔍 Checking latest Verification records...");
    const verifications = await prisma.verification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    
    verifications.forEach(v => {
        console.log(`- ID: ${v.id}, Identifier: ${v.identifier}, Value: ${v.value}, Expires: ${v.expiresAt}`);
    });
}

peekOtp();
