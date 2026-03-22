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
        eeat: ScoreItem;
        valueDensity: ScoreItem;
        sentiment: ScoreItem;
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
        metrics: { length, keywordPosition: keywordIndex, text: title }
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
        metrics: { length, text: description }
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
 * 语言检测 (简单判断是否包含大量中文字符)
 */
function isChineseContent(content: string): boolean {
    const chineseChars = content.match(/[\u4e00-\u9fa5]/g);
    if (!chineseChars) return false;
    // 如果中文字符占总字符数超过10%，则认为是中文内容
    return (chineseChars.length / content.length) > 0.1;
}

/**
 * 评估可读性
 */
export function evaluateReadability(content: string): ScoreItem {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const isChinese = isChineseContent(content);
    let avgSentenceLength = 0;
    let metrics: any = { isChinese };

    if (isChinese) {
        // 中文可读性简单评估
        const sentences = content.split(/[。！？\n]+/).filter(s => s.trim().length > 0);
        const chars = content.replace(/\s+/g, '').length;
        avgSentenceLength = sentences.length > 0 ? chars / sentences.length : 0;

        if (avgSentenceLength > 40) {
            score -= 15;
            issues.push(`平均句长过长：${Math.round(avgSentenceLength)}字符`);
            suggestions.push('将长句拆分为短句，提升中文阅读体验');
        } else if (avgSentenceLength < 10) {
            score -= 5;
            issues.push('句子过短，可能显得生硬');
            suggestions.push('适当合并部分短句');
        }
        metrics.avgSentenceLength = avgSentenceLength.toFixed(1);
    } else {
        // 英文 Flesch Reading Ease公式
        const sentences = content.split(/[.!?\n]+/).filter(s => s.trim());
        const words = content.split(/\s+/).filter(w => w.trim());
        const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

        avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
        const avgSyllablesPerWord = words.length > 0 ? syllables / words.length : 0;
        const fleschScore = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

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

        if (avgSentenceLength > 25) {
            score -= 10;
            issues.push(`平均句长过长：${avgSentenceLength.toFixed(1)}词`);
            suggestions.push('将长句拆分为短句');
        }

        metrics.fleschScore = Math.round(fleschScore);
        metrics.avgSentenceLength = avgSentenceLength.toFixed(1);
        metrics.avgSyllablesPerWord = avgSyllablesPerWord.toFixed(2);
    }

    // 段落长度拦截 (Wall of Text Penalty)
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    let longParagraphsCount = 0;
    paragraphs.forEach(p => {
        const wordsOrChars = isChinese ? p.replace(/\s+/g, '').length : p.split(/\s+/).length;
        if ((isChinese && wordsOrChars > 300) || (!isChinese && wordsOrChars > 150)) {
            longParagraphsCount++;
        }
    });

    if (longParagraphsCount > 0) {
        score -= Math.min(15, longParagraphsCount * 5); // 最多扣15分
        issues.push(`存在 ${longParagraphsCount} 个超长段落 (Wall of Text)`);
        suggestions.push('将超长段落拆分成短段落，提升移动端阅读体验');
    }

    return {
        score: Math.max(0, score),
        weight: 0.15,
        status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'needs-improvement' : 'critical',
        issues,
        suggestions,
        metrics
    };
}

/**
 * 评估关键词使用 (包含 LSI 关键词分析)
 */
