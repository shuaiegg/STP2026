import { type Locale } from '@/i18n/routing';

/**
 * 按语言控制页面可见性（设计决策 5）
 *
 * 缺省 = 两种语言都可用。
 * 仅需显式列出有语言限制的页面路径。
 *
 * 三条 SEO 纪律：
 * 1. sitemap 按语言生成，中文独有页绝不出现在英文 sitemap
 * 2. hreflang 只在对应版本真实存在时输出
 * 3. 语言切换器在目标语言无对应版本时跳目标语言首页
 */
const PAGE_LOCALES: Record<string, Locale[]> = {
    '/case-studies': ['zh'],      // 案例拆解：目前仅中文
    // '/consultation': ['zh', 'en'], // 咨询：双语可用（缺省，无需显式声明）
};

/**
 * 检查指定路径是否对当前 locale 可用
 * @returns true 表示可用，false 表示应 notFound()
 */
export function isPageAvailable(pathname: string, locale: Locale): boolean {
    const allowedLocales = PAGE_LOCALES[pathname];
    if (!allowedLocales) return true; // 缺省：所有语言都可用
    return allowedLocales.includes(locale);
}

/**
 * 获取指定路径支持的所有 locale
 * @returns Locale[]
 */
export function getPageLocales(pathname: string): Locale[] {
    return PAGE_LOCALES[pathname] ?? (['en', 'zh'] as Locale[]);
}

/**
 * 获取所有有限制的路由配置（供 sitemap/导航过滤使用）
 */
export function getRestrictedPages(): Record<string, Locale[]> {
    return { ...PAGE_LOCALES };
}
