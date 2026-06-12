const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.scaletotop.com';

/**
 * 按 locale 生成 canonical URL（en 根路径，zh 带 /zh 前缀）
 * localeCanonical('zh', '/pricing') → https://.../zh/pricing
 * localeCanonical('en', '/pricing') → https://.../pricing
 */
export function localeCanonical(locale: string, path: string = ''): string {
    const prefix = locale === 'zh' ? '/zh' : '';
    return `${BASE_URL}${prefix}${path}` || BASE_URL;
}

export { BASE_URL };
