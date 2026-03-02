
import { StellarParser } from './utils/parser';
import { GenerationAsset } from './types';
import { humanizeContent } from '@/lib/utils/humanize';
import { calculateHumanScore } from '@/lib/utils/ai-detection';

export class ExecutionAgent {
    /**
     * Executes the AI call section-by-section based on the master outline.
     * V6: Iterative Generation — high Information Gain and PAA enforcement.
     */
    static async generate(strategy: any, provider: any, skillContext: any, outline: any[]): Promise<GenerationAsset | null> {
        console.log("🚀 [ExecutionAgent] Starting Section-by-Section Generation...");

        if (!outline || outline.length === 0) {
            throw new Error("ExecutionAgent requires a master outline to generate section-by-section.");
        }

        let fullContent = "";
        let previousContent = "";

        // 1. Generate Title (H1)
        const h1Section = outline.find(i => i.level === 1) || { text: strategy.keywords };
        const title = h1Section.text;
        fullContent += `# ${title}\n\n`;

        // Filter out H1 from the sections we actually send to LLM (we just wrote it)
        const sectionsToGenerate = outline.filter(i => i.level > 1);

        for (let i = 0; i < sectionsToGenerate.length; i++) {
            const section = sectionsToGenerate[i];
            const isFirst = i === 0;
            const isLast = i === sectionsToGenerate.length - 1;

            console.log(`✍️ [ExecutionAgent] Generating section ${i + 1}/${sectionsToGenerate.length}: ${section.text}`);

            const sectionPrompt = strategy.buildSectionPrompt(
                section.text,
                previousContent,
                isFirst,
                isLast
            );

            try {
                const { response } = await skillContext.generateWithAI(provider, sectionPrompt, {
                    model: strategy.model,
                    temperature: strategy.temperature,
                    systemPrompt: strategy.systemPrompt
                });

                if (response?.content) {
                    let sectionContent = response.content.trim();

                    // The LLM shouldn't repeat the heading, but if it did, remove it to avoid duplication.
                    const headingPattern = new RegExp(`^#{1,6}\\s+${section.text.replace(/[.*+?^$\\{}()|[\\]\\\\]/g, '\\$&')}\\s*\\n`, 'i');
                    sectionContent = sectionContent.replace(headingPattern, '');

                    const finalSectionText = `## ${section.text}\n\n${sectionContent}\n\n`;
                    fullContent += finalSectionText;

                    // Update previous context for the next iteration (keep it reasonably sized)
                    previousContent = (previousContent + finalSectionText).slice(-1500);
                }
            } catch (error) {
                console.error(`❌ [ExecutionAgent] Failed to generate section: ${section.text}`, error);
                // Optionally append a fallback if a section completely fails
                fullContent += `## ${section.text}\n\n*(Content generation failed for this section)*\n\n`;
            }
        }

        console.log("✅ [ExecutionAgent] Finished generation loop.");

        // We removed the aggressive HumanizeLoop in favor of Information Gain editing in prompt.
        const humanScore = calculateHumanScore(fullContent);

        // Extract first non-heading paragraph as description
        const lines = fullContent.split('\n');
        let description = "";
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.length > 30) {
                description = trimmed.slice(0, 160);
                break;
            }
        }

        const slug = title
            ? title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '')
            : "";

        return {
            content: fullContent,
            summary: description,
            metadata: { title, description, keywords: [], slug },
            schema: {},
            scores: { seo: 0, geo: 0, human: humanScore }
        };
    }
}
