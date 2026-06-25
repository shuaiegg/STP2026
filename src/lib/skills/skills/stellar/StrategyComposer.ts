
import { IntelligenceContext, PromptStrategy } from './types';
import { BusinessDNA } from './business-dna';
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

        // Build business DNA section — locale-aware, only when DNA is present
        const businessDna: BusinessDNA | null = options.businessDna ?? null;
        const isZh = /[一-龥]/.test(keywords);
        const businessDnaCtx = businessDna ? buildBusinessDnaSection(businessDna, isZh) : '';

        const systemPrompt = `Role: Elite SEO Expert & GEO Strategist
Goal: Generate high-density, authoritative, human-like Markdown content.

<personalization>
${personalizationCtx}
</personalization>${businessDnaCtx}

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

        // 分段生成（ExecutionAgent 逐段调用）：每次只写一个 section 的正文，带全局上下文与上文衔接
        const buildSectionPrompt = (sectionTitle: string, previousContent: string, isFirst: boolean, isLast: boolean) => {
            const continuity = previousContent
                ? `\n<previous_content>\n${previousContent.slice(-1800)}\n</previous_content>\nContinue naturally from the above. Do NOT repeat content already written.`
                : '';
            const role = isFirst
                ? 'This is the FIRST section — open with a compelling hook, no generic filler.'
                : isLast
                    ? 'This is the FINAL section — provide a strong, actionable close.'
                    : 'This is a body section.';
            return `<context>
${globalContext}
</context>
${continuity}

<task>
Write ONLY the body for the section titled "${sectionTitle}" of an article about "${keywords}".
${role}
- Do NOT output the heading itself, only the section body.
- 2-3 well-developed paragraphs, enriched with real data, examples, and the provided Context.
- If this section is a "Frequently Asked Questions" / "常见问题解答 (FAQ)" section, write detailed 2-3 sentence answers for EVERY question.
- Output raw Markdown only. No JSON, no wrapper text, no code fences.
</task>`;
        };

        return {
            systemPrompt,
            buildFullArticlePrompt,
            buildSectionPrompt,
            model: 'deepseek-chat',
            temperature: 0.85
        };
    }
}

function buildBusinessDnaSection(dna: BusinessDNA, isZh: boolean): string {
    const parts: string[] = [];

    if (isZh) {
        if (dna.coreOfferings.length > 0) parts.push(`  核心服务/产品：${dna.coreOfferings.join(' / ')}`);
        if (dna.targetAudience.length > 0) parts.push(`  目标受众：${dna.targetAudience.join(' / ')}`);
        if (dna.painPointsSolved.length > 0) parts.push(`  解决的核心痛点：${dna.painPointsSolved.join(' / ')}`);

        if (parts.length === 0) return '';
        return `

<business_dna>
  以下是本文所属企业的业务基因。请据此写作（而非泛泛而谈）：
  · 以「目标受众」为明确读者对象，开篇可直击其核心痛点；
  · 用「核心服务/产品」所在领域的专业深度来组织论点、举例与数据；
  · 保持客观分析，绝不变成对该企业的推销、自我宣传或点名吹捧。
${parts.join('\n')}
</business_dna>`;
    } else {
        if (dna.coreOfferings.length > 0) parts.push(`  Core offerings: ${dna.coreOfferings.join(' / ')}`);
        if (dna.targetAudience.length > 0) parts.push(`  Target audience: ${dna.targetAudience.join(' / ')}`);
        if (dna.painPointsSolved.length > 0) parts.push(`  Pain points addressed: ${dna.painPointsSolved.join(' / ')}`);

        if (parts.length === 0) return '';
        return `

<business_dna>
  Below is the business DNA of the company this article is for. Write accordingly (not generically):
  · Address the target audience explicitly as your reader; you may open by hitting their core pain points.
  · Bring the domain depth implied by the core offerings to your arguments, examples, and data.
  · Stay objective and analytical — never turn this into promotion, self-praise, or name-dropping the business.
${parts.join('\n')}
</business_dna>`;
    }
}
