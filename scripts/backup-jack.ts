import prisma from "../src/lib/prisma";

async function backupJack() {
    const email = "jack47.chn@gmail.com";
    console.log(`🔍 Backing up Jack: ${email}`);
    
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { trackedArticles: true, executions: true, transactions: true }
        });

        if (!user) throw new Error("User not found");

        console.log("JACK BACKUP:", JSON.stringify({
            credits: user.credits,
            role: user.role,
            articles: user.trackedArticles.length,
            transactions: user.transactions.length
        }, null, 2));
    } catch (error) {
        console.error("❌ Backup failed:", error);
    }
}

backupJack();
