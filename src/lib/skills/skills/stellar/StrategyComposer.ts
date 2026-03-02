
import { IntelligenceContext, PromptStrategy } from './types';
import { buildSERPEnhancedPrompt } from '@/lib/utils/prompt-enhancer';
import { ContentGapAnalyzer } from '@/lib/utils/content-gap-analyzer';

export class StrategyComposer {
    /**
     * Composes a specialized prompt based on intelligence data with ABSOLUTE STRUCTURE.
     * V4: Now integrates SERP analysis, entity binding, content gap analysis, and GEO directives.
     */
    static compose(ctx: IntelligenceContext, options: any = {}): PromptStrategy {
        const { keywords, competitors, topics, serpAnalysis, entities, internalContent } = ctx;

        // Build entity context from Google Maps data
        const entityCtx = entities && entities.length > 0
            ? `\n## Real-World Entities (for authority & E-E-A-T)\n${entities.map((e: any) => `- ${e.title || e.name}: ${e.address || 'N/A'}. Rating: ${e.rating || 'N/A'}.`).join('\n')}\n`
            : '';

        // Build SERP-enhanced prompt section
        const serpPrompt = serpAnalysis ? buildSERPEnhancedPrompt({
            serpAnalysis,
            relatedKeywords: topics,
            targetKeyword: keywords,
            competitors
        }) : '';

        // Content Gap Analysis
        let gapInsight = '';
        if (competitors.length > 0 && topics.length > 0 && options.masterOutline) {
            try {
                const gaps = ContentGapAnalyzer.analyze(keywords, options.masterOutline, competitors, topics);
                if (gaps.missingKeywords.length > 0 || gaps.competitorTopics.length > 0) {
                    gapInsight = `\n## 📊 Content Gap Analysis (Score: ${gaps.score}/100)\n`;
                    if (gaps.missingKeywords.length > 0) {
                        gapInsight += `\n### Missing High-Volume Keywords:\n${gaps.missingKeywords.map(k => `- "${k.term}" (Volume: ${k.volume})`).join('\n')}\n`;
                    }
                    if (gaps.competitorTopics.length > 0) {
                        gapInsight += `\n### Topics Covered by Competitors (Missing from Your Outline):\n${gaps.competitorTopics.map(t => `- "${t.term}" (found in ${t.frequency} competitors)`).join('\n')}\n`;
                    }
                    gapInsight += `\n**Action**: Weave these missing topics and keywords naturally into your article.\n`;
                }
            } catch (e) {
                console.warn('[StrategyComposer] Gap analysis failed:', e);
            }
        }

        // Internal content for linking suggestions
        const internalCtx = internalContent && internalContent.length > 0
            ? `\n## Internal Content Inventory (for internal linking)\n${internalContent.slice(0, 5).map((item: any) => `- [${item.title || 'Page'}](${item.url})`).join('\n')}\n`
            : '';

        // Extract personalization from the form input
        const brandName = options.brandName || '';
        const tone = options.tone || 'professional';
        const contentType = options.type || 'blog';

        const personalizationCtx = [
            brandName ? `BRAND / COMPANY: ${brandName} (weave this naturally into the article as the author's brand)` : '',
            `CONTENT TONE: ${tone === 'casual' ? 'Conversational and approachable. Use contractions, speak directly to the reader as "you", keep sentences short and punchy.' : tone === 'educational' ? 'Educational and authoritative. Use clear explanations, analogies, and step-by-step breakdowns.' : 'Professional and expert. Use industry terminology, cite data, write with authority.'}`,
            `CONTENT TYPE: ${contentType === 'landing_page' ? 'Conversion-focused landing page. Include CTAs, benefits-first structure, and social proof.' : contentType === 'guide' ? 'Comprehensive how-to guide. Use numbered steps, heavy use of H3 sub-sections, and practical examples.' : 'Long-form SEO blog post. Balance authority with readability.'}`,
        ].filter(Boolean).join('\n');

        const systemPrompt = `You are an elite SEO expert, GEO strategist, and content architect writing for a specific brand.
Your writing must be human, authoritative, and perfectly structured for both search engines AND AI answer engines (Perplexity, ChatGPT, etc.).

${personalizationCtx}

STRICT WRITING PROTOCOL (FOR EVERY SECTION):
1. **NO INTRODUCTORY FLUFF**: Start answering immediately. Zero background setup. Zero transitional phrases (e.g., "In this section, we will discuss", "As mentioned above", "In conclusion").
2. **HIGH INFORMATION DENSITY**: Every sentence must contain a hard fact, expert insight, specific example, or data point. If a sentence doesn't add a new fact, delete it.
3. **DIRECT ANSWERS (GEO)**: If the section heading is a question, the FIRST sentence MUST be a bolded, direct answer (40-60 words max).
4. **NATURAL READABILITY**: Balance your use of paragraphs and lists. Do NOT use bullet points for everything. Write flowing, cohesive paragraphs (3-4 sentences each) that build logical arguments.
5. **FORMATTING DENSITY**: Use bolding sparingly for core concepts, but avoid overwhelming the user with overly fragmented lists or tables unless strictly necessary for data comparison.
6. **E-E-A-T SIGNALS**: Show deep expertise and use authoritative phrasing. Include a > blockquote to highlight an "Expert Insight" if highly relevant.`;

        const competitorOutlines = competitors
            .map(c => `### Competitor: ${c.title}\n${c.headings.map((h: any) => `- ${h.text}`).join('\n')}`)
            .join('\n\n');

        const topicList = topics.map((t: any) => t.keyword || t).slice(0, 10).join(', ');

        const globalContext = `
MAIN KEYWORD: ${keywords}
RELATED TOPICS (Weave naturally where relevant): ${topicList}
${entityCtx}
${internalCtx}
${serpPrompt}
${gapInsight}
`;

        const buildFullArticlePrompt = (outline: any[]) => {
            const outlineContext = outline.map((o: any) => `${'#'.repeat(o.level)} ${o.text}`).join('\n');

            return `
GLOBAL CONTEXT (Do not output this, just use for knowledge):
${globalContext}

FULL ARTICLE OUTLINE:
${outlineContext}

TASK: 
Write the ENTIRE article following this outline. Your response must be pure Markdown.

CRITICAL MARKDOWN FORMATTING RULES:
1. Use EXACTLY the heading levels shown in the outline above. H1 (# Title), H2 (## Section), H3 (### Sub-section).
2. NEVER use **bold text** or any other substitute for headings.
3. Start your response directly with the H1 heading: "# Title Here".
4. Each H2/H3 heading MUST appear on its own line, preceded by a blank line.
5. Write 150-300 words of body content under each H2 section.

📝 CONTENT REQUIREMENTS (CRITICAL):
- Minimum 1500-2500 words (8000+ Chinese characters) overall.
- 2-3 full paragraphs under EVERY heading.
- Include specific examples, data, case studies.
- Answer What? Why? How? in each section.
- Ensure E-E-A-T: use specific facts, data points, and expert insights.

🎯 HUMAN WRITING CHARACTERISTICS (MANDATORY):
- Write naturally like a human expert, NOT as an AI.
- Use contractions (I'm, you'll, can't, won't, it's).
- Vary sentence length dramatically (mix 5-word and 25-word sentences).
- Be conversational and direct, showing personality and opinions.
- Flowing, natural paragraphs. Do NOT use bullet lists for everything (only for 3+ discrete items).

❌ ABSOLUTELY FORBIDDEN AI PHRASES (Instant failure if used):
- "It's worth noting that" / "It is important to note"
- "Delve into" / "Dive deep into"
- "In conclusion" / "To sum up"
- "Furthermore" / "Moreover" / "Nevertheless"
- "At the end of the day"
- "However, it is important to remember"
- "A testament to"
- "The ever-evolving landscape" / "Dynamic landscape"
- "Unleash the power"
- "Elevate your"
- "Game-changer"
- "Navigating the realm"
- "In today's digital world"

✅ USE INSTEAD:
- Simple transitions: "Also", "Plus", "And", "But", "So"
- Direct statements
- Natural flow without formal connectors
- DO NOT include any JSON. Return ONLY raw Markdown.
`;
        };

        return {
            systemPrompt,
            buildFullArticlePrompt,
            model: 'deepseek-chat',
            temperature: 0.85
        };
    }
}
