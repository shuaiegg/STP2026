
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

        const systemPrompt = `Role: Elite SEO Expert & GEO Strategist
Goal: Generate high-density, authoritative, human-like Markdown content.

<personalization>
${personalizationCtx}
</personalization>

<constraints>
  Tone: Objective, Analytical (NO promotional hyperbole)
  Banned_Words: ["worth noting", "delve", "furthermore", "moreover", "in conclusion", "revolutionary", "game-changer", "testament to", "elevate your", "unleash"]
  Mandatory_Elements: ["1+ Markdown Table", "> Expert Insight blockquote"]
  Structural_Rules: 
    - "No Intro Fluff: Start answering immediately under headings."
    - "Direct Answers: If heading is a question, sentence 1 is a bold 50-word direct answer."
    - "Human Rhythm: Dramatically vary sentence length (mix 5-word and 25-word sentences). Use contractions."
    - "Opener Variety: Consecutive sentences MUST NOT start with the same word."
</constraints>

<good_example_of_human_writing>
**Why SQM matters:** Bufferbloat is the silent killer of video calls. In my testing, I evaluated 50 routers, and enabling SQM consistently dropped latency by 40%. It works by prioritizing tiny ACK packets over massive downloads, keeping your voice stream crystal clear.
</good_example_of_human_writing>`;

        const competitorOutlines = competitors
            .map(c => `### Competitor: ${c.title}\n${c.headings.map((h: any) => `- ${h.text}`).join('\n')}`)
            .join('\n\n');

        const topicList = topics.map((t: any) => t.keyword || t).slice(0, 10).join(', ');

        const globalContext = `MAIN KEYWORD: ${keywords}
RELATED TOPICS: ${topicList}
${entityCtx.trim()}
${internalCtx.trim()}
${serpPrompt.trim()}
${gapInsight.trim()}`;

        const buildFullArticlePrompt = (outline: any[]) => {
            const outlineContext = outline.map((o: any) => `${'#'.repeat(o.level)} ${o.text}`).join('\n');

            return `<context>
${globalContext}
</context>

<outline>
${outlineContext}
</outline>

<task>
Write the ENTIRE article following the outline. 
Output ONLY raw Markdown. Do NOT include JSON or wrapper text.
Target: 1500-2500 words, 2-3 paragraphs per H2 heading.
Enrich content with real data, examples, and the provided Context.
CRITICAL FOR FAQs: If the outline contains a "Frequently Asked Questions" or "常见问题解答 (FAQ)" section, you MUST write detailed, 2-3 sentence answers for EVERY question listed under it. NEVER just list the questions without answers.
</task>`;
        };

        return {
            systemPrompt,
            buildFullArticlePrompt,
            model: 'deepseek-chat',
            temperature: 0.85
        };
    }
}
