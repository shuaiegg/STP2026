import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CrawlerService } from '@/lib/skills/site-intelligence/crawler.service';
import { withSiteContext } from '@/lib/api-utils';

import { getDefaultProvider } from '@/lib/skills/providers';

export const POST = withSiteContext<{ siteId: string; competitorId: string }>(async (
    request,
    { params, site }
) => {
    try {
        const { competitorId } = params;

        const competitor = await prisma.competitor.findUnique({
            where: { id: competitorId, siteId: site.id }
        });

        if (!competitor) {
            return NextResponse.json({ error: '找不到该竞品记录' }, { status: 404 });
        }

        // 1. Crawl the competitor home page and some internal links
        const normalizedDomain = CrawlerService.normalizeDomain(competitor.domain);
        const homePage = await CrawlerService.scrapePage(normalizedDomain);

        let allPages = [];
        if (homePage) {
            allPages.push(homePage);
            // Get up to 5 internal links to get better topic coverage
            const subLinks = homePage.internalLinks
                .filter(l => l.startsWith(normalizedDomain) && l !== normalizedDomain)
                .slice(0, 5);

            for (const link of subLinks) {
                try {
                    const p = await CrawlerService.scrapePage(link);
                    if (p) allPages.push(p);
                } catch (e) {
                    console.warn(`[Competitor Scan] Failed to scrape ${link}:`, e);
                }
            }
        }

        // 2. Extract topics using LLM
        let formattedTopics: string[] = [];
        if (allPages.length > 0) {
            const pagesContext = allPages.map(p => ({
                url: p.url,
                title: p.title,
                description: p.description,
                h1: p.h1
            }));

            try {
                const aiProvider = await getDefaultProvider();
                const defaultModel = aiProvider.getDefaultModel();

                const prompt = `
You are an expert SEO analyst. Analyze the following pages from a competitor's website: ${competitor.domain}.
Extract 5-10 core semantic topics/keywords that represent their primary focus.
For each topic, identify which of the provided URLs are the best examples/evidence of that topic.

Pages Context:
${JSON.stringify(pagesContext, null, 2)}

Return ONLY a JSON array of objects with "topic" (string) and "urls" (array of strings):
[
  { "topic": "AI Writing", "urls": ["https://example.com/features", "https://example.com/blog/ai"] },
  ...
]
Do NOT include markdown formatting or extra text.
                `.trim();

                const response = await aiProvider.generateContent(prompt, {
                    model: defaultModel.id,
                    temperature: 0.1,
                });

                if (response.content) {
                    const match = response.content.match(/\[[\s\S]*\]/);
                    if (match) {
                        const parsed = JSON.parse(match[0]);
                        // Format as "Topic|URL1,URL2" to store in the string[] array
                        formattedTopics = parsed.map((t: any) => {
                            const topicStr = typeof t.topic === 'string' ? t.topic : String(t);
                            const urlsStr = Array.isArray(t.urls) ? t.urls.join(',') : '';
                            return urlsStr ? `${topicStr}|${urlsStr}` : topicStr;
                        });
                    }
                }
            } catch (error) {
                console.error('[Competitors Scan] LLM extraction failed:', error);
                formattedTopics = [homePage?.title || competitor.domain];
            }
        } else {
            // Fallback if scrape fails
            formattedTopics = [competitor.domain.split('.')[0]];
        }

        // 3. Save topics to database
        const updatedCompetitor = await prisma.competitor.update({
            where: { id: competitorId },
            data: { topics: formattedTopics.slice(0, 10) }
        });

        return NextResponse.json({ success: true, competitor: updatedCompetitor });
    } catch (error: any) {
        console.error('[Competitors Scan] Error:', error);
        return NextResponse.json({ error: '扫描竞品失败' }, { status: 500 });
    }
});
