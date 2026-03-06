
import { BaseSkill } from '../base-skill';
import type { SkillInput, SkillOutput, SkillExecutionMetadata } from '../types';
import { getProvider } from '../providers';
import { IntelligenceEngine } from './stellar/IntelligenceEngine';
import { StrategyComposer } from './stellar/StrategyComposer';
import { ExecutionAgent } from './stellar/ExecutionAgent';
import { RefiningStudio } from './stellar/RefiningStudio';
import { StellarEnricher } from './stellar/StellarEnricher';
import { StellarAuditor } from './stellar/StellarAuditor';
import { StellarEditor } from './stellar/StellarEditor';
import { StellarWriterOutput, StellarWriterInput, IntelligenceContext } from './stellar/types';
import { StellarParser } from './stellar/utils/parser';

export class StellarWriterSkill extends BaseSkill {
    name = 'stellar-writer';
    description = 'Universal SEO & GEO Content Engine - Modular v3';
    version = '3.1.0';
    category: 'seo' = 'seo';

    protected preferredProvider: 'gemini' | 'claude' | 'deepseek' = 'deepseek';
    protected preferredModel = 'deepseek-chat';

    protected getRequiredInputs(): string[] {
        return ['keywords'];
    }

    protected async executeInternal(
        input: SkillInput
    ): Promise<{
        data: StellarWriterOutput;
        metadata: Partial<SkillExecutionMetadata>;
    }> {
        const stellarInput = input as unknown as StellarWriterInput;
        const keywords = stellarInput.keywords;
        const location = stellarInput.location || 'United States';
        const mode = stellarInput.researchMode || 'full';
        const startTime = Date.now();

        console.log(`🧞‍♂️ [Stellar-v3.1] Orchestrating [${mode}] for: ${keywords}`);

        try {
            // ═══════════════════════════════════════════════════════════
            // PHASE 1: DISCOVERY (Ultra Fast — topics only)
            // ═══════════════════════════════════════════════════════════
            if (mode === 'discovery') {
                const intelligence = await IntelligenceEngine.gather(keywords, location, 'discovery');
                return {
                    data: { topics: intelligence.topics, success: true } as any,
                    metadata: { executionTime: Date.now() - startTime }
                };
            }

            // ═══════════════════════════════════════════════════════════
            // PHASE 2: DEEP ANALYSIS (Strategy & Intelligence)
            // ═══════════════════════════════════════════════════════════
            if (mode === 'deep_analysis') {
                const intelligence = await IntelligenceEngine.gather(keywords, location, 'deep', stellarInput.url);
                const strategy = StrategyComposer.compose(intelligence, stellarInput);

                // Call LLM for outline only
                const provider = getProvider(this.preferredProvider);

                const competitorOutlines = intelligence.competitors
                    ?.slice(0, 3)
                    .map((c: any) => c.outline || c.headings || '')
                    .filter(Boolean)
                    .join('\n') || '';

                const outlinePrompt = `Generate a comprehensive article outline for: "${keywords}"

${competitorOutlines ? `COMPETITOR OUTLINES (for reference):\n${competitorOutlines}\n` : ''}
RELATED TOPICS TO WEAVE IN: ${intelligence.topics?.slice(0, 8).map((t: any) => t.keyword || t).join(', ') || 'none'}

REQUIREMENTS:
- Start with # (H1) as the main title
- Use ## for major sections (6-10 sections)
- Use ### for sub-sections where appropriate (2-3 per major section)
- Include an Introduction, main body sections, and a Key Takeaways section
- Make it comprehensive and SEO-optimized
- Include a comparison or FAQ section if appropriate

OUTPUT FORMAT: Return ONLY markdown headings, one per line. No descriptions, no body text. Example:
# Main Title
## Introduction
## Section One
### Sub-section 1.1
### Sub-section 1.2
## Section Two
## Key Takeaways`;

                const { response } = await this.generateWithAI(provider, outlinePrompt, {
                    model: this.preferredModel,
                    temperature: 0.7,
                    systemPrompt: strategy.systemPrompt
                });

                let masterOutline: any[] = [];
                const parsed = StellarParser.extractSafeJSON<any>(response.content);

                if (parsed?.masterOutline) {
                    masterOutline = parsed.masterOutline;
                } else {
                    // Parse markdown headers from the response
                    console.log("📋 [Stellar-v3] Parsing outline from markdown headers...");
                    const lines = response.content.split('\n');
                    lines.forEach(line => {
                        const trimmed = line.trim();
                        const match = trimmed.match(/^(#{1,4})\s+(.+)$/);
                        if (match) {
                            masterOutline.push({
                                text: match[2].replace(/\*\*/g, '').trim(),
                                level: match[1].length
                            });
                        }
                    });
                }

                if (intelligence.serpAnalysis?.peopleAlsoAsk && intelligence.serpAnalysis.peopleAlsoAsk.length > 0) {
                    console.log("📌 [Stellar-v3] Injecting PAA questions into Master Outline...");
                    const paaQuestions = intelligence.serpAnalysis.peopleAlsoAsk.slice(0, 3);

                    // Insert before Key Takeaways or at the end
                    const ktIndex = masterOutline.findIndex(item => item.text.toLowerCase().includes('takeaway') || item.text.toLowerCase().includes('conclusion'));
                    const insertIndex = ktIndex !== -1 ? ktIndex : masterOutline.length;

                    const fqTitle = /[\u4e00-\u9fa5]/.test(keywords) ? '常见问题解答 (FAQ)' : 'Frequently Asked Questions';
                    masterOutline.splice(insertIndex, 0, { text: fqTitle, level: 2 });

                    paaQuestions.forEach((paa: any, i: number) => {
                        masterOutline.splice(insertIndex + 1 + i, 0, { text: paa.question, level: 3 });
                    });
                }

                // If still empty, generate a basic default outline
                if (masterOutline.length === 0) {
                    console.warn("⚠️ [Stellar-v3] LLM returned no parseable outline, using keyword-based default");
                    masterOutline = [
                        { text: keywords, level: 1 },
                        { text: 'Introduction', level: 2 },
                        { text: `What is ${keywords}?`, level: 2 },
                        { text: 'Key Benefits', level: 2 },
                        { text: 'How It Works', level: 2 },
                        { text: 'Best Practices', level: 2 },
                        { text: 'Common Mistakes to Avoid', level: 2 },
                        { text: /[\u4e00-\u9fa5]/.test(keywords) ? '常见问题解答 (FAQ)' : 'Frequently Asked Questions', level: 2 },
                        { text: 'Key Takeaways', level: 2 }
                    ];
                }

                // Calculate real preliminary scores based on outline + intelligence quality
                const { calculateDetailedSEOScore, calculateGEOScore } = await import('@/lib/utils/seo-scoring');

                // Build a preliminary "ghost content" from outline to score structure
                const ghostContent = masterOutline.map(item => {
                    const prefix = '#'.repeat(item.level);
                    return `${prefix} ${item.text}`;
                }).join('\n\n');

                // Preliminary title from H1 or keyword
                const h1 = masterOutline.find(item => item.level === 1);
                const prelimTitle = h1?.text || keywords;
                const prelimDesc = `Comprehensive guide about ${keywords}`;

                const seoDetail = calculateDetailedSEOScore(prelimTitle, prelimDesc, ghostContent, keywords, []);
                const geoDetail = calculateGEOScore(ghostContent,
                    intelligence.entities?.map((e: any) => e.name || e) || [],
                    intelligence.topics?.map((t: any) => t.keyword || t) || []
                );

                // Use calculated scores (still preliminary since no real content yet)
                const seoScore = Math.max(seoDetail.overall, 50); // floor at 50 since article hasn't been written yet
                const geoScore = Math.max(geoDetail.score, 50);

                return {
                    data: {
                        topics: intelligence.topics,
                        entities: intelligence.entities,
                        competitors: intelligence.competitors,
                        serpAnalysis: intelligence.serpAnalysis,
                        masterOutline: masterOutline,
                        internalContent: intelligence.internalContent,
                        scores: { seo: seoScore, geo: geoScore, preliminary: true },
                        detailedSEOScore: seoDetail,
                        success: true
                    } as any,
                    metadata: { executionTime: Date.now() - startTime }
                };
            }

            // ═══════════════════════════════════════════════════════════
            // PHASE 3: SECTION REGENERATE (Single section rewrite)
            // ═══════════════════════════════════════════════════════════
            if (mode === 'section_regenerate') {
                const provider = getProvider(this.preferredProvider);
                const sectionPrompt = `You are an expert content editor.
Rewrite the following section with these instructions: "${stellarInput.sectionInstruction || 'Improve clarity and depth'}"

SECTION HEADING: ${stellarInput.sectionHeading || 'Section'}
CURRENT CONTENT:
${stellarInput.sectionContent || ''}

RULES:
- Keep the same heading level and topic
- Write in the same tone and style
- Target keyword: "${keywords}"
- Return ONLY the rewritten section body (no heading, no JSON wrapper)
- Be human, opinionated, and avoid AI clichés`;

                const { response } = await this.generateWithAI(provider, sectionPrompt, {
                    model: this.preferredModel,
                    temperature: 0.85,
                    systemPrompt: 'You are a human editor rewriting a specific section of an article.'
                });

                return {
                    data: {
                        content: response.content,
                        success: true
                    } as any,
                    metadata: { executionTime: Date.now() - startTime }
                };
            }

            // ═══════════════════════════════════════════════════════════
            // PHASE 4: FULL PRODUCTION (The Standard Flow)
            // ═══════════════════════════════════════════════════════════

            // Use cached intelligence if available and fresh (< 5 min)
            let intelligence: IntelligenceContext;
            if (stellarInput.cachedIntelligence &&
                stellarInput.cachedIntelligence.timestamp &&
                (Date.now() - stellarInput.cachedIntelligence.timestamp) < 5 * 60 * 1000) {
                console.log("♻️ [Stellar-v3] Using cached intelligence data");
                intelligence = stellarInput.cachedIntelligence;
            } else {
                intelligence = await IntelligenceEngine.gather(keywords, location, 'deep', stellarInput.url);
            }

            const strategy = StrategyComposer.compose(intelligence, stellarInput);
            const provider = getProvider(this.preferredProvider);

            // Re-generate outline if missing (since Full Production might skip Deep Analysis if user doesn't pass one)
            let finalOutline = stellarInput.masterOutline;
            if (!finalOutline || finalOutline.length === 0) {
                console.log("⚠️ [Stellar-v3] No Master Outline provided to FULL PRODUCTION. Generating a quick default based on Intelligence.");
                finalOutline = [
                    { text: keywords, level: 1 },
                    { text: 'Introduction', level: 2 },
                    { text: `Core Features of ${keywords}`, level: 2 }
                ];

                if (intelligence.serpAnalysis?.peopleAlsoAsk && intelligence.serpAnalysis.peopleAlsoAsk.length > 0) {
                    const fqTitle = /[\u4e00-\u9fa5]/.test(keywords) ? '常见问题解答 (FAQ)' : 'Frequently Asked Questions';
                    finalOutline!.push({ text: fqTitle, level: 2 });
                    intelligence.serpAnalysis.peopleAlsoAsk.slice(0, 2).forEach((paa: any) => {
                        finalOutline!.push({ text: paa.question, level: 3 });
                    });
                }
                finalOutline.push({ text: 'Key Takeaways', level: 2 });
            }

            const asset = await ExecutionAgent.generate(strategy, provider, this, finalOutline!);

            if (!asset) throw new Error("Execution Phase failed.");

            let currentContent = asset;
            let currentRefinedAsset = await RefiningStudio.refine(currentContent, keywords, provider, this);
            let enrichment: any;

            // MULTI-AGENT AUDITOR LOOP (Max 2 Iterations, 60s Timeout)
            const AUDITOR_TIMEOUT_MS = 60_000;
            const auditLoop = async () => {
                const MAX_ITERATIONS = 2;
                for (let i = 0; i < MAX_ITERATIONS; i++) {
                    console.log(`\n⏳ [StellarWriter] Multi-Agent Audit Loop - Iteration ${i + 1}/${MAX_ITERATIONS}`);

                    // 1. Enrich & Score the current draft
                    enrichment = await StellarEnricher.enrich(
                        currentRefinedAsset.content,
                        currentRefinedAsset.metadata.title || keywords,
                        currentRefinedAsset.metadata.description || '',
                        keywords,
                        intelligence.entities?.map((e: any) => e.title || e.name || e) || [],
                        intelligence.topics?.map((t: any) => t.keyword || t) || []
                    );

                    // 2. Analyst Agent checks the content
                    const auditReport = StellarAuditor.evaluate(
                        enrichment.content,
                        currentRefinedAsset.metadata.title || keywords,
                        currentRefinedAsset.metadata.description || '',
                        intelligence
                    );

                    if (!auditReport.needsRevision || i === MAX_ITERATIONS - 1) {
                        if (i === MAX_ITERATIONS - 1 && auditReport.needsRevision) {
                            console.log("⚠️ [StellarWriter] Max iterations reached. Proceeding with current best draft.");
                        } else {
                            console.log("✨ [StellarWriter] Auditor approved the content! Scores:", auditReport.scores);
                        }
                        break;
                    }

                    // 3. Editor Agent revises the content based on feedback
                    console.log(`🚨 [StellarWriter] Auditor found weaknesses: ${auditReport.weaknesses.length} issues. Triggering Editor...`);
                    const revisedContent = await StellarEditor.revise(enrichment.content, auditReport, intelligence);

                    // Update the asset for the next iteration
                    currentRefinedAsset.content = revisedContent;
                }
            };

            const timeoutPromise = new Promise<void>((_, reject) =>
                setTimeout(() => reject(new Error('Auditor loop timed out after 60s')), AUDITOR_TIMEOUT_MS)
            );

            try {
                await Promise.race([auditLoop(), timeoutPromise]);
            } catch (auditError: any) {
                console.warn(`⚠️ [StellarWriter] Auditor loop skipped: ${auditError.message}. Using last enriched draft.`);
                // Ensure enrichment is populated even if loop was skipped entirely
                if (!enrichment) {
                    enrichment = await StellarEnricher.enrich(
                        currentRefinedAsset.content,
                        currentRefinedAsset.metadata.title || keywords,
                        currentRefinedAsset.metadata.description || '',
                        keywords,
                        intelligence.entities?.map((e: any) => e.title || e.name || e) || [],
                        intelligence.topics?.map((t: any) => t.keyword || t) || []
                    );
                }
            }

            const finalOutput: StellarWriterOutput = {
                content: enrichment.content,
                summary: currentRefinedAsset.summary,
                seoMetadata: {
                    title: currentRefinedAsset.metadata.title || keywords,
                    description: currentRefinedAsset.metadata.description || '',
                    keywords: [keywords],
                    slug: currentRefinedAsset.metadata.slug || keywords.toLowerCase().replace(/\s+/g, '-')
                },
                schema: enrichment.schema || {},
                entities: intelligence.entities,
                topics: intelligence.topics,
                competitors: intelligence.competitors,
                internalLinks: enrichment.internalLinks || [],
                imageSuggestions: enrichment.imageSuggestions?.map((img: any) => img.description || img.alt || img.url || String(img)) || [],
                distribution: {
                    twitter: {
                        thread: [enrichment.social?.twitter || ''],
                        hashtags: [`#${keywords.replace(/\s+/g, '')}`, '#SEO', '#GEO']
                    },
                    linkedin: {
                        post: enrichment.social?.linkedin || '',
                        hashtags: [`#${keywords.replace(/\s+/g, '')}`, '#ContentMarketing']
                    }
                },
                scores: {
                    seo: enrichment.scores?.seo || currentRefinedAsset.scores.seo,
                    geo: enrichment.scores?.geo || currentRefinedAsset.scores.geo
                },
                humanScore: currentRefinedAsset.scores.human,
                suggestions: []
            };

            return {
                data: finalOutput,
                metadata: {
                    modelUsed: this.preferredModel,
                    provider: this.preferredProvider,
                    executionTime: Date.now() - startTime
                }
            };

        } catch (error: any) {
            console.error("❌ StellarWriter Orchestration Failure:", error);
            throw error;
        }
    }
}
