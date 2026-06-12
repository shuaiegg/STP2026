const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.scaletotop.com';

import { getPageLocales } from '@/lib/i18n/page-availability';

/**
 * 按 locale 生成 canonical URL（en 根路径，zh 带 /zh 前缀）
 * localeCanonical('zh', '/pricing') → https://.../zh/pricing
 * localeCanonical('en', '/pricing') → https://.../pricing
 */
export function localeCanonical(locale: string, path: string = ''): string {
    const prefix = locale === 'zh' ? '/zh' : '';
    return `${BASE_URL}${prefix}${path}` || BASE_URL;
}

/**
 * 依据页面可见性配置，动态生成 alternates.languages 映射（包括 x-default）
 * getMetadataAlternates('/pricing') → { en: '...', zh: '...', 'x-default': '...' }
 */
export function getMetadataAlternates(path: string = ''): Record<string, string> {
    const locales = getPageLocales(path);
    const languages: Record<string, string> = {};

    locales.forEach(loc => {
        const prefix = loc === 'zh' ? '/zh' : '';
        languages[loc] = `${BASE_URL}${prefix}${path}`;
    });

    if (locales.includes('en')) {
        languages['x-default'] = `${BASE_URL}${path}`;
    } else if (locales.includes('zh')) {
        languages['x-default'] = `${BASE_URL}/zh${path}`;
    }

    return languages;
}

export { BASE_URL };
