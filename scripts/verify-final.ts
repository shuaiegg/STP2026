import prisma from "../src/lib/prisma";

async function verifySavedArticle() {
    console.log("🔍 [Final Check] Verifying if article was saved via UI...");
    try {
        const user = await prisma.user.findFirst({
            where: { email: "jack47.chn@gmail.com" }
        });

        if (!user) throw new Error("User not found");

        const lastArticle = await prisma.trackedArticle.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        if (lastArticle) {
            console.log(`✅ Found article: ${lastArticle.title} (Created: ${lastArticle.createdAt})`);
        } else {
            console.log("ℹ️ No articles found in library yet.");
        }
    } catch (error) {
        console.error("❌ Verification failed:", error);
    }
}

verifySavedArticle();
