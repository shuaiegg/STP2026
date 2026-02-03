/**
 * Automated Citation Verification Worker
 * 
 * Periodically checks if tracked articles are cited by AI search engines.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCitations() {
    console.log(`[${new Date().toISOString()}] Starting citation verification worker...`);

    try {
        // 1. Get articles to check (PENDING or last checked > 24h ago)
        const articles = await prisma.trackedArticle.findMany({
            where: {
                OR: [
                    { status: 'PENDING' },
                    { 
                        status: 'CHECKING',
                        lastCheckedAt: {
                            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h ago
                        }
                    }
                ],
                checkCount: { lt: 10 } // Max 10 attempts
            }
        });

        console.log(`Found ${articles.length} articles to verify.`);

        for (const article of articles) {
            console.log(`Checking citation for: ${article.title}...`);

            // --- SIMULATION LOGIC (Replace with real Perplexity/Search grounding API in production) ---
            // In a real scenario, we would use a tool like Brave Search or Google Search 
            // to find the article's URL or title in AI-generated snippets.
            
            const isCited = Math.random() > 0.85; // 15% chance of being cited in simulation
            
            if (isCited) {
                await prisma.trackedArticle.update({
                    where: { id: article.id },
                    data: {
                        status: 'CITED',
                        citationSource: 'Perplexity AI',
                        lastCheckedAt: new Date(),
                        checkCount: { increment: 1 }
                    }
                });
                console.log(`✅ Success: Article cited!`);
            } else {
                await prisma.trackedArticle.update({
                    where: { id: article.id },
                    data: {
                        status: article.checkCount >= 9 ? 'NOT_CITED' : 'CHECKING',
                        lastCheckedAt: new Date(),
                        checkCount: { increment: 1 }
                    }
                });
                console.log(`ℹ️ Not cited yet. (Attempt ${article.checkCount + 1}/10)`);
            }
        }

    } catch (error) {
        console.error('Verification worker error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the task
verifyCitations();
