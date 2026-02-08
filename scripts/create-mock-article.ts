import prisma from "../src/lib/prisma";

async function mockArticleForJack() {
    const email = "jack47.chn@gmail.com";
    console.log(`🚀 [Admin] Manually creating a mock article for: ${email}`);
    
    try {
        const user = await prisma.user.findFirst({
            where: { email }
        });

        if (!user) throw new Error("User not found");

        const article = await prisma.trackedArticle.create({
            data: {
                userId: user.id,
                title: "STP 2026: The Future of SEO & GEO",
                summary: "An exploration into Generative Engine Optimization.",
                keywords: ["SEO", "GEO", "STP"],
                optimizedContent: "# The Future of SEO\nThis content was manually injected for UI preview.",
                status: "CITED",
                createdAt: new Date()
            }
        });
        
        console.log(`✅ Success! Article created with ID: ${article.id}`);
    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

mockArticleForJack();
