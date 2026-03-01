
import { humanizeContent } from '@/lib/utils/humanize';
import { detectAIPatterns, calculateHumanScore } from '@/lib/utils/ai-detection';
import { calculateDetailedSEOScore } from '@/lib/utils/seo-scoring';
import { GenerationAsset } from './types';

export class RefiningStudio {
    /**
     * Enhances AI output with humanization and SEO scoring
     */
    static async refine(asset: GenerationAsset, keywords: string, provider: any, skillContext: any): Promise<GenerationAsset> {
        console.log("🎨 [RefiningStudio] Starting Humanization Loop...");

        let currentContent = asset.content;
        let currentScore = calculateHumanScore(currentContent);
        
        // 1. Humanize Loop (Limit to 1 pass for baseline)
        if (currentScore < 60) {
            console.log(`   ⚠️ Score too low (${currentScore.toFixed(1)}). Triggering Aggressive Editor...`);
            
            const bleedPrompt = `You are an aggressive "Humanizer" editor. 
            Rewrite the following text to be 100% human-sounding. 
            Vary sentence length, use contractions, and remove AI tropes.
            KEEP MARKDOWN FORMATTING INTACT.`;

            try {
                const { response } = await skillContext.generateWithAI(provider, `${bleedPrompt}\n\n${currentContent}`, {
                    model: 'deepseek-chat',
                    temperature: 0.9
                });

                if (response.content) {
                    const newScore = calculateHumanScore(response.content);
                    console.log(`   - New Human Score: ${newScore.toFixed(1)}/100`);
                    if (newScore > currentScore) {
                        currentContent = response.content;
                    }
                }
            } catch (err) {
                console.warn("   ❌ Humanize loop failed:", err);
            }
        }

        // 2. SEO Scoring
        try {
            const seoDetail = calculateDetailedSEOScore(
                asset.metadata.title,
                asset.metadata.description,
                currentContent,
                keywords,
                []
            );
            asset.scores.seo = seoDetail.overall;
        } catch (e) {
            console.warn("⚠️ SEO Scoring partially failed during refinement");
        }

        // 3. Final Detection
        const aiResult = detectAIPatterns(currentContent);
        asset.scores.human = aiResult.score;
        asset.content = currentContent;

        return asset;
    }
}
