
import { generateWithFallback, MODEL_CHAIN } from '@/lib/vps-proxy';
import { IntelligenceContext } from './types';
import { AuditReport } from './StellarAuditor';

export class StellarEditor {
    /**
     * Revises the content based on the Auditor's critical feedback.
     * Uses a priority-ordered model fallback chain for resilience.
     */
    static async revise(
        originalContent: string,
        auditReport: AuditReport,
        intelligenceContext: IntelligenceContext
    ): Promise<string> {
        console.log("📝 [StellarEditor] Commencing AI Revision Pass based on Audit Report...");

        const systemPrompt = `You are a strict, world-class Senior SEO & GEO Editor.
Your job is to apply targeted revisions to an existing article based on an Auditor's feedback report.

CRITICAL RULES:
1. ONLY fix the weaknesses identified in the report.
2. DO NOT rewrite sections that are already strong or change the overall narrative voice.
3. ABSOLUTELY DO NOT REMOVE any Markdown image tags (![alt](url)) or existing Schema/Frontmatter.
4. Keep the exact same H1 title.
5. Return ONLY the finalized Markdown content. Do not include pleasantries, explanations, or "Here is the revised article:".

## Auditor's Weakness Report:
- ${auditReport.weaknesses.join('\n- ')}

## Required Instructions for this Revision:
- ${auditReport.suggestedInstructions.join('\n- ')}

## Contextual Intelligence (For Entity Insertion):
Primary Keyword: ${intelligenceContext.keywords}
Target Entities: ${(intelligenceContext.entities || []).join(', ')}
Related Topics: ${(intelligenceContext.topics || []).join(', ')}
`;

        const userPrompt = `Please revise the following Markdown article according to the Auditor's instructions above:

------ ORIGINAL ARTICLE ------
${originalContent}
------------------------------
`;

        try {
            const result = await generateWithFallback(MODEL_CHAIN.premium, {
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
                temperature: 0.3,
            });

            const revisedContent = result.text.trim();

            // Safety Check: If the model completely hallucinated and returned almost nothing, return original
            if (revisedContent.length < originalContent.length * 0.5) {
                console.warn("⚠️ [StellarEditor] Revision output was suspiciously short. Aborting revision to prevent data loss.");
                return originalContent;
            }

            console.log("✅ [StellarEditor] AI Revision Pass Completed!");
            return revisedContent;

        } catch (error) {
            console.error("❌ [StellarEditor] All models in fallback chain failed:", error);
            return originalContent;
        }
    }
}
