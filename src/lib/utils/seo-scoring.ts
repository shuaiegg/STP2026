/**
 * SEO Scoring System
 * Provides detailed, actionable SEO scoring with specific issues and suggestions
 */

export interface ScoreItem {
    score: number;           // 0-100
    weight: number;          // 权重 (如 0.2 = 20%)
    status: 'excellent' | 'good' | 'needs-improvement' | 'critical';
    issues: string[];        // 具体问题
    suggestions: string[];   // 改进建议
    metrics?: Record<string, any>;  // 具体指标
}

export interface DetailedSEOScore {
    overall: number;  // 总分
    breakdown: {
        title: ScoreItem;
        description: ScoreItem;
        keywords: ScoreItem;
        readability: ScoreItem;
        structure: ScoreItem;
        images: ScoreItem;
    };
}

/**
 * 评估标题优化程度
 */
export function evaluateTitle(title: string, keyword: string): ScoreItem {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 长度检查
    const length = title.length;
    if (length < 50) {
        score -= 15;
        issues.push(`标题过短：${length}字符（建议50-60）`);
        suggestions.push('增加修饰词或年份以扩展标题长度');
    } else if (length > 60) {
        score -= 10;
        issues.push(`标题过长：${length}字符（建议50-60）`);
        suggestions.push('精简标题，移除不必要的词汇');
    }

    // 关键词位置
    const keywordIndex = title.toLowerCase().indexOf(keyword.toLowerCase());
    if (keywordIndex === -1) {
        score -= 30;
        issues.push('标题中未包含主关键词');
        suggestions.push(`在标题开头插入关键词"${keyword}"`);
    } else if (keywordIndex > 20) {
        score -= 10;
        issues.push('关键词位置靠后');
        suggestions.push('将关键词移至标题前半部分');
    }

    // 年份检查
    const currentYear = new Date().getFullYear();
    if (!title.includes(String(currentYear))) {
        score -= 5;
        suggestions.push(`添加年份"${currentYear}"以提升时效性`);
    }

    // 数字检查（吸引眼球）
    if (!/\d+/.test(title)) {
        suggestions.push('考虑添加数字（如"7个技巧"、"2026指南"）');
    }

    return {
        score: Math.max(0, score),
        weight: 0.25,  // 25%权重
        status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs-improvement' : 'critical',
        issues,
        suggestions,
        metrics: { length, keywordPosition: keywordIndex }
    };
}

/**
 * 评估描述优化程度
 */
export function evaluateDescription(description: string, keyword: string): ScoreItem {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 长度检查
    const length = description.length;
    if (length < 120) {
        score -= 20;
        issues.push(`描述过短：${length}字符（建议120-160）`);
        suggestions.push('扩充描述，添加更多价值陈述');
    } else if (length > 160) {
        score -= 15;
        issues.push(`描述过长：${length}字符（建议120-160）`);
        suggestions.push('精简描述以避免被截断');
    }

    // 关键词检查
    if (!description.toLowerCase().includes(keyword.toLowerCase())) {
        score -= 25;
        issues.push('描述中未包含主关键词');
        suggestions.push(`在描述前100字符内包含"${keyword}"`);
    }

    // CTA检查
    const hasCTA = /点击|了解|查看|获取|下载|立即/.test(description);
    if (!hasCTA) {
        suggestions.push('添加行动号召（如"了解更多"、"立即查看"）');
    }

    return {
        score: Math.max(0, score),
        weight: 0.15,
        status: score >= 85 ? 'excellent' : score >= 65 ? 'good' : score >= 45 ? 'needs-improvement' : 'critical',
        issues,
        suggestions,
        metrics: { length }
    };
}

/**
 * 计算音节数（用于可读性分析）
 */
function countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
}

/**
 * 评估可读性
 */
export function evaluateReadability(content: string): ScoreItem {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const words = content.split(/\s+/).filter(w => w.trim());
    const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

    // Flesch Reading Ease公式
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    const fleschScore = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Flesch分数解读
    if (fleschScore < 30) {
        score -= 30;
        issues.push('内容难度过高，适合大学水平');
        suggestions.push('使用更简单的词汇和更短的句子');
    } else if (fleschScore < 50) {
        score -= 15;
        issues.push('内容难度较高');
        suggestions.push('简化部分复杂句子');
    } else if (fleschScore > 80) {
        score -= 10;
        issues.push('内容过于简单，可能缺乏深度');
        suggestions.push('适当增加专业术语和详细解释');
    }

    // 句长检查
    if (avgSentenceLength > 25) {
        score -= 10;
        issues.push(`平均句长过长：${avgSentenceLength.toFixed(1)}词`);
        suggestions.push('将长句拆分为短句');
    } else if (avgSentenceLength < 10) {
        score -= 5;
        issues.push('句子过短，可能显得生硬');
        suggestions.push('适当合并部分短句');
    }

    return {
        score: Math.max(0, score),
        weight: 0.15,
        status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-improvement' : 'critical',
        issues,
        suggestions,
        metrics: {
            fleschScore: Math.round(fleschScore),
            avgSentenceLength: avgSentenceLength.toFixed(1),
            avgSyllablesPerWord: avgSyllablesPerWord.toFixed(2)
        }
    };
}

/**
 * 评估关键词使用
 */
