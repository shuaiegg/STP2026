/**
 * StellarWriter Unified Skill v2.3
 * 
 * The powerhouse of STP content generation.
 * Combines Technical SEO, GEO (Generative Engine Optimization), 
 * and Competitor Reverse Engineering.
 */

import { BaseSkill } from '../base-skill';
import type { SkillInput, SkillOutput, SkillExecutionMetadata } from '../types';
import { getProvider } from '../providers';
import { DataForSEOClient, MapDataItem } from '../../external/dataforseo';
import { SkeletonExtractor, ContentSkeleton } from '../../external/skeleton-extractor';
import { SERPAnalyzer, type SERPAnalysis, analyzeSERP } from '../../external/serp-analyzer';
import { calculateDetailedSEOScore, type DetailedSEOScore } from '@/lib/utils/seo-scoring';
import { humanizeContent } from '@/lib/utils/humanize';
import { detectAIPatterns, calculateHumanScore } from '@/lib/utils/ai-detection';
import { buildSERPEnhancedPrompt } from '@/lib/utils/prompt-enhancer';
import { ContentGapAnalyzer } from '@/lib/utils/content-gap-analyzer';

/**
 * Input for StellarWriter
 * We omit 'keywords' from SkillInput since we use a string instead of string[]
 */
export interface StellarWriterInput extends Omit<SkillInput, 'keywords'> {
    /** Target keywords or topic */
    keywords: string;
    /** Target geographic location (optional) */
    location?: string;
    /** Brand name for entity binding */
    brandName?: string;
    /** Context: B2B, SaaS, Finance, etc. */
    industry?: 'B2B' | 'SaaS' | 'General';
    /** Content tone */
    tone?: 'professional' | 'casual' | 'educational';
    /** Content type */
    type?: 'blog' | 'landing_page' | 'guide';
    /** Original content if optimizing existing work */
    originalContent?: string;
    /** Target URL for canonicals */
    url?: string;
    /** If true, only return score and audit without full rewrite */
    auditOnly?: boolean;
    /** If true, auto-insert Mermaid diagrams and Pollinations images into content */
    autoVisuals?: boolean;
    /** Whether to perform deep competitor analysis */
    analyzeCompetitors?: boolean;
    /** Research Mode: 'discovery' (Topics only) | 'deep' (SERP/Competitors) | 'generate' (Full) | 'section_regenerate' */
    researchMode?: 'discovery' | 'deep_analysis' | 'generate' | 'section_regenerate';
    /** For section_regenerate: The heading of the section */
    sectionHeading?: string;
    /** For section_regenerate: The existing content of the section */
    sectionContent?: string;
    /** For section_regenerate: Instructions for rewriting */
    sectionInstruction?: string;
    /** Cached intelligence data from previous research (Step 1) to avoid duplicate API calls */
    cachedIntelligence?: {
        entities: any[];
        topics: any[];
        serpAnalysis: any;
        competitors: any[];
        timestamp: number;
    };
}

/**
 * Output for StellarWriter
 */
export interface StellarWriterOutput {
    /** Optimized markdown content (null if auditOnly) */
    content?: string;
    /** Concise 1-2 sentence summary */
    summary: string;
    /** SEO Metadata for tags */
    seoMetadata: {
        title: string;
        description: string;
        keywords: string[];
        slug: string;
    };
    /** JSON-LD Schema markup */
    schema: {
        article: object;
        faq?: object;
        product?: object;
    };
    /** Entities discovered/injected */
    entities: MapDataItem[];
    /** Discovered topics/questions for content planning */
    topics?: {
        keyword: string;
        volume: number;
        competition: number;
    }[];
    /** Suggested master outline (if no content provided) */
    masterOutline?: {
        level: number;
        text: string;
    }[];
    humanScore?: number;
    /** Competitor analysis data */
    competitors?: ContentSkeleton[];
    /** Recommended internal links */
    internalLinks: string[];
    /** Visual/Image suggestions */
    imageSuggestions: string[];
    /** Distribution snippets */
    distribution: {
        linkedin?: string;
        reddit?: string;
        twitter?: string;
    };
    /** Performance scores (0-100) */
    scores: {
        seo: number;
        geo: number;
    };
    /** Detailed SEO Score Breakdown */
    detailedSEOScore?: DetailedSEOScore;
    /** SERP Features Analysis */
    serpAnalysis?: SERPAnalysis;
    /** AI detection score (0-100, lower = more human-like) */
    aiDetectionScore?: number;
    /** AI detection pattern flags */
    aiDetectionFlags?: any[];
    /** Content Gap Analysis Results */
    contentGap?: {
        score: number;
        missingKeywords: any[];
        competitorTopics: any[];
    };
    /** Strategic optimization suggestions */
    suggestions: string[];
}

