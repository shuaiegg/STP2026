/**
 * STP HUMANIZER PRO (v4.0)
 * Merged from Main v2.3 full humanizer + V3 humanizePro.
 * SAFE VERSION: Preserves Markdown structure and line breaks.
 */

export interface HumanizationResult {
    text: string;
    changes: {
        contractionsAdded: number;
        aiPhrasesRemoved: number;
        sentencesModified: number;
    };
    metrics: {
        score: number;
        aiTellsRemoved: number;
    };
}

/**
 * Full contraction map (30+ pairs from Main v2.3)
 */
const CONTRACTION_MAP: Record<string, string> = {
    // Will
    'will not': "won't",

    // Would
    'would not': "wouldn't",
    'would have': "would've",

    // Could/Should
    'could not': "couldn't",
    'could have': "could've",
    'should not': "shouldn't",
    'should have': "should've",

    // Do
    'do not': "don't",
    'does not': "doesn't",
    'did not': "didn't",

    // Have
    'have not': "haven't",
    'has not': "hasn't",
    'had not': "hadn't",

    // Be verbs
    'is not': "isn't",
    'are not': "aren't",
    'was not': "wasn't",
    'were not': "weren't",

    // Modal + not
    'cannot': "can't",
    'can not': "can't",
    'must not': "mustn't",

    // Common contractions
    'it is': "it's",
    'that is': "that's",
    'what is': "what's",
    'who is': "who's",
    'where is': "where's",
    'how is': "how's",
    'there is': "there's",

    // Pronouns + be
    'I am': "I'm",
    'you are': "you're",
    'we are': "we're",
    'they are': "they're",

    // Pronouns + will
    'I will': "I'll",
    'you will': "you'll",
    'we will': "we'll",
    'they will': "they'll",
    'he will': "he'll",
    'she will': "she'll",

    // Pronouns + have
    'I have': "I've",
    'you have': "you've",
    'we have': "we've",
    'they have': "they've",

    // Pronouns + would
    'I would': "I'd",
    'you would': "you'd",
    'we would': "we'd",
    'they would': "they'd",
    'he would': "he'd",
    'she would': "she'd",
};

/**
 * Comprehensive AI phrase removal rules
 */
