import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withSiteContext } from '@/lib/api-utils';
import { getDefaultProvider } from '@/lib/skills/providers';

export const GET = withSiteContext<{ siteId: string }>(async (request, { site }) => {
    try {
        // 1. 获取最新的审计结果以获取内容上下文
        const latestAudit = await prisma.siteAudit.findFirst({
            where: { siteId: site.id, status: 'done' },
            orderBy: { createdAt: 'desc' }
        });

        const auditData = latestAudit?.report as any;
        const pageTitles = auditData?.pages?.slice(0, 20).map((p: any) => p.title).filter(Boolean) || [];

        // 2. 准备 LLM Prompt
        const aiProvider = await getDefaultProvider();
        const defaultModel = aiProvider.getDefaultModel();

        const prompt = `
You are a world-class Market Intelligence AI.
Analyze the following website context and suggest 3-5 top industry competitors.

Context:
- Domain: ${site.domain}
- Name: ${site.name || 'Unknown'}
- Target Markets: ${site.targetMarkets?.join(', ') || 'N/A'}
- Seed Keywords: ${site.seedKeywords?.join(', ') || 'N/A'}
- Recent Page Titles: ${pageTitles.join(' | ')}

Based on this, identify 3-5 direct or indirect digital competitors (actual web domains).
For each competitor, provide:
1. domain (naked domain like "competitor.com")
2. reason (a brief, professional 1-sentence explanation of why they are a competitor)

Return ONLY a JSON array of objects:
[
  { "domain": "example.com", "reason": "Offers similar AI writing tools targeting enterprise teams." },
  ...
]
Do NOT include markdown formatting or extra text.
        `.trim();

        // 3. 调用 AI 生成建议
        const response = await aiProvider.generateContent(prompt, {
            model: defaultModel.id,
            temperature: 0.3,
        });

        if (!response.content) {
            throw new Error('AI failed to generate suggestions');
        }

        // 解析 JSON
        const match = response.content.match(/\[[\s\S]*\]/);
        const suggestions = match ? JSON.parse(match[0]) : [];

        // 4. 过滤掉已经存在的竞品
        const existingCompetitors = await prisma.competitor.findMany({
            where: { siteId: site.id },
            select: { domain: true }
        });
        const existingDomains = new Set(existingCompetitors.map(c => c.domain.toLowerCase()));

        const filteredSuggestions = suggestions.filter((s: any) => !existingDomains.has(s.domain.toLowerCase()));

        return NextResponse.json({
            success: true,
            suggestions: filteredSuggestions
        });

    } catch (error: any) {
        console.error('[Competitor Suggest GET] Error:', error);
        return NextResponse.json({ error: '获取竞品建议失败' }, { status: 500 });
    }
});