/**
 * StellarWriter Skill Implementation
 */
export class StellarWriterSkill extends BaseSkill {
    name = 'stellar-writer';
    description = 'Universal SEO & GEO Content Engine with Competitor Reverse Engineering.';
    version = '2.3.0';
    category: 'seo' = 'seo';

    protected preferredProvider: 'gemini' | 'claude' | 'deepseek' = 'deepseek';
    protected preferredModel = 'deepseek-chat';

    protected getRequiredInputs(): string[] {
        return ['keywords'];
    }

    /**
     * Detect language script and return appropriate DataForSEO location code.
     * Supports: Chinese, Japanese, Korean, Russian, Arabic.
     * Defaults to US/English for others.
     */
    protected detectLanguageAndLocation(text: string): { lang: string, loc: number } {
        // Chinese (Han Script) -> China (2156)
        if (/[\u4e00-\u9fa5]/.test(text)) {
            return { lang: 'zh', loc: 2156 };
        }
        // Japanese (Hiragana/Katakana) -> Japan (2392)
        if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
            return { lang: 'ja', loc: 2392 };
        }
        // Korean (Hangul) -> South Korea (2410)
        if (/[\uac00-\ud7af]/.test(text)) {
            return { lang: 'ko', loc: 2410 };
        }
        // Russian (Cyrillic) -> Russia (2643)
        if (/[\u0400-\u04ff]/.test(text)) {
            return { lang: 'ru', loc: 2643 };
        }
        // Arabic -> UAE (2784) - Common hub, or Saudi Arabia (2682)
        if (/[\u0600-\u06ff]/.test(text)) {
            return { lang: 'ar', loc: 2784 };
        }