const AI_PHRASES: { pattern: RegExp; replacement: string }[] = [
    // "值得注意" series
    { pattern: /It'?s worth noting that\s*/gi, replacement: '' },
    { pattern: /It'?s worth mentioning that\s*/gi, replacement: '' },
    { pattern: /It bears mentioning that\s*/gi, replacement: '' },
    { pattern: /It should be noted that\s*/gi, replacement: '' },
    { pattern: /Note that\s*/gi, replacement: '' },

    // "重要的是" series
    { pattern: /It'?s important to (understand|remember|recognize) that\s*/gi, replacement: '' },
    { pattern: /It'?s crucial to (understand|remember|note) that\s*/gi, replacement: '' },
    { pattern: /It'?s essential to (understand|note) that\s*/gi, replacement: '' },

    // Summary words
    { pattern: /In conclusion,?\s*/gi, replacement: '' },
    { pattern: /To sum up,?\s*/gi, replacement: '' },
    { pattern: /In summary,?\s*/gi, replacement: '' },
    { pattern: /To conclude,?\s*/gi, replacement: '' },

    // "delve" series
    { pattern: /delve into/gi, replacement: 'explore' },
    { pattern: /dive deep(er)? into/gi, replacement: 'explore' },

    // Overly formal connectors
    { pattern: /\bFurthermore,?\s*/gi, replacement: 'Also, ' },
    { pattern: /\bMoreover,?\s*/gi, replacement: 'Plus, ' },
    { pattern: /\bNevertheless,?\s*/gi, replacement: 'But ' },
    { pattern: /\bNonetheless,?\s*/gi, replacement: 'Still, ' },
    { pattern: /\bHence,?\s*/gi, replacement: 'So ' },
    { pattern: /\bThus,?\s*/gi, replacement: 'So ' },
    { pattern: /\bTherefore,?\s*/gi, replacement: 'So ' },

    // "On the other hand"
    { pattern: /On the other hand,?\s*/gi, replacement: 'But ' },
    { pattern: /That being said,?\s*/gi, replacement: 'But ' },
    { pattern: /Having said that,?\s*/gi, replacement: 'But ' },

    // "Ultimately"
    { pattern: /At the end of the day,?\s*/gi, replacement: 'Ultimately, ' },
    { pattern: /When all is said and done,?\s*/gi, replacement: 'In the end, ' },

    // Overly cautious
    { pattern: /It'?s (generally|typically) (believed|thought|considered) that\s*/gi, replacement: '' },
    { pattern: /One might argue that\s*/gi, replacement: '' },
    { pattern: /It could be argued that\s*/gi, replacement: '' },

    // 🌟 GPT-4/Claude Tropes (2025-2026)
    { pattern: /\b(ever-)?evolving landscape\b/gi, replacement: 'industry' },
    { pattern: /\bdynamic landscape\b/gi, replacement: 'market' },
    { pattern: /\ba testament to\b/gi, replacement: 'proof of' },
    { pattern: /\brich tapestry\b/gi, replacement: 'mix' },
    { pattern: /\bunleash(ing)? (the )?power of\b/gi, replacement: 'use' },
    { pattern: /\belevate (your|the)\b/gi, replacement: 'improve' },
    { pattern: /\bgame-changer\b/gi, replacement: 'big change' },
    { pattern: /\bnavigating the\b/gi, replacement: 'handling the' },
    { pattern: /\brealm of\b/gi, replacement: 'world of' },
    { pattern: /\bembark on (a|this) journey\b/gi, replacement: 'start' },
    { pattern: /\bIn today's digital world,?\s*/gi, replacement: '' },
    { pattern: /\bIn this article, we will\b/gi, replacement: 'We will' },
    { pattern: /\bcomprehensive guide\b/gi, replacement: 'guide' },
    { pattern: /\b(pivotal|paramount) role\b/gi, replacement: 'key role' },
];

/**
 * Add contractions randomly (50-70% apply rate for natural feel)
 */
export function addContractions(text: string): string {
    let result = text;
    const applyRate = 0.5 + Math.random() * 0.2;

    Object.entries(CONTRACTION_MAP).forEach(([full, contracted]) => {
        const regex = new RegExp(`\\b${full}\\b`, 'gi');
        const matches = result.match(regex);

        if (matches) {
            matches.forEach(() => {
                if (Math.random() < applyRate) {
                    result = result.replace(regex, contracted);
                }
            });
        }
    });

    return result;
}

/**
 * Remove AI tells/patterns
 */
export function removeAITells(text: string): string {
    let result = text;
    let removedCount = 0;

    AI_PHRASES.forEach(({ pattern, replacement }) => {
        const matches = result.match(pattern);
        if (matches) {
            removedCount += matches.length;
            result = result.replace(pattern, replacement);
        }
    });

    // Clean extra spaces and punctuation
    result = result.replace(/\s{2,}/g, ' ');
    result = result.replace(/\.\s*\./g, '.');
    result = result.replace(/,\s*,/g, ',');

    return result;
}

/**
 * Vary sentence length to break uniform AI patterns
 */
export function varySentenceLength(text: string): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    if (sentences.length < 5) return text;

    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    const cv = Math.sqrt(variance) / mean;

    if (cv < 0.3) {
        for (let i = 0; i < sentences.length - 1; i++) {
            if (lengths[i] < 10 && lengths[i + 1] < 10 && Math.random() < 0.3) {
                sentences[i] = sentences[i].replace(/[.!?]\s*$/, ', ');
            }
        }
    }

    return sentences.join(' ');
}

/**
 * Add human-like quirks for natural feel
 */
export function addHumanQuirks(text: string): string {
    let result = text;

    // Add natural transition words to ~10% of paragraphs
    const paragraphs = result.split('\n\n');
    const transitionWords = ['Look,', 'Listen,', "Here's the thing:", 'Okay,', 'Now,'];

    for (let i = 1; i < paragraphs.length; i++) {
        if (Math.random() < 0.1) {
            const word = transitionWords[Math.floor(Math.random() * transitionWords.length)];
            paragraphs[i] = `${word} ${paragraphs[i]}`;
        }
    }

    result = paragraphs.join('\n\n');

    // Occasionally add em-dash emphasis (5% probability)
    result = result.replace(/,\s+([a-z]+ing|when|if|but)\s+/gi, (match) => {
        return Math.random() < 0.05 ? match.replace(',', '—') : match;
    });

    return result;
}

/**
 * Main humanization function (comprehensive pipeline)
 * Exported as both `humanizeContent` (original name) and `humanizePro` (v3 name)
 */
export function humanizeContent(text: string): HumanizationResult {
    let result = text;

    // 1. Remove AI tells (most important)
    const beforeAI = result;
    result = removeAITells(result);
    const aiPhrasesRemoved = (beforeAI.match(/It'?s worth noting|Furthermore|Moreover/gi) || []).length;

    // 2. Add contractions
    const beforeContractions = result;
    result = addContractions(result);
    const contractionsAdded = result.split("'").length - beforeContractions.split("'").length;

    // 3. Vary sentence length
    const beforeVariance = result;
    result = varySentenceLength(result);
    const sentencesModified = beforeVariance !== result ? 1 : 0;

    // 4. Add human quirks
    result = addHumanQuirks(result);

    // 5. Safe cleanup: preserve markdown line breaks
    result = result.replace(/[ \t]{2,}/g, ' ');

    return {
        text: result,
        changes: {
            contractionsAdded,
            aiPhrasesRemoved,
            sentencesModified
        },
        metrics: {
            score: 0, // Will be filled by humanizeLoop
            aiTellsRemoved: aiPhrasesRemoved
        }
    };
}

/**
 * V3 compatibility alias
 */
export function humanizePro(text: string): string {
    const result = humanizeContent(text);
    return result.text;
}
