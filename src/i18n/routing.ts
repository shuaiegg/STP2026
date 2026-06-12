import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    // 支持的语言：英文为主站语言，中文为出海获客语言
    locales: ['en', 'zh'],

    // 英文在根路径（长期主站定位），中文使用 /zh 前缀
    defaultLocale: 'en',

    // 'as-needed': en 无前缀（/pricing），zh 强制前缀（/zh/pricing）
    localePrefix: 'as-needed',

    // 绝不自动按请求跳转语言（设计决策：用建议横幅，不强制）
    localeDetection: false,

    // 禁用 next-intl 自动写 NEXT_LOCALE cookie——middleware 写的 cookie 会合并进
    // 同请求的 cookies()，导致建议横幅误判"用户已手动选择过语言"而永不展示。
    // NEXT_LOCALE 仅由 LocaleSwitcher / 建议横幅在用户手动选择时写入。
    localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(value: string): value is Locale {
    return (routing.locales as readonly string[]).includes(value);
}
