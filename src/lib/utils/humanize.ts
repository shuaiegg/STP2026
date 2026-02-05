/**
 * AI内容人性化处理工具
 * 目标：让AI生成的内容更像人类写作，通过AI检测
 */

interface HumanizationResult {
    text: string;
    changes: {
        contractionsAdded: number;
        aiPhrasesRemoved: number;
        sentencesModified: number;
    };
}

/**
 * 缩写映射表
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

    // Let us
    'let us': "let's"
};

/**
 * AI套话模式列表（需要移除或替换的）
 */
const AI_PHRASES = [
    // "值得注意" 系列
    { pattern: /It'?s worth noting that\s*/gi, replacement: '' },
    { pattern: /It'?s important to note that\s*/gi, replacement: '' },
    { pattern: /It should be noted that\s*/gi, replacement: '' },
    { pattern: /Note that\s*/gi, replacement: '' },

    // "重要的是" 系列
    { pattern: /It'?s important to (understand|remember|recognize) that\s*/gi, replacement: '' },
    { pattern: /It'?s crucial to (understand|remember|note) that\s*/gi, replacement: '' },
    { pattern: /It'?s essential to (understand|note) that\s*/gi, replacement: '' },

    // 总结词
    { pattern: /In conclusion,?\s*/gi, replacement: '' },
    { pattern: /To sum up,?\s*/gi, replacement: '' },
    { pattern: /In summary,?\s*/gi, replacement: '' },
    { pattern: /To conclude,?\s*/gi, replacement: '' },

    // "深入" 系列
    { pattern: /delve into/gi, replacement: 'explore' },
    { pattern: /dive deep(er)? into/gi, replacement: 'explore' },

    // 过度正式的连接词
    { pattern: /\bFurthermore,?\s*/gi, replacement: 'Also, ' },
    { pattern: /\bMoreover,?\s*/gi, replacement: 'Plus, ' },
    { pattern: /\bNevertheless,?\s*/gi, replacement: 'But ' },
    { pattern: /\bNonetheless,?\s*/gi, replacement: 'Still, ' },
    { pattern: /\bHence,?\s*/gi, replacement: 'So ' },
    { pattern: /\bThus,?\s*/gi, replacement: 'So ' },
    { pattern: /\bTherefore,?\s*/gi, replacement: 'So ' },

    // "另一方面"
    { pattern: /On the other hand,?\s*/gi, replacement: 'But ' },
    { pattern: /That being said,?\s*/gi, replacement: 'But ' },
    { pattern: /Having said that,?\s*/gi, replacement: 'But ' },

    // "最终"
    { pattern: /At the end of the day,?\s*/gi, replacement: 'Ultimately, ' },
    { pattern: /When all is said and done,?\s*/gi, replacement: 'In the end, ' },

    // 过度谨慎
    { pattern: /It'?s (generally|typically) (believed|thought|considered) that\s*/gi, replacement: '' },
    { pattern: /One might argue that\s*/gi, replacement: '' },
    { pattern: /It could be argued that\s*/gi, replacement: '' },

    // 🌟 New GPT-4/Claude Tropes (2025-2026)
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
    { pattern: /\bcomprehensive guide\b/gi, replacement: 'guide' }, // Overused
    { pattern: /\b(pivotal|paramount) role\b/gi, replacement: 'key role' },
];

/**
 * 添加缩写
 */
export function addContractions(text: string): string {
    let result = text;
    let changesCount = 0;

    // 随机选择50-70%的位置应用缩写（不是全部，保持自然）
    const applyRate = 0.5 + Math.random() * 0.2;

    Object.entries(CONTRACTION_MAP).forEach(([full, contracted]) => {
        const regex = new RegExp(`\\b${full}\\b`, 'gi');
        const matches = result.match(regex);

        if (matches) {
            matches.forEach(() => {
                if (Math.random() < applyRate) {
                    result = result.replace(regex, contracted);
                    changesCount++;
                }
            });
        }
    });

    return result;
}

/**
 * 移除AI套话
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

    // 清理多余的空格和标点
    result = result.replace(/\s{2,}/g, ' ');
    result = result.replace(/\.\s*\./g, '.');
    result = result.replace(/,\s*,/g, ',');

    return result;
}

/**
 * 变化句子长度
 * 检测并打破过于均匀的句长模式
 */
export function varySentenceLength(text: string): string {
    // 分割成句子
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    if (sentences.length < 5) return text; // 句子太少，不处理

    // 计算句长
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);

    // 计算变异系数
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    const cv = Math.sqrt(variance) / mean;

    // 如果变异系数 < 0.3，说明句长太均匀，需要调整
    if (cv < 0.3) {
        // 合并一些短句，分割一些长句
        // 这里简化处理：随机合并2-3个短句
        let modified = 0;
        for (let i = 0; i < sentences.length - 1; i++) {
            if (lengths[i] < 10 && lengths[i + 1] < 10 && Math.random() < 0.3) {
                // 合并句子（移除句号，用逗号或and连接）
                sentences[i] = sentences[i].replace(/[.!?]\s*$/, ', ');
                modified++;
            }
        }
    }

    return sentences.join(' ');
}

/**
 * 添加人性化小技巧
 */
export function addHumanQuirks(text: string): string {
    let result = text;

    // 在段落开头随机添加自然过渡词（10%概率）
    const paragraphs = result.split('\n\n');
    const transitionWords = ['Look,', 'Listen,', 'Here\'s the thing:', 'Okay,', 'Now,'];

    for (let i = 1; i < paragraphs.length; i++) {
        if (Math.random() < 0.1) {
            const word = transitionWords[Math.floor(Math.random() * transitionWords.length)];
            paragraphs[i] = `${word} ${paragraphs[i]}`;
        }
    }

    result = paragraphs.join('\n\n');

    // 偶尔添加强调破折号（5%概率替换逗号）
    result = result.replace(/,\s+([a-z]+ing|when|if|but)\s+/gi, (match) => {
        return Math.random() < 0.05 ? match.replace(',', '—') : match;
    });

    // 偶尔添加括号式旁白（3%概率）
    const sentences = result.split(/([.!?]+\s+)/);
    for (let i = 0; i < sentences.length; i += 2) {
        if (Math.random() < 0.03 && sentences[i].length > 50) {
            // 在句中插入括号式说明
            const words = sentences[i].split(' ');
            if (words.length > 10) {
                const insertPos = Math.floor(words.length / 2);
                const asides = ['like this', 'for example', 'you know', 'obviously'];
                const aside = asides[Math.floor(Math.random() * asides.length)];
                words.splice(insertPos, 0, `(${aside})`);
                sentences[i] = words.join(' ');
            }
        }
    }
    result = sentences.join('');

    return result;
}

/**
 * 主函数：综合人性化处理
 */
export function humanizeContent(text: string): HumanizationResult {
    const original = text;

    // 按顺序应用各种转换
    let result = text;

    // 1. 移除AI套话（最重要）
    const beforeAI = result;
    result = removeAITells(result);
    const aiPhrasesRemoved = (beforeAI.match(/It'?s worth noting|Furthermore|Moreover/gi) || []).length;

    // 2. 添加缩写
    const beforeContractions = result;
    result = addContractions(result);
    const contractionsAdded = result.split("'").length - beforeContractions.split("'").length;

    // 3. 变化句长
    const beforeVariance = result;
    result = varySentenceLength(result);
    const sentencesModified = beforeVariance !== result ? 1 : 0;

    // 4. 添加人性化技巧
    result = addHumanQuirks(result);

    return {
        text: result,
        changes: {
            contractionsAdded,
            aiPhrasesRemoved,
            sentencesModified
        }
    };
}
