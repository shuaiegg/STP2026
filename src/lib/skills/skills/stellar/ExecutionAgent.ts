
import { StellarParser } from './utils/parser';
import { GenerationAsset } from './types';

export class ExecutionAgent {
    /**
     * Executes the AI call and recovers from malformed outputs.
     */
    static async generate(strategy: any, provider: any, skillContext: any): Promise<GenerationAsset | null> {
        console.log("🚀 [ExecutionAgent] Calling LLM...");

        // Note: provider here is IAIProvider, it uses generateContent not generate
        const { response } = await skillContext.generateWithAI(provider, strategy.userPrompt, {
            model: strategy.model,
            temperature: strategy.temperature,
            system: strategy.systemPrompt
        });

        if (!response?.content) return null;

        const parsed = StellarParser.extractSafeJSON<any>(response.content);
        if (!parsed) {
            console.error("❌ ExecutionAgent: Failed to parse AI response after recovery.");
            return null;
        }

        // Mapping raw output to typed asset
        return {
            content: parsed.content || "",
            summary: parsed.summary || "",
            metadata: parsed.seoMetadata || {},
            schema: parsed.schema || {},
            scores: { seo: 50, geo: 50, human: 50 }
        };
    }
}
