import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    // 支持的语言：英文为主站语言，中文为出海获客语言
    locales: ['en', 'zh'],

    // 英文在根路径（长期主站定位），中文使用 /zh 前缀
    defaultLocale: 'en',

    // 'as-needed': en 无前缀（/pricing），zh 强制前缀（/zh/pricing）
    localePrefix: 'as-needed',

    // 绝不自动按请求跳转语言（设计决策：用建议横幅，不强制）
    // cookie 仅用于记住用户手动选择
    localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(value: string): value is Locale {
    return (routing.locales as readonly string[]).includes(value);
}