        // Default: English / United States
        return { lang: 'en', loc: 2840 };
    }

    /**
     * Helper to map back location code to string for other APIs
     */
    protected getLocationNameFromCode(code: number): string {
        switch (code) {
            case 2156: return 'China';
            case 2392: return 'Japan';
            case 2410: return 'South Korea';
            case 2643: return 'Russia';
            case 2784: return 'United Arab Emirates';
            default: return 'United States';
        }
    }

    /**
     * Main execution logic
     */
    protected async executeInternal(
        input: SkillInput
    ): Promise<{
        data: StellarWriterOutput;
        metadata: Partial<SkillExecutionMetadata>;
    }> {
        const stellarInput = input as unknown as StellarWriterInput;
        let { keywords, location, analyzeCompetitors = true, auditOnly, cachedIntelligence } = stellarInput;

        // Ensure location has a valid value (empty string should be replaced with default)
        if (!location || location.trim() === '') {
            location = 'United States';
        }

        const perf: any = { start: Date.now() };
        const mode = stellarInput.researchMode || 'generate';

        // 🎯 QUICK EXIT: Audit Mode (No need for heavy intelligence gathering)
        if (mode === 'audit') {
            console.log(`🧐 [Audit Mode] Analyzing existing content for "${keywords}"...`);
            const provider = getProvider(this.preferredProvider);
            const prompt = StellarWriterSkill.buildStellarPrompt(stellarInput, [], [], [], undefined, []);

            const { response, cost } = await this.generateWithAI(provider, prompt, {
                model: this.preferredModel,
                temperature: 0.3,
            });

            if (!response || !response.content) {
                throw new Error('AI Engine returned an empty response during audit');
            }

            const result = this.parseResponse(response.content, [], [], [], undefined, keywords);
            return {
                data: result,
                metadata: {
                    modelUsed: response.model,
                    provider: this.preferredProvider,
                    tokensUsed: (response.inputTokens || 0) + (response.outputTokens || 0),
                    cost,
                    executionTime: Date.now() - perf.start
                }
            };
        }

        // Full mock mode - return complete mock data without any API calls
        if (process.env.USE_FULL_MOCK === 'true') {
            console.log(`🎭 FULL MOCK MODE: Generating mock output for "${keywords}"...`);

            const mockTopics = [
                { keyword: `best ${keywords}`, volume: 3200, competition: 45 },
                { keyword: `free ${keywords}`, volume: 5100, competition: 62 },
                { keyword: `how to ${keywords}`, volume: 4500, competition: 38 },
                { keyword: `${keywords} guide`, volume: 2800, competition: 35 },
                { keyword: `${keywords} tips`, volume: 3600, competition: 42 },
                { keyword: `${keywords} tutorial`, volume: 2100, competition: 31 },
                { keyword: `${keywords} vs`, volume: 1800, competition: 48 },
                { keyword: `${keywords} comparison`, volume: 1500, competition: 44 },
            ];

            return {
                data: {
                    content: auditOnly ? undefined : `# ${keywords} 完整指南\n\n这是关于 ${keywords} 的详细内容...\n\n## 什么是 ${keywords}？\n\n${keywords} 是一个重要的主题...\n\n## 如何使用 ${keywords}？\n\n1. 步骤一\n2. 步骤二\n3. 步骤三`,
                    summary: `这是一篇关于 ${keywords} 的综合指南，涵盖了基础概念、实用技巧和最佳实践。`,
                    seoMetadata: {
                        title: `${keywords} - 2026 年完整指南 | 专家建议`,
                        description: `探索 ${keywords} 的所有知识。获取专家见解、实用技巧和行业最佳实践。适合初学者和专业人士。`,
                        keywords: [keywords, `${keywords} 指南`, `${keywords} 教程`, `最佳 ${keywords}`],
                        slug: keywords.toLowerCase().replace(/\s+/g, '-')
                    },
                    schema: {
                        article: {
                            "@context": "https://schema.org",
                            "@type": "Article",
                            "headline": `${keywords} - 完整指南`,
                            "author": { "@type": "Person", "name": "ScaletoTop" }
                        }
                    },
                    entities: [],
                    topics: mockTopics,
                    masterOutline: [
                        { level: 1, text: `什么是 ${keywords}？` },
                        { level: 1, text: `${keywords} 的核心优势` },
                        { level: 2, text: `提高效率` },
                        { level: 2, text: `降低成本` },
                        { level: 1, text: `如何开始使用 ${keywords}` },
                        { level: 2, text: `准备工作` },
                        { level: 2, text: `实施步骤` },
                        { level: 1, text: `常见问题解答` },
                    ],
                    internalLinks: [
                        `/blog/${keywords.toLowerCase().replace(/\s+/g, '-')}-basics`,
                        `/blog/${keywords.toLowerCase().replace(/\s+/g, '-')}-advanced`,
                    ],
                    imageSuggestions: [
                        `${keywords} 概览图表`,
                        `${keywords} 实施流程图`,
                        `${keywords} 对比分析图`,
                    ],
                    distribution: {
                        linkedin: `🚀 新文章发布！探索 ${keywords} 的完整指南。#${keywords.replace(/\s+/g, '')} #营销`,
                        reddit: `我写了一篇关于 ${keywords} 的综合指南，涵盖了从基础到高级的所有内容。`,
                        twitter: `📊 ${keywords} 完整指南发布！学习如何充分利用这个强大的工具。`
                    },
                    scores: {
                        seo: 85,
                        geo: 78
                    },
                    suggestions: [
                        `添加更多实际案例研究`,
                        `增强视觉内容（图表、信息图）`,
                        `优化移动端阅读体验`,
                        `添加更多内部链接`,
                    ]
                },
                metadata: {
                    tokensUsed: 850,
                    cost: 0.000238,
                }
            };
        }

        // 1. Intelligence Gathering Phase
        let entities: MapDataItem[] = [];
        let topics: any[] = [];
        let competitorSkeletons: ContentSkeleton[] = [];
        let serpAnalysis; // Declare outside for proper scope

        try {
            // DETECT LANGUAGE & LOCATION
            const { lang: detectedLang, loc: detectedLoc } = this.detectLanguageAndLocation(keywords);
            console.log(`🌍 Detected Context: Lang=${detectedLang}, Loc=${detectedLoc} (based on "${keywords}")`);

            // Parallel Execution: Fetch SERP Analysis AND Related Keywords
            const promises: Promise<any>[] = [];

            // 1. SERP Analysis Task
            if (!auditOnly || input.researchMode === 'discovery' || input.researchMode === 'deep_analysis') {
                const searchLocation = (location && location !== 'United States') ? location : this.getLocationNameFromCode(detectedLoc);
                console.log('🔍 Starting SERP Analysis...', { keywords, location: searchLocation });

                promises.push(
                    DataForSEOClient.searchGoogleSERP(keywords, searchLocation)
                        .then(async (results) => {
                            if (results && results.length > 0) {
                                const analyzer = new SERPAnalyzer();
                                serpAnalysis = analyzer.analyzeRawData(results, keywords);
                                competitorSkeletons = await extractCompetitorSkeletons(results);
                            }
                            return results;
                        })
                        .catch(err => console.error('SERP Analysis failed:', err))
                );
            } else {
                promises.push(Promise.resolve(null));
            }

            // 2. Related Keywords Task
            if (!auditOnly || input.researchMode === 'discovery' || input.researchMode === 'deep_analysis') {
                console.log('📊 Fetching Related Keywords...');
                promises.push(
                    DataForSEOClient.getRelatedTopics(keywords, detectedLoc, detectedLang)
                        .then(data => { topics = data; return data; })
                        .catch(err => console.error('Keyword fetch failed:', err))
                );
            } else {
                promises.push(Promise.resolve(null));
            }

            // 3. Map Entities Task (Optional)
            if (!auditOnly || input.researchMode === 'deep_analysis') {
                const searchLocation = (location && location !== 'United States') ? location : this.getLocationNameFromCode(detectedLoc);
                promises.push(
                    DataForSEOClient.searchGoogleMaps(keywords, searchLocation)
                        .then(data => { entities = data; return data; })
                        .catch(err => console.error('Maps fetch failed:', err))
                );
            }

            // Wait for all intelligence gathering to complete
            await Promise.all(promises);

        } catch (error) {
            console.error('Intelligence gathering failed:', error);
            // Continue execution, just without rich data
        }



        // Helper function to check if cached data is fresh (< 1 hour old)
        const isDataFresh = (timestamp: number, maxAgeMinutes: number = 60): boolean => {
            const ageMs = Date.now() - timestamp;
            const ageMinutes = ageMs / (1000 * 60);
            return ageMinutes < maxAgeMinutes;
        };

        const useCachedData = cachedIntelligence && isDataFresh(cachedIntelligence.timestamp);

        // mode is already defined above (line 215)

        if (mode === 'discovery') {
            console.log(`🔍 [Discovery Mode] Fetching only related topics for "${keywords}"...`);
            const t1 = Date.now();
            topics = await DataForSEOClient.getRelatedTopics(keywords);
            perf.topics = Date.now() - t1;

            return {
                data: {
                    summary: 'Topic Discovery Completed',
                    seoMetadata: { title: '', description: '', keywords: [], slug: '' },
                    schema: { article: {} },
                    entities: [],
                    topics,
                    internalLinks: [],
                    imageSuggestions: [],
                    distribution: {},
                    scores: { seo: 0, geo: 0 },
                    suggestions: []
                },
                metadata: {
                    executionTime: perf.topics,
                    cost: 0 // Topics API cost is negligible/free usually or we ignore tracking for now
                }
            };
        }

        if (useCachedData) {
            console.log('♻️  Using cached intelligence data from Step 1 (age: ' +
                Math.round((Date.now() - cachedIntelligence!.timestamp) / 1000 / 60) + ' minutes)');
            entities = cachedIntelligence!.entities || [];
            topics = cachedIntelligence!.topics || [];
            serpAnalysis = cachedIntelligence!.serpAnalysis;
            competitorSkeletons = cachedIntelligence!.competitors || [];
        } else {
            // Check if we are in 'deep_analysis' mode OR if this is a fresh generation run
            // If mode is 'deep_analysis', we fetch everything.
            // If mode is 'generate' but no cache, we fetch everything (fallback).

            if (cachedIntelligence && !isDataFresh(cachedIntelligence.timestamp)) {
                console.log('⚠️  Cached data is stale (> 60 minutes), fetching fresh data');
            } else {
                console.log('🆕 No cached data available, fetching fresh intelligence');
            }

            try {
                // If we are in deep_analysis, we might NOT need to re-fetch topics if they were passed in?
                // But typically we just re-fetch or use what we have. 
                // To keep it simple, we'll fetch everything needed for deep analysis.

                // 1. Topics (Optional in deep mode if we trust the user's selection, but good to have context)
                // We'll skip topics if in deep_analysis to save time, unless we have none.
                if (mode === 'generate') {
                    const t1 = Date.now();
                    console.log(`Step 2: Fetching topics data for ${keywords}...`);
                    topics = await DataForSEOClient.getRelatedTopics(keywords);
                    perf.topics = Date.now() - t1;
                }

                const t0 = Date.now();
                console.log(`Step 1: Fetching maps data for ${keywords}...`);
                entities = await DataForSEOClient.searchGoogleMaps(keywords, location, 5);
                perf.maps = Date.now() - t0;

                // SERP Analysis - identify SEO opportunities
                const t2 = Date.now();
                console.log(`Step 2.5: Analyzing SERP features for "${keywords}"...`);
                try {
                    const analyzer = new SERPAnalyzer();
                    serpAnalysis = await analyzer.analyzeSERP(keywords, location);
                    console.log('✅ SERP Analysis completed successfully:', {
                        hasData: !!serpAnalysis,
                        featuredSnippet: serpAnalysis.featuredSnippet?.exists,
                        opportunity: serpAnalysis.featuredSnippet?.opportunity,
                        paaCount: serpAnalysis.peopleAlsoAsk.length,
                        recommendationsCount: serpAnalysis.recommendations.length,
                        features: serpAnalysis.serpFeatures
                    });
                } catch (error) {
                    console.error('❌ SERP analysis failed with error:', error);
                    serpAnalysis = undefined;
                }
                perf.serp = Date.now() - t2;

                if (analyzeCompetitors || mode === 'deep_analysis') {
                    const t3 = Date.now();
                    console.log(`🔍 Step 3: Fetching SERP data for competitor analysis...`);
                    console.log(`   - analyzeCompetitors: ${analyzeCompetitors}`);
                    console.log(`   - mode: ${mode}`);
                    const serp = await DataForSEOClient.searchGoogleSERP(keywords, location, 5);
                    console.log(`   - SERP results count: ${serp.length}`);
                    const competitorUrls = serp
                        .filter(item => item.type === 'organic')
                        .map(item => item.url)
                        .filter(Boolean);
                    console.log(`   - Organic URLs found: ${competitorUrls.length}`);
                    console.log(`   - URLs: ${JSON.stringify(competitorUrls.slice(0, 3))}`);

                    if (competitorUrls.length > 0) {
                        console.log(`   - Extracting skeletons from top ${Math.min(3, competitorUrls.length)} competitors...`);
                        competitorSkeletons = await SkeletonExtractor.batchExtract(competitorUrls.slice(0, 3));
                        console.log(`   ✅ Extracted ${competitorSkeletons.length} competitor skeletons`);
                    } else {
                        console.log(`   ⚠️ No organic URLs found in SERP results`);
                    }
                    perf.competitors = Date.now() - t3;
                }
            } catch (e) {
                console.error('Intelligence phase partial failure', e);
            }

            // Proceed to Generation Phase to create Master Outline and Strategy
            console.log('🧠 [Deep Analysis] Proceeding to AI Strategy Generation...');
        }

        // 6. Internal Content Search (if domain provided)
        let internalContentInventory: any[] = [];
        // Check cache first
        if (cachedIntelligence && (cachedIntelligence as any).internalContent) {
            internalContentInventory = (cachedIntelligence as any).internalContent;
        }
        // Otherwise search if URL provided
        else if (stellarInput.url && stellarInput.url.trim() !== '') {
            try {
                const domain = stellarInput.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                console.log(`🔗 [Site Search] Searching internal content for ${domain}...`);
                const siteQuery = `site:${domain} "${keywords}"`;
                const siteSerp = await DataForSEOClient.searchGoogleSERP(siteQuery, location, 10);
                internalContentInventory = siteSerp
                    .filter(item => item.type === 'organic')
                    .map(item => ({
                        title: item.title,
                        url: item.url,
                        snippet: item.description
                    }));
                console.log(`   ✅ Found ${internalContentInventory.length} internal pages`);
            } catch (err) {
                console.warn('Site search failed:', err);
            }
        }

        // >>> NEW: Section Regeneration Mode
        if (mode === 'section_regenerate') {
            const tGen = Date.now();
            console.log(`✏️ Regenerating section: "${stellarInput.sectionHeading}"`);

            const systemPrompt = `You are an expert editor. Rewrite the specific section of an article.
Target Audience: ${stellarInput.industry || 'General'}
Tone: ${stellarInput.tone || 'Professional'}
Goal: Improve the section based on instructions, keeping it factual and high-quality.`;

            const userPrompt = `
SECTION HEADING: ${stellarInput.sectionHeading}
CURRENT CONTENT: 
${stellarInput.sectionContent || '(Empty)'}

INSTRUCTION: ${stellarInput.sectionInstruction || 'Improve clarity and depth.'}

CONTEXT:
Main Keyword: ${keywords}

Please return ONLY the rewritten content for this section. Do not include the heading H2 in the output, just the body text (paragraphs, lists).`;

            // Use the same provider as the main flow
            const provider = getProvider(this.preferredProvider);
            const { response, cost } = await this.generateWithAI(provider, `${systemPrompt}\n\n${userPrompt}`, {
                model: this.preferredModel,
                temperature: 0.7
            });

            // 4. Humanize Loop (Dual-Model Strategy)
            console.log('🛡️  Running AI Fingerprint Bleaching Loop...');
            const { content: finalContent, score: finalScore } = await this.humanizeLoop(provider, response.content, keywords);

            return {
                data: {
                    content: finalContent, // This is just the section body
                    humanScore: finalScore,
                    suggestions: []
                } as any,
                metadata: {
                    executionTime: Date.now() - tGen,
                    tokensUsed: (response.inputTokens || 0) + (response.outputTokens || 0),
                    cost: cost
                }
            };
        }
        // <<< End Section Regeneration

        // 2. Generation Phase: Build Unified Prompt
        const provider = getProvider(this.preferredProvider);
        const prompt = StellarWriterSkill.buildStellarPrompt(stellarInput, entities, topics, competitorSkeletons, serpAnalysis, internalContentInventory);

        // 3. Execution
        const t4 = Date.now();
        console.log(`Step 4: Generating with AI (${this.preferredProvider})...`);
        const { response, cost } = await this.generateWithAI(provider, prompt, {
            model: this.preferredModel,
            temperature: 0.7,
            maxOutputTokens: 8000,
        });

        // 4. Humanize Loop (Dual-Model Strategy)
        console.log('🛡️  Running AI Fingerprint Bleaching Loop...');
        const { content: finalContent, score: finalScore } = await this.humanizeLoop(provider, response.content, keywords);

        perf.ai = Date.now() - t4;
        perf.total = Date.now() - perf.start;

        console.log('\n⏱️  Performance Metrics (ms):', perf);

        if (!response || !response.content) {
            throw new Error('AI Engine returned an empty response');
        }

        // 4. Orchestration: Parse and finalize
        // Use 'finalContent' (humanized) instead of 'response.content'
        const result = this.parseResponse(finalContent, entities, topics, competitorSkeletons, serpAnalysis, stellarInput.keywords);

        // Inject human score
        result.humanScore = finalScore;

        return {
            data: result,
            metadata: {
                modelUsed: response.model,
                provider: this.preferredProvider,
                tokensUsed: (response.inputTokens || 0) + (response.outputTokens || 0),
                cost,
                executionTime: perf.total // Add total execution time
            },
        };
    }

    public static buildStellarPrompt(
        input: StellarWriterInput,
        entities: MapDataItem[],
        topics: any[],
        competitors: ContentSkeleton[],
        serpAnalysis?: SERPAnalysis,
        internalContent: any[] = []
    ): string {
        const { keywords, brandName = 'ScaletoTop', industry = 'General', tone = 'professional', type = 'blog', originalContent, auditOnly, url, autoVisuals = false } = input;

        const entityCtx = entities.length > 0
            ? `## Real-World Entities
${entities.map(e => `- ${e.title}: ${e.address}. Rating: ${e.rating}.`).join('\n')}`
            : '';

        const topicCtx = topics.length > 0
            ? `## Related Keywords & Search Volume
${topics.map(t => `- ${t.keyword}: Volume ${t.volume}, Competition ${t.competition}%`).join('\n')}`
            : '';

        const competitorCtx = competitors.length > 0
            ? `## Competitor Outlines
${competitors.map(c => `### Competitor: ${c.title}\n${c.headings.map(h => `${'  '.repeat(h.level - 1)}- ${h.text}`).join('\n')}\n`).join('\n')}`
            : '';

        const internalCtx = internalContent.length > 0
            ? `## Internal Content Inventory (Use these for Internal Link Strategy)
${internalContent.map(c => `- [${c.title}](${c.url}): ${c.snippet}`).join('\n')}`
            : '';

        return `You are a world-class Growth Marketer and SEO/GEO expert.
Context: Current date is ${new Date().toISOString().split('T')[0]}.

TITLE RULES:
1. Only include the year (${new Date().getFullYear()}) if the content is time-sensitive (e.g. "Trends", "Best of", "Guide").
2. Do NOT force the year into general topics (e.g. "History of SEO", "What is Marketing").
3. Vary title structures: Questions, Listicles, How-to, Provocative Statements.


MODE: ${auditOnly ? 'AUDIT & STRATEGY ONLY. Analyse keywords and competitors, and provide a "Master Outline" that can beat them.' : `FULL CONTENT GENERATION MODE - Create complete, publication-ready article.

📝 CONTENT REQUIREMENTS (CRITICAL):
- Minimum 1500-2500 words (8000+ Chinese characters)
- 5-7 H2 sections, each with 200-400 words
- 2-3 full paragraphs under EVERY heading
- Include specific examples, data, case studies
- NO placeholders like "内容..." or "详细信息..."
- NO outline-only structure
- Use transition words between paragraphs
- Answer What? Why? How? in each section

🎯 HUMAN WRITING CHARACTERISTICS (MANDATORY):
- Write naturally like a human expert, NOT as an AI
- Use contractions (I'm, you'll, can't, won't, it's)
- Vary sentence length dramatically (mix 5-word and 25-word sentences)
- Be conversational and direct
- Show personality and opinions
- Use active voice predominantly

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
- Occasional questions to engage readers`}


## Target Profiles
- Keywords: ${keywords}
- Brand: ${brandName}
- Industry: ${industry}

${originalContent ? `\n## Original Content\n${originalContent}\n` : 'Note: User is starting from scratch. Focus on creating the best Master Outline.'}

${competitorCtx}
${internalCtx}
${entityCtx}
${topicCtx}

${serpAnalysis ? buildSERPEnhancedPrompt({
            serpAnalysis,
            relatedKeywords: topics,
            targetKeyword: keywords,
            competitors
        }) : ''}

## Core Requirements
1. **Reverse Engineering**: Create a "Master Outline" (H1-H3) that is superior to all competitors.
2. **GEO Strategy**: Direct Answer First (AEO), Entity Binding, and Information Gain.
4. **Internal Link Strategy**: Suggest 3-5 specific internal links.
   ${internalContent.length > 0
                ? `- MANDATORY: Select links ONLY from the "Internal Content Inventory" provided above.`
                : `- Suggest links to hypothetical related content.`}
   ${autoVisuals
                ? `- Insert links naturally into the content using the format \`[Anchor Text](/suggested-slug)\`.`
                : `- **IMPORTANT**: Do NOT insert links into the body content. ONLY list them in the JSON \`internalLinks\` array. Keep the body text clean.`}
5. **Visual Assets Strategy**:
   ${autoVisuals
                ? `- **Diagrams**: Use Mermaid.js for processes/comparisons. Wrap in \`\`\`mermaid code block.
   - **Images**: Use dynamic AI images for every section. Syntax: \`![Alt Text](https://image.pollinations.ai/prompt/KEYWORD_PLUS_SIGN_SEPARATED)\`.`
                : `- **IMPORTANT**: Do NOT insert images or diagrams into the body content.
   - **Suggestions**: Provide detailed text descriptions for recommended visuals in the JSON \`imageSuggestions\` array.
   - **Diagrams**: Do NOT generate Mermaid code in the body.`}

## Output JSON Format
\`\`\`json
{
  ${!auditOnly ? '"content": "# Markdown content here",' : ''}
  "summary": "1-sentence summary",
  "seoMetadata": { "title": "...", "description": "... ", "keywords": [], "slug": "..." },
  "schema": { "article": { /* JSON-LD Article */ } },
  ${auditOnly ? '"masterOutline": [ { "level": 1, "text": "H1 Title" }, { "level": 2, "text": "H2 Subtitle" } ],' : ''}
  "internalLinks": ["/blog/related-topic-1", "/blog/related-topic-2"],
  "scores": { "seo": 95, "geo": 92 },
  "suggestions": ["Strategic point 1", "..."],
  "distribution": {
    "twitter": {
        "thread": ["Tweet 1", "Tweet 2..."],
        "hashtags": ["#marketing", "#seo"]
    },
    "linkedin": {
        "post": "Professional update...",
        "hashtags": ["#marketing", "#seo"]
    }
  }
}
\`\`\`

Return ONLY JSON.`;
    }

    private parseResponse(
        raw: string,
        entities: MapDataItem[],
        topics: any[],
        competitors: ContentSkeleton[],
        serpAnalysis?: SERPAnalysis,
        targetKeyword?: string
    ): StellarWriterOutput {
        const json = this.extractJSON<any>(raw);

        // 🎨 Apply humanization if content was generated
        let finalContent = json?.content;
        let humanizationChanges;
        let aiDetectionResult;

        if (finalContent) {
            // Apply humanization
            const humanized = humanizeContent(finalContent);
            finalContent = humanized.text;
            humanizationChanges = humanized.changes;

            // Detect AI patterns
            aiDetectionResult = detectAIPatterns(finalContent);

            console.log('🎭 Humanization applied:', humanizationChanges);
            console.log('🔍 AI Detection score:', aiDetectionResult.score);
        }

        // Calculate detailed SEO score if content is available
        let detailedSEOScore;
        if (finalContent && json?.seoMetadata) {
            try {
                detailedSEOScore = calculateDetailedSEOScore(
                    json.seoMetadata.title || '',
                    json.seoMetadata.description || '',
                    finalContent,  // Use humanized content
                    json.seoMetadata.keywords?.[0] || '',
                    json.imageSuggestions?.map((alt: string) => ({ alt })) || []
                );

                // Update overall SEO score from detailed calculation
                if (json.scores) {
                    json.scores.seo = detailedSEOScore.overall;
                }
            } catch (error) {
                console.error('Error calculating detailed SEO score:', error);
            }
        }

        return {
            content: finalContent,  // Return humanized content
            summary: json?.summary || 'Optimized content',
            seoMetadata: json?.seoMetadata || { title: '', description: '', keywords: [], slug: '' },
            schema: json?.schema || { article: {} },
            entities: entities,
            topics: topics,
            masterOutline: json?.masterOutline,
            competitors: competitors,

            contentGap: (() => {
                if (json?.masterOutline && competitors.length > 0 && targetKeyword) {
                    try {
                        console.log('📊 Running Content Gap Analysis...');
                        return ContentGapAnalyzer.analyze(targetKeyword, json.masterOutline, competitors, topics);
                    } catch (err) {
                        console.error('❌ Content Gap Analysis failed:', err);
                        return undefined;
                    }
                }
                return undefined;
            })(),
            internalLinks: json?.internalLinks || [],
            imageSuggestions: json?.imageSuggestions || [],
            distribution: json?.distribution || {},
            scores: json?.scores || { seo: 50, geo: 50 },
            detailedSEOScore,
            serpAnalysis,  // SERP analysis from Phase 2
            aiDetectionScore: aiDetectionResult?.score,  // New field
            aiDetectionFlags: aiDetectionResult?.flags,   // New field
            suggestions: json?.suggestions || []
        };
    }

    /**
     * Iterative Humanization Loop
     * Checks "Human Score" and rewrites if necessary.
     */
    private async humanizeLoop(provider: any, content: string, keyword: string): Promise<{ content: string; score: number }> {
        let currentContent = content;
        let currentScore = calculateHumanScore(currentContent);
        let loops = 0;
        const MAX_LOOPS = 1; // Limit to 1 rewrite pass for speed trade-off

        console.log(`   - Initial Human Score: ${currentScore.toFixed(1)}/100`);

        while (currentScore < 60 && loops < MAX_LOOPS) {
            console.log(`   ⚠️ Score too low (<60). Triggering Aggressive Editor (Pass ${loops + 1})...`);

            const bleedPrompt = `You are an aggressive "Humanizer" editor. 
            Your goal is to rewrite the text to bypass AI detection filters.
            
            CRITICAL RULES:
            1. VARY SENTENCE LENGTH: Mix very short sentences (3-5 words) with long, complex ones.
            2. USE CONTRACTIONS: "It is" -> "It's", "Do not" -> "Don't".
            3. REMOVE AI TROPES: Delete "In conclusion", "Moreover", "It's worth noting", "Delve into".
            4. ADD PERSONALITY: Use idioms, rhetorical questions, and "I/We" perspective.
            
            Original Text Context: ${keyword}
            
            Rewrite the following text to be 100% human-sounding. KEEP MARKDOWN FORMATTING INTACT (Headings, bold, links).`;

            try {
                const { response } = await this.generateWithAI(provider, `${bleedPrompt}\n\n${currentContent}`, {
                    model: this.preferredModel, // Ideally use a faster/dumber model if available, but staying consistent for now
                    temperature: 0.9 // Higher temp for more variance
                });

                if (response.content) {
                    const newScore = calculateHumanScore(response.content);
                    console.log(`   - New Human Score: ${newScore.toFixed(1)}/100`);

                    if (newScore > currentScore) {
                        currentContent = response.content;
                        currentScore = newScore;
                    } else {
                        console.log('   - Rewrite didn\'t improve score. Keeping previous.');
                    }
                }
            } catch (err) {
                console.warn('Humanize loop failed:', err);
            }
            loops++;
        }

        return { content: currentContent, score: currentScore };
    }
}

/**
 * Helper to extract competitor outlines from SERP results
 */
async function extractCompetitorSkeletons(serpResults: any[]): Promise<ContentSkeleton[]> {
    const urls = serpResults
        .filter((item: any) => item.type === 'organic')
        .slice(0, 5)
        .map((item: any) => item.url)
        .filter((url: any) => !!url);

    if (urls.length === 0) return [];

    console.log(`🦴 Extracting skeletons from ${urls.length} competitor URLs...`);
    return SkeletonExtractor.batchExtract(urls);
}
