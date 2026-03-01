
import { IntelligenceContext, PromptStrategy } from './types';

export class StrategyComposer {
    /**
     * Composes a specialized prompt based on intelligence data with STRICT HUMANIZATION.
     */
    static compose(ctx: IntelligenceContext, options: any = {}): PromptStrategy {
        const { keywords, competitors, topics, serpAnalysis } = ctx;

        const systemPrompt = `You are a world-class SEO/GEO Growth Marketer and a blunt, expert technical writer. 
Your goal is to generate a high-conversion article for "${keywords}" that sounds 100% human.

STRICT WRITING RULES (ANTI-AI PROTOCOL):
1. NO SIGNIFICANCE INFLATION: Avoid words like "pivotal", "testament", "pivotal role", "evolving landscape", "underscores", "remains a".
2. NO SYCOPHANCY: No "It's worth noting", "It's important to remember", or "In conclusion".
3. USE CONTRACTIONS: Always use "don't", "won't", "it's", "you're".
4. VARY RHYTHM: Mix short, punchy sentences with longer ones.
5. HAVE AN OPINION: Don't just list facts. Use phrases like "I've seen", "In my experience", "The truth is".
6. NO PARTICIPIAL TAILS: Avoid ending sentences with "...highlighting the importance of X" or "...ensuring a better Y".
7. BE BLUNT: If something is a "game-changer", just say why it works. Don't use the word "game-changer".
8. NO LIST OVERUSE: Avoid "First, Second, Third". Use "One problem is", "Another thing is", "Finally".`;

        const competitorOutlines = competitors
            .map(c => `### Competitor: ${c.title}\n${c.headings.map((h:any) => `- ${h.text}`).join('\n')}`)
            .join('\n\n');

        const topicList = topics.map(t => t.keyword).slice(0, 10).join(', ');

        const userPrompt = `
MAIN KEYWORD: ${keywords}
RELATED TOPICS TO INCLUDE: ${topicList}

COMPETITOR STRUCTURES FOR REFERENCE:
${competitorOutlines}

OUTPUT FORMAT:
Return a JSON object with:
{
  "content": "Full markdown content (STRICTLY USE THE ANTI-AI RULES)",
  "summary": "1-sentence summary",
  "seoMetadata": { "title": "...", "description": "..." }
}
`;

        return {
            systemPrompt,
            userPrompt,
            model: 'deepseek-chat',
            temperature: 0.8 // Increased for more natural variety
        };
    }
}
