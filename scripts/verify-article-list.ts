import prisma from "../src/lib/prisma";

async function verifyArticleList() {
    console.log("🔍 [QA] Starting Article List Fetch Verification...");

    try {
        // 1. Get user
        const user = await prisma.user.findFirst({
            where: { email: "jack47.chn@gmail.com" }
        });

        if (!user) throw new Error("Test user not found.");

        // 2. Create multiple articles for testing
        console.log("🚀 [Setup] Creating test articles...");
        const articles = await Promise.all([
            prisma.trackedArticle.create({
                data: {
                    userId: user.id,
                    title: "Test Article 1",
                    keywords: ["keyword1"],
                    optimizedContent: "Content 1",
                    status: "PENDING"
                }
            }),
            prisma.trackedArticle.create({
                data: {
                    userId: user.id,
                    title: "Test Article 2",
                    keywords: ["keyword2"],
                    optimizedContent: "Content 2",
                    status: "CITED"
                }
            })
        ]);

        // 3. Verify Fetch Logic (Simulating query in page)
        console.log("🔍 [Query] Fetching articles for user...");
        const fetched = await prisma.trackedArticle.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`✅ [List] Found ${fetched.length} articles.`);
        
        if (fetched.length < 2) {
            throw new Error("Failed to fetch all created articles.");
        }

        // 4. Cleanup
        await prisma.trackedArticle.deleteMany({
            where: { id: { in: articles.map(a => a.id) } }
        });
        console.log("🧹 [Cleanup] Test data removed.");

        console.log("\n✨ [QA] Article List Logic Verification PASSED.");
    } catch (error) {
        console.error("\n❌ [QA] Verification FAILED:");
        console.error(error);
        process.exit(1);
    }
}

verifyArticleList();