export function evaluateKeywordUsage(content: string, keyword: string, title: string, relatedTopics: string[] = []): ScoreItem {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 获取纯文本（移除 Markdown 符号进行更准的统计）
    const plainText = content.replace(/[*_#`\[\]]/g, ' ');
    const isChinese = isChineseContent(plainText);

    // 密度检查（2-3%理想）
    const wordCount = isChinese ? plainText.replace(/\s+/g, '').length : plainText.split(/\s+/).length;
    // 使用正则时注意处理可能的正则特殊字符
    const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keywordCount = (plainText.match(new RegExp(safeKeyword, 'gi')) || []).length;

    // 中文计算密度时，如果关键词很长，占比会失真，但这里使用简单的次数*长度估算
    const keywordCharLength = isChinese ? keyword.length : 1;
    const density = wordCount > 0 ? ((keywordCount * keywordCharLength) / wordCount) * 100 : 0;

    if (density < 0.5) {
        score -= 20;
        issues.push(`主关键词密度过低：${density.toFixed(2)}%`);
        suggestions.push(`增加关键词"${keyword}"的自然露出`);
    } else if (density > 5) {
        score -= 30;
        issues.push(`关键词堆砌风险：${density.toFixed(2)}%`);
        suggestions.push('减少主关键词重复，改用同义词 (LSI keywords)');
    }

    // 首段检查
    const firstParagraph = plainText.substring(0, plainText.indexOf('\n\n') || 250);
    const inFirstPara = firstParagraph.toLowerCase().includes(keyword.toLowerCase());
    if (!inFirstPara) {
        score -= 15;
        issues.push('首段未包含主关键词');
        suggestions.push('在开篇迅速点题，自然融入主关键词');
    }

    // H2标题中的使用
    const h2Count = (content.match(/^## .+$/gm) || []).length;
    const h2WithKeyword = (content.match(new RegExp(`^## .*${safeKeyword}.*$`, 'gmi')) || []).length;
    if (h2WithKeyword === 0 && h2Count > 0) {
        score -= 10;
        suggestions.push('尝试在至少一个 H2 标题中包含主关键词');
    }

    // LSI (相关维度/话题) 覆盖率检查
    let lsiCoverage = 0;
    let foundLsiCount = 0;
    if (relatedTopics && relatedTopics.length > 0) {
        const foundLSI = relatedTopics.filter(t => plainText.toLowerCase().includes(t.toLowerCase()));
        foundLsiCount = foundLSI.length;
        lsiCoverage = (foundLsiCount / Math.min(relatedTopics.length, 5)) * 100; // 最多考察5个核心长尾词

        if (lsiCoverage < 40) {
            score -= 10;
            issues.push(`语义相关词 (LSI) 覆盖率低: 只提到了 ${foundLsiCount} 个相关话题`);
            suggestions.push(`自然地融入这些相关话题语境: ${relatedTopics.slice(0, 3).join(', ')}`);
        } else {
            score += 5; // Semantic SEO 奖励分
        }
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        weight: 0.20,
        status: score >= 85 ? 'excellent' : score >= 65 ? 'good' : score >= 45 ? 'needs-improvement' : 'critical',
        issues,
        suggestions,
        metrics: {
            density: density.toFixed(2) + '%',
            count: keywordCount,
            inFirstParagraph: inFirstPara,
            lsiCoverageScore: lsiCoverage.toFixed(0) + '%'
        }
    };
}

/**
 * 评估精选摘要 (Featured Snippet) 准备程度 (V5 High Standard)
 * 检查问句标题后的段落是否提供了直接、简洁的答案
 */
export function evaluateSnippetReadiness(content: string): { score: number; count: number; issues: string[]; suggestions: string[] } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 搜索以问号结尾的 H2/H3
    const questionHeaderRegex = /^#{2,3}\s+(.*?[?？])$/gm;
    let match;
    let questionCount = 0;
    let goodAnswerCount = 0;

    while ((match = questionHeaderRegex.exec(content)) !== null) {
        questionCount++;
        const headerIndex = match.index;
        const remainingContent = content.substring(headerIndex + match[0].length).trim();
        const firstParagraph = remainingContent.split('\n\n')[0].trim();

        if (firstParagraph) {
            const wordCount = firstParagraph.split(/\s+/).length;
            const isDirect = /^(Yes,|No,|It is|They are|To|By|The)\b|\*\*/i.test(firstParagraph);

            // Google 偏好 40-60 词的答案片段 (英文) 或 100-150 左右的中文字
            const isChinese = isChineseContent(firstParagraph);
            const length = isChinese ? firstParagraph.length : wordCount;
            const idealMin = isChinese ? 80 : 40;
            const idealMax = isChinese ? 200 : 70;

            if (length >= idealMin && length <= idealMax && isDirect) {
                goodAnswerCount++;
            }
        }
    }

    if (questionCount === 0) {
        score = 0;
        suggestions.push('添加至少一个以问号结尾的 H2/H3 标题，并提供直接回答以争取 Featured Snippet');
    } else {
        const ratio = goodAnswerCount / questionCount;
        score = Math.round(ratio * 100);
        if (ratio < 0.5) {
            issues.push(`问答段落的“直接性”不足 (${goodAnswerCount}/${questionCount})`);
            suggestions.push('确保问题标题后的第一段话直接回答问题，并保持在 40-70 词之间');
        }
    }

    return { score, count: questionCount, issues, suggestions };
}

/**
 * 评估结构完整性 & 排版丰富度 (Formatting Variety)
 */
export function evaluateStructure(content: string, images: any[], keyword: string = ''): ScoreItem {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // H1、H2 检查
    const h1Count = (content.match(/^# .+$/gm) || []).length;
    const h2Count = (content.match(/^## .+$/gm) || []).length;
    const h3Count = (content.match(/^### .+$/gm) || []).length;

    // 强制层级验证
    const headers = [...content.matchAll(/^(#{1,6})\s+(.+)$/gm)].map(m => m[1].length);
    let hasHierarchyIssue = false;
    for (let i = 1; i < headers.length; i++) {
        if (headers[i] - headers[i - 1] > 1) {
            hasHierarchyIssue = true;
            break;
        }
    }

    if (h1Count === 0) {
        score -= 30;
        issues.push('缺少主标题 (H1)');
        suggestions.push('添加一个唯一的 H1 标题');
    } else if (h1Count > 1) {
        score -= 15;
        issues.push(`H1标题过多：${h1Count}个`);
        suggestions.push('保留唯一的 H1 主标题，其余降级为 H2');
    }

    if (h2Count < 2) {
        score -= 15;
        issues.push(`内容结构单薄，仅有 ${h2Count} 个 H2`);
        suggestions.push('增加 H2 子标题来划分核心章节');
    }

    if (hasHierarchyIssue) {
        score -= 10;
        issues.push('标题层级断层 (Heading Hierarchy Error)');
        suggestions.push('修复标题跳级问题，例如避免从 H2 跳过 H3 直接使用 H4');
    }

    // 排版丰富度审计 (Formatting Variety)
    const hasBold = /\*\*(.*?)\*\*/.test(content);
    const hasItalic = /\*(.*?)\*/.test(content) || /_(.*?)_/.test(content);
    const hasLists = /^[-*•]\s+/gm.test(content) || /^\d+\.\s+/gm.test(content);
    const hasBlockquote = /^>\s+/gm.test(content);

    let formattingBonus = 0;
    if (!hasLists) {
        score -= 10;
        suggestions.push('添加无序或有序列表以提升可扫描性');
    }
    if (!hasBold) {
        score -= 5;
        suggestions.push('尝试使用加粗 (**bold**) 来突出核心概念或结论');
    } else {
        formattingBonus += 2;
    }
    if (hasBlockquote) formattingBonus += 3;

    // 图片检查
    const wordCount = content.split(/\s+/).length;
    const recommendedImages = Math.max(1, Math.ceil(wordCount / 600));
    if (images.length < recommendedImages && images.length > 0) {
        score -= 5;
        suggestions.push(`还可以再丰富一些配图（当前 ${images.length} 张，建议 ${recommendedImages} 张）`);
    } else if (images.length === 0) {
        // Let evaluateImages handle the 0 image case entirely to avoid double strict penalization
        suggestions.push('强烈建议配图以消除文本疲劳感');
    }

    // V5: Snippet Readiness 集成
    const snippetAudit = evaluateSnippetReadiness(content);
    if (snippetAudit.score < 50 && snippetAudit.count > 0) {
        score -= 10;
        issues.push(...snippetAudit.issues);
        suggestions.push(...snippetAudit.suggestions);
    } else if (snippetAudit.score >= 80) {
        formattingBonus += 5; // Snippet 准备充分奖励
    }

    // V5: Intent Alignment 检查 (基础版)
    const isGuide = /how to|guide|tutorial|教程|指南|如何/i.test(keyword);
    const hasNumberedList = /^\d+\.\s+/m.test(content);
    if (isGuide && !hasNumberedList) {
        score -= 10;
        issues.push('指南类内容缺少步骤列表 (Numbered List)');
        suggestions.push('将操作流程转化为数字列表，更符合用户搜索“如何做”的意图');
    }

    return {
        score: Math.min(100, Math.max(0, score + formattingBonus)),
        weight: 0.20,
        status: score >= 85 ? 'excellent' : score >= 65 ? 'good' : score >= 45 ? 'needs-improvement' : 'critical',
        issues,
        suggestions,
        metrics: {
            h1Count,
            h2Count,
            h3Count,
            hasLists: hasLists ? 'Yes' : 'No',
            hasEmphasis: hasBold ? 'Yes' : 'No',
            snippetScore: `${snippetAudit.score}%`
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
        score -= 20;
        issues.push('文章中没有嵌入图片');
        suggestions.push('添加高质量配图以降低跳出率');
    } else {
        const withoutAlt = images.filter(img => !img.alt || img.alt.trim() === '').length;
        if (withoutAlt > 0) {
            score -= (withoutAlt * 10);
            issues.push(`${withoutAlt} 张图片缺失 Alt 文本`);
            suggestions.push('为所有图片补充描述性 Alt 文本');
        }

        const withKeyword = images.filter(img =>
            img.alt && img.alt.toLowerCase().includes(keyword.toLowerCase())
        ).length;

        if (withKeyword === 0 && images.length > 0) {
            score -= 5;
            suggestions.push(`至少在一张图片的 Alt 中融入焦点词 "${keyword}"`);
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
            withValidAlt: images.filter(img => img.alt && img.alt.trim() !== '').length
        }
    };
}

/**
 * 计算 GEO (Generative Engine Optimization) 分数
 * 融入进阶高分规则：实体挖掘、外部引用(Citations)、Q&A片段提取、反营销排雷。
 */
export function calculateGEOScore(content: string, entities: string[] = [], topics: string[] = []): ScoreItem {
    let score = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];

    // 1. 实体覆盖率与密度检查 (Entity Coverage & Density) - V5 High Standard
    const plainText = content.replace(/[*_#`\[\]]/g, ' ');
    const isChinese = isChineseContent(plainText);
    const wordCount = isChinese ? plainText.replace(/\s+/g, '').length : plainText.split(/\s+/).length;

    let foundCount = 0;
    if (entities.length > 0) {
        entities.forEach(entity => {
            if (content.toLowerCase().includes(entity.toLowerCase())) {
                foundCount++;
            }
        });

        // 实体密度 (每100词/字符的活跃实体数)
        const entityDensity = (foundCount / (wordCount / (isChinese ? 300 : 100)));
        if (entityDensity < 1.5) {
            score -= 10;
            issues.push(`实体密度较低 (当前: ${entityDensity.toFixed(1)} 实体/100词)`);
            suggestions.push('增加行业名词、具体地点或专业实体的提及频率，强化“专家身份” (E-E-A-T)');
        } else if (entityDensity > 5) {
            score += 5; // 实体丰富度奖励
        }
    }

    // 2. 引言与外部链接权重审计 (Citation Authority) - V5 High Standard
    const hasData = /\d+(?:\.\d+)?%|\d+\s*(?:million|billion|k\b)/i.test(content);
    const externalLinks = content.match(/\[.*?\]\((https?:\/\/[^)]+)\)/g) || [];
    const externalLinksCount = externalLinks.length;

    let authorityBonus = 0;
    const highAuthorityTLDs = ['.gov', '.edu', '.org'];
    const highAuthorityDomains = ['wikipedia.org', 'nytimes.com', 'reuters.com', 'bloomberg.com', 'forbes.com', 'bbc.com', 'wsj.com', 'hbr.org', 'nature.com'];

    externalLinks.forEach(link => {
        const urlMatch = link.match(/\((https?:\/\/[^)]+)\)/);
        if (urlMatch) {
            const url = urlMatch[1].toLowerCase();
            const isHighTLD = highAuthorityTLDs.some(tld => url.includes(tld));
            const isHighDomain = highAuthorityDomains.some(domain => url.includes(domain));
            if (isHighTLD || isHighDomain) {
                authorityBonus += 5;
            }
        }
    });

    if (!hasData) {
        score -= 10;
        issues.push('缺乏客观的量化数据支持');
        suggestions.push('插入具体数字（百分比、统计数据），提升 AI 引擎的信任分');
    }

    if (externalLinksCount === 0) {
        score -= 15;
        issues.push('无外部权威引用 (Citations)');
        suggestions.push('引用一到两个权威来源（如行业百科、新闻源或政府报告）来背书');
    } else {
        score += Math.min(10, authorityBonus + externalLinksCount);
    }

    // 3. Q&A 结构探测 (Direct Answer Snippets)
    const questionHeaders = (content.match(/^#{2,3}\s+.*?[?？]$/gm) || []).length;
    if (questionHeaders > 0) {
        score += 5;
    } else {
        score -= 10;
        suggestions.push('尝试将部分 H2/H3 设为提问形式，有助于被 AI 引擎提取为直接答案片段');
    }

    // 4. 结构化程度 (Bullet points / Tables)
    const hasLists = content.includes('- ') || content.includes('* ') || /^\d+\.\s/m.test(content);
    const hasTables = content.includes('|');
    if (!hasLists) {
        score -= 10;
    }
    if (!hasTables) {
        score -= 5;
        suggestions.push('添加一个核心对比表格 (Markdown Table)，AI 引擎极度偏好表格化的数据总结');
    }

    // 5. 客观语调审计 (Promotional Language Penalty)
    const promoWordsRegex = /(?:best ever|revolutionary|buy now|absolute best|guaranteed to|miracle|click here|破局|最强|第一|颠覆|秒杀)/gi;
    const promoMatches = content.match(promoWordsRegex) || [];
    if (promoMatches.length > 3) {
        score -= (promoMatches.length * 5);
        issues.push(`侦测到过多主观营销词汇 (${promoMatches.length} 处)`);
        suggestions.push('使用更加中立、客观的第三方语气，减少极端修饰词');
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        weight: 1,
        status: score >= 85 ? 'excellent' : score >= 65 ? 'good' : score >= 45 ? 'needs-improvement' : 'critical',
        issues,
        suggestions,
        metrics: {
            citations: externalLinksCount,
            hasData,
            entityFound: foundCount,
            promoWords: promoMatches.length,
            authorityBonus: `+${authorityBonus}`
        }
    };
}

/**
 * 评估 EEAT (Experience, Expertise, Authoritativeness, Trustworthiness)
 * V5 Advanced: 侧重于识别“第一人称经验”和“专业背书”
 */
export function calculateEEATScore(content: string, authorName: string = ''): ScoreItem {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 80; // 基础分

    // 1. 经验检测 (Experience - 核心 GEO 权重)
    // 搜索“我测试过”、“在我们的实验中”等第一人称行动词
    const experienceRegex = /(?:in my testing|I tested|we discovered|after analyzing|based on our research|经过我们的测试|实际测试发现|在我的实践中|笔者认为)/gi;
    const expMatches = content.match(experienceRegex) || [];
    if (expMatches.length >= 2) {
        score += 15;
    } else {
        score -= 10;
        suggestions.push('增加第一人称的“实操经验”描述（如“经过测试发现”），提升 GEO 引擎的信任分');
    }

    // 2. 权威背景词 (Expertise)
    const expertiseWords = /(?:expert|certified|professional|years of experience|specialist|权威|认证|资深|多年经验)/gi;
    if (expertiseWords.test(content) || (authorName && authorName !== 'ScaleToTop')) {
        score += 5;
    } else {
        suggestions.push('提及作者的专业资质或相关领域的从业经验');
    }

    // 3. 信任信号 (Trust - 外部引用已在 calculateGEOScore 处理，此处侧重免责或更新时间)
    const trustSignals = /(?:disclaimer|updated as of|last verified|免责声明|版本更新于|数据截止至)/gi;
    if (trustSignals.test(content)) {
        score += 5;
    } else {
        suggestions.push('添加内容更新时间或免责声明等信任信号');
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        weight: 0.1,
        status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'needs-improvement' : 'critical',
        issues,
        suggestions,
        metrics: { experienceSignals: expMatches.length }
    };
}

/**
 * 评估信息价值密度 (Value Density)
 * 检查“废话率”和“干货输出率”
 */
export function calculateValueDensity(content: string): ScoreItem {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const isChinese = isChineseContent(content);
    const wordCount = isChinese ? content.replace(/\s+/g, '').length : content.split(/\s+/).length;

    // 1. 结构化元素密度 (核心观点包装)
    const lists = (content.match(/^[-*•]\s+|^\d+\.\s+/gm) || []).length;
    const tables = (content.match(/\|/g) || []).length / 3; // 估算行数
    const bolds = (content.match(/\*\*(.*?)\*\*/g) || []).length;

    const pointDensity = ((lists + tables + bolds) / (wordCount / 500)) * 10;
    if (pointDensity < 15) {
        score -= 20;
        issues.push(`信息承载密度较低 (WPKT: ${pointDensity.toFixed(1)})`);
        suggestions.push('使用更多列表、表格和加粗关键词来浓缩核心观点，减少大段铺垫');
    }

    // 2. 废话/套话检测 (Filler detection)
    const fillerRegex = /(?:it is important to note that|as we have seen|as mentioned before|generally speaking|可以说是|从某种意义上说|不得不说|众所周知)/gi;
    const fillers = (content.match(fillerRegex) || []).length;
    if (fillers > (wordCount / 200)) {
        score -= Math.min(30, fillers * 5);
        issues.push(`侦测到过多过渡套话 (${fillers} 处)`);
        suggestions.push('删减“综上所述”、“众所周知”等无其实际含义的填充词');
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        weight: 0.1,
        status: score >= 85 ? 'excellent' : score >= 65 ? 'good' : score >= 45 ? 'needs-improvement' : 'critical',
        issues,
        suggestions,
        metrics: { pointDensity: pointDensity.toFixed(1), fillerCount: fillers }
    };
}

/**
 * 评估情感与偏见 (Sentiment & Bias)
 * 检查内容是否过于主观或含有偏激词汇
 */
export function calculateSentimentScore(content: string): ScoreItem {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 1. 极端/夸张词汇检测 (Hyperbole detection)
    const biasRegex = /(?:absolute best|revolutionary|miracle|guaranteed|unbelievable|must buy|life-changing|最强|第一|颠覆|神级|必须买|唯一)/gi;
    const biasMatches = content.match(biasRegex) || [];
    if (biasMatches.length > 3) {
        score -= (biasMatches.length * 5);
        issues.push(`侦测到过多主观夸张词汇 (${biasMatches.length} 处)`);
        suggestions.push('使用更加中立、客观的第三方语气，减少极端修饰词以提升 GEO 信任度');
    }

    // 2. 情感色彩平衡 (基本判断)
    const positiveWords = /(?:great|excellent|amazing|good|positive|优势|优点|提升)/gi;
    const negativeWords = /(?:bad|poor|awful|issue|problem|negative|缺点|问题|风险)/gi;
    const posCount = (content.match(positiveWords) || []).length;
    const negCount = (content.match(negativeWords) || []).length;

    if (posCount > 0 && negCount === 0) {
        score -= 10;
        suggestions.push('考虑加入适当的“局限性”或“风险提示”分析，使内容显得更客观、全面');
    }

    return {
        score: Math.min(100, Math.max(0, score)),
        weight: 0.05,
        status: score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 50 ? 'needs-improvement' : 'critical',
        issues,
        suggestions,
        metrics: { biasWords: biasMatches.length, posNegRatio: negCount === 0 ? posCount : (posCount / negCount).toFixed(1) }
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
    images: any[] = [],
    relatedTopics: string[] = [],
    authorName: string = ''
): DetailedSEOScore {
    const titleScore = evaluateTitle(title, keyword);
    const descScore = evaluateDescription(description, keyword);
    const keywordScore = evaluateKeywordUsage(content, keyword, title, relatedTopics);
    const readabilityScore = evaluateReadability(content);
    const structureScore = evaluateStructure(content, images, keyword);
    const imagesScore = evaluateImages(images, keyword);
    const eeatScore = calculateEEATScore(content, authorName);
    const valueDensityScore = calculateValueDensity(content);
    const sentimentScore = calculateSentimentScore(content);

    // 加权计算总分 (调整权重分配)
    const overall = Math.round(
        titleScore.score * 0.15 +
        descScore.score * 0.10 +
        keywordScore.score * 0.20 +
        readabilityScore.score * 0.10 +
        structureScore.score * 0.15 +
        imagesScore.score * 0.05 +
        eeatScore.score * 0.10 +
        valueDensityScore.score * 0.10 +
        sentimentScore.score * 0.05
    );

    return {
        overall,
        breakdown: {
            title: titleScore,
            description: descScore,
            keywords: keywordScore,
            readability: readabilityScore,
            structure: structureScore,
            images: imagesScore,
            eeat: eeatScore,
            valueDensity: valueDensityScore,
            sentiment: sentimentScore
        }
    };
}

