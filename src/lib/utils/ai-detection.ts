/**
 * AI内容检测工具
 * 检测文本中的AI写作特征并评分
 */

export interface AIDetectionFlag {
    pattern: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
}

export interface AIDetectionResult {
    score: number; // 0-100, 越高越像AI
    confidence: 'low' | 'medium' | 'high';
    flags: AIDetectionFlag[];
    suggestions: string[];
}

/**
 * AI套话检测模式
 */
const AI_TELL_PATTERNS = [
    { pattern: /It'?s worth noting/gi, severity: 'high' as const, weight: 8, description: '"It\'s worth noting" - 典型AI用语' },
    { pattern: /It'?s important to (note|understand|remember)/gi, severity: 'high' as const, weight: 8, description: '"It\'s important to note" - AI标志' },
    { pattern: /\bdelve into\b/gi, severity: 'high' as const, weight: 10, description: '"delve into" - AI最爱用词' },
    { pattern: /\bdive deep(er)? into\b/gi, severity: 'high' as const, weight: 8, description: '"dive deep into" - AI常用' },
    { pattern: /\bFurthermore,/gi, severity: 'medium' as const, weight: 5, description: '过度正式的连接词' },
    { pattern: /\bMoreover,/gi, severity: 'medium' as const, weight: 5, description: '过度正式的连接词' },
    { pattern: /\bNevertheless,/gi, severity: 'medium' as const, weight: 5, description: '过度正式的连接词' },
    { pattern: /In conclusion,/gi, severity: 'medium' as const, weight: 6, description: '明显的总结标志' },
    { pattern: /To sum up,/gi, severity: 'medium' as const, weight: 6, description: '明显的总结标志' },
    { pattern: /At the end of the day,/gi, severity: 'medium' as const, weight: 7, description: 'AI陈词滥调' },
];

/**
 * 计算句长变异系数
 */
function calculateSentenceLengthVariance(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    if (sentences.length < 3) return 1; // 句子太少，假设正常

    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    const standardDeviation = Math.sqrt(variance);

    // 变异系数 = 标准差 / 平均值
    return standardDeviation / mean;
}

/**
 * 计算缩写使用率
 */
function calculateContractionRate(text: string): number {
    const words = text.split(/\s+/).length;
    const contractions = (text.match(/\b\w+'\w+\b/g) || []).length;

    return contractions / words;
}

/**
 * 检测学术词汇密度
 */
function calculateAcademicWordDensity(text: string): number {
    const academicWords = [
        'furthermore', 'moreover', 'nevertheless', 'nonetheless',
        'subsequently', 'consequently', 'accordingly', 'thereby',
        'wherein', 'whereby', 'heretofore', 'henceforth',
        'utilize', 'facilitate', 'implement', 'leverage',
        'paradigm', 'methodology', 'framework', 'ecosystem'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const academicCount = words.filter(word =>
        academicWords.includes(word.replace(/[.,!?]/g, ''))
    ).length;

    return academicCount / words.length;
}

/**
 * 检测完美语法（AI倾向于过于完美）
 */
function detectPerfectGrammar(text: string): boolean {
    // 检测是否有任何不完美的迹象
    const imperfections = [
        /\.\.\./,  // 省略号
        /—/,      // 破折号
        /\(/,     // 括号（用于旁白）
        /^(Look|Listen|Okay|Now),/im, // 口语化开头
    ];

    return !imperfections.some(pattern => pattern.test(text));
}

/**
 * 主检测函数
 */
export function detectAIPatterns(text: string): AIDetectionResult {
    const flags: AIDetectionFlag[] = [];
    let totalScore = 0;

    // 1. 检测AI套话
    AI_TELL_PATTERNS.forEach(({ pattern, severity, weight, description }) => {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
            flags.push({
                pattern: pattern.source,
                count: matches.length,
                severity,
                description
            });
            totalScore += matches.length * weight;
        }
    });

    // 2. 检测句长变异系数
    const sentenceCV = calculateSentenceLengthVariance(text);
    if (sentenceCV < 0.3) {
        flags.push({
            pattern: 'uniform_sentence_length',
            count: 1,
            severity: 'high',
            description: `句长过于均匀 (变异系数: ${sentenceCV.toFixed(2)})`
        });
        totalScore += 15;
    }

    // 3. 检测缩写率
    const contractionRate = calculateContractionRate(text);
    if (contractionRate < 0.03) {
        flags.push({
            pattern: 'low_contraction_rate',
            count: 1,
            severity: 'high',
            description: `缩写使用过少 (${(contractionRate * 100).toFixed(1)}%)`
        });
        totalScore += 12;
    }

    // 4. 检测学术词汇密度
    const academicDensity = calculateAcademicWordDensity(text);
    if (academicDensity > 0.05) {
        flags.push({
            pattern: 'high_academic_density',
            count: 1,
            severity: 'medium',
            description: `学术词汇过多 (${(academicDensity * 100).toFixed(1)}%)`
        });
        totalScore += 8;
    }

    // 5. 检测过于完美的语法
    if (detectPerfectGrammar(text)) {
        flags.push({
            pattern: 'perfect_grammar',
            count: 1,
            severity: 'low',
            description: '语法过于完美，缺少人类写作的小瑕疵'
        });
        totalScore += 5;
    }

    // 计算最终分数（0-100）
    const finalScore = Math.min(100, totalScore);

    // 确定置信度
    let confidence: 'low' | 'medium' | 'high';
    if (flags.length === 0) {
        confidence = 'low';
    } else if (flags.length <= 2) {
        confidence = 'medium';
    } else {
        confidence = 'high';
    }

    // 生成建议
    const suggestions: string[] = [];

    if (finalScore >= 40) {
        suggestions.push('内容AI特征明显，建议进一步人性化处理');
    }

    if (flags.some(f => f.pattern.includes('AI_tell'))) {
        suggestions.push('移除AI套话，使用更自然的表达');
    }

    if (contractionRate < 0.03) {
        suggestions.push('增加缩写使用（don\'t, can\'t, it\'s等）');
    }

    if (sentenceCV < 0.3) {
        suggestions.push('增加句子长度变化，避免机械感');
    }

    if (academicDensity > 0.05) {
        suggestions.push('减少学术词汇，使用更日常的表达');
    }

    if (finalScore < 20) {
        suggestions.push('✅ 内容人性化程度良好！');
    }

    return {
        score: finalScore,
        confidence,
        flags,
        suggestions
    };
}

/**
 * 简化版检测（仅返回分数）
 */
export function getAIScore(text: string): number {
    return detectAIPatterns(text).score;
}

/**
 * 计算人类真实度分数 (0-100)
 * 100 = 完全像人类
 * 0 = 完全像AI
 */
export function calculateHumanScore(text: string): number {
    return 100 - getAIScore(text);
}