export function evaluateKeywordUsage(content: string, keyword: string, title: string): ScoreItem {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 密度检查（2-3%理想）
    const wordCount = content.split(/\s+/).length;
    const keywordCount = (content.match(new RegExp(keyword, 'gi')) || []).length;
    const density = (keywordCount / wordCount) * 100;

    if (density < 1) {
        score -= 20;
        issues.push(`关键词密度过低：${density.toFixed(2)}%`);
        suggestions.push(`增加关键词"${keyword}"的使用（目标2-3%）`);
    } else if (density > 4) {
        score -= 30;
        issues.push(`关键词堆砌风险：${density.toFixed(2)}%`);
        suggestions.push('减少关键词使用，避免过度优化');
    }

    // 首段检查
    const firstParagraph = content.substring(0, content.indexOf('\n\n') || 200);
    const inFirstPara = firstParagraph.toLowerCase().includes(keyword.toLowerCase());
    if (!inFirstPara) {
        score -= 15;
        issues.push('首段未包含关键词');
        suggestions.push('在开头段落中自然融入关键词');
    }

    // H2标题中的使用
    const h2Count = (content.match(/^## .+$/gm) || []).length;
    const h2WithKeyword = (content.match(new RegExp(`^## .*${keyword}.*$`, 'gmi')) || []).length;
    if (h2WithKeyword === 0 && h2Count > 0) {
        score -= 10;
        suggestions.push('在至少一个H2标题中包含关键词');
    }

    return {
        score: Math.max(0, score),
        weight: 0.20,
        status: score >= 85 ? 'excellent' : score >= 65 ? 'good' : score >= 45 ? 'needs-improvement' : 'critical',
        issues,
        suggestions,
        metrics: {
            density: density.toFixed(2) + '%',
            count: keywordCount,
            inFirstParagraph: inFirstPara,
            inHeadings: h2WithKeyword
        }
    };
}

/**
 * 评估结构完整性
 */
export function evaluateStructure(content: string, images: any[]): ScoreItem {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // H1检查
    const h1Count = (content.match(/^# .+$/gm) || []).length;
    if (h1Count === 0) {
        score -= 30;
        issues.push('缺少H1标题');
        suggestions.push('添加一个主H1标题');
    } else if (h1Count > 1) {
        score -= 20;
        issues.push(`H1标题过多：${h1Count}个`);
        suggestions.push('保留唯一的H1标题');
    }

    // H2检查
    const h2Count = (content.match(/^## .+$/gm) || []).length;
    if (h2Count < 3) {
        score -= 15;
        issues.push(`H2标题过少：${h2Count}个`);
        suggestions.push('增加H2标题以改善内容结构');
    }

    // 图片检查
    const wordCount = content.split(/\s+/).length;
    const recommendedImages = Math.ceil(wordCount / 500);  // 每500词1张图
    if (images.length < recommendedImages) {
        score -= 10;
        suggestions.push(`建议添加${recommendedImages - images.length}张图片（当前${images.length}张）`);
    }

    // Alt文本检查
    const imagesWithoutAlt = images.filter(img => !img.alt || img.alt.trim() === '').length;
    if (imagesWithoutAlt > 0) {
        score -= 15;
        issues.push(`${imagesWithoutAlt}张图片缺少Alt文本`);
        suggestions.push('为所有图片添加描述性Alt文本');
    }

    // 列表检查
    const hasLists = /^[-*•]\s+/gm.test(content) || /^\d+\.\s+/gm.test(content);
    if (!hasLists) {
        suggestions.push('考虑添加项目列表以提升可读性');
    }

    return {
        score: Math.max(0, score),
        weight: 0.20,
        status: score >= 85 ? 'excellent' : score >= 65 ? 'good' : score >= 45 ? 'needs-improvement' : 'critical',
        issues,
        suggestions,
        metrics: {
            h1Count,
            h2Count,
            imageCount: images.length,
            imagesWithAlt: images.length - imagesWithoutAlt
        }
    };
}

/**
 * 评估图片优化
 */
export function evaluateImages(images: any[], keyword: string): ScoreItem {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    if (images.length === 0) {
        score -= 30;
        issues.push('内容中没有图片');
        suggestions.push('添加相关图片以增强视觉吸引力');
    } else {
        // Alt文本检查（已在structure中检查，这里可以更详细）
        const withoutAlt = images.filter(img => !img.alt).length;
        if (withoutAlt > 0) {
            score -= 20;
            issues.push(`${withoutAlt}/${images.length} 图片缺少Alt文本`);
            suggestions.push('为所有图片添加包含关键词的Alt文本');
        }

        // Alt文本中是否包含关键词
        const withKeyword = images.filter(img =>
            img.alt && img.alt.toLowerCase().includes(keyword.toLowerCase())
        ).length;

        if (withKeyword === 0 && images.length > 0) {
            suggestions.push(`在至少一个图片的Alt文本中包含"${keyword}"`);
        }
    }

    return {
        score: Math.max(0, score),
        weight: 0.05,
        status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-improvement' : 'critical',
        issues,
        suggestions,
        metrics: {
            total: images.length,
            withAlt: images.filter(img => img.alt).length
        }
    };
}

/**
 * 计算详细的SEO评分
 */
export function calculateDetailedSEOScore(
    title: string,
    description: string,
    content: string,
    keyword: string,
    images: any[] = []
): DetailedSEOScore {
    const titleScore = evaluateTitle(title, keyword);
    const descScore = evaluateDescription(description, keyword);
    const keywordScore = evaluateKeywordUsage(content, keyword, title);
    const readabilityScore = evaluateReadability(content);
    const structureScore = evaluateStructure(content, images);
    const imagesScore = evaluateImages(images, keyword);

    // 加权计算总分
    const overall = Math.round(
        titleScore.score * titleScore.weight +
        descScore.score * descScore.weight +
        keywordScore.score * keywordScore.weight +
        readabilityScore.score * readabilityScore.weight +
        structureScore.score * structureScore.weight +
        imagesScore.score * imagesScore.weight
    );

    return {
        overall,
        breakdown: {
            title: titleScore,
            description: descScore,
            keywords: keywordScore,
            readability: readabilityScore,
            structure: structureScore,
            images: imagesScore
        }
    };
}
