/**
 * 生成"输出语言"指令，追加到 AI prompt 末尾，让面向用户的生成内容
 * （标题/描述/主题/摘要/标签等）使用用户的界面语言。
 *
 * 注意：这是"工具与用户对话的语言"，与文章实际撰写的目标市场语言（如 PlannedArticle.language）
 * 是不同维度——后者仍由 AI 按目标受众推断。
 */
export function localeDirective(locale?: string): string {
    return locale === 'en'
        ? '\n\nIMPORTANT OUTPUT LANGUAGE: Write ALL human-readable fields (titles, descriptions, themes, summaries, topics, labels) in natural, native English.'
        : '\n\n重要输出语言要求：所有面向用户的字段（标题、描述、主题、摘要、话题、标签）必须使用自然、地道的简体中文。';
}
