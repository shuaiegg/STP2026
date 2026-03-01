/**
 * StellarWriter Unified Skill v3.0 (Modularized)
 * 
 * Orchestrates the modular generation flow:
 * Intelligence -> Strategy -> Execution -> Refinement
 */

import { BaseSkill } from '../base-skill';
import type { SkillInput, SkillOutput, SkillExecutionMetadata } from '../types';
import { getProvider } from '../providers';
import { IntelligenceEngine } from './stellar/IntelligenceEngine';
import { StrategyComposer } from './stellar/StrategyComposer';
import { ExecutionAgent } from './stellar/ExecutionAgent';
import { RefiningStudio } from './stellar/RefiningStudio';
import { StellarWriterOutput, StellarWriterInput } from './types';

export class StellarWriterSkill extends BaseSkill {
    name = 'stellar-writer';
    description = 'Universal SEO & GEO Content Engine - Modular v3';
    version = '3.0.0';
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
        const startTime = Date.now();

        console.log(`🧞‍♂️ [Stellar-v3] Starting Orchestration for: ${keywords}`);

        try {
            // 1. Intelligence Phase
            const intelligence = await IntelligenceEngine.gather(keywords, location);

            // 2. Strategy Phase
            const strategy = StrategyComposer.compose(intelligence, stellarInput);

            // 3. Execution Phase
            const provider = getProvider(this.preferredProvider);
            const asset = await ExecutionAgent.generate(strategy, provider, this);

            if (!asset) {
                throw new Error("Execution Phase failed to return an asset.");
            }

            // 4. Refinement Phase
            const refinedAsset = await RefiningStudio.refine(asset, keywords, provider, this);

            // 5. Build Standard Response structure for compatibility
            const finalOutput: StellarWriterOutput = {
                content: refinedAsset.content,
                summary: refinedAsset.summary,
                seoMetadata: {
                    title: refinedAsset.metadata.title,
                    description: refinedAsset.metadata.description,
                    keywords: [keywords],
                    slug: refinedAsset.metadata.slug || keywords.toLowerCase().replace(/\s+/g, '-')
                },
                schema: refinedAsset.schema || { article: {} },
                entities: intelligence.entities,
                topics: intelligence.topics,
                competitors: intelligence.competitors,
                internalLinks: [],
                imageSuggestions: [],
                distribution: {},
                scores: {
                    seo: refinedAsset.scores.seo,
                    geo: refinedAsset.scores.geo
                },
                humanScore: refinedAsset.scores.human,
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
