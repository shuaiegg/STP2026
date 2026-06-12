import { headers, cookies } from 'next/headers';
import { getLocale, getTranslations } from 'next-intl/server';
import { MainLayout } from "@/components/layout/MainLayout";
import { LanguageSuggestionBanner } from "@/components/layout/LanguageSuggestionBanner";
import { LOCALE_COOKIE, type Locale } from '@/i18n/routing';

/**
 * 语言建议（设计决策 2）：
 * - 信号用 Accept-Language（浏览器语言），绝不用 IP——中文买家是人在海外的出海创业者
 * - 仅在浏览器偏好 ≠ 当前 locale 且用户从未手动选择过语言（无 cookie）时展示
 * - 横幅文案使用目标语言的 messages
 */
async function getLanguageSuggestion(currentLocale: string) {
    const cookieStore = await cookies();
    if (cookieStore.get(LOCALE_COOKIE)) return null;

    const headerStore = await headers();
    const acceptLanguage = headerStore.get('accept-language') ?? '';
    const prefersZh = /(^|,)\s*zh\b/i.test(acceptLanguage);
    const preferred: Locale = prefersZh ? 'zh' : 'en';
    if (preferred === currentLocale) return null;

    const t = await getTranslations({ locale: preferred, namespace: 'banner' });
    return {
        target: preferred,
        suggestion: t('suggestion'),
        switchLabel: t('switch'),
        dismissLabel: t('dismiss'),
    };
}

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const locale = await getLocale();
    const suggestion = await getLanguageSuggestion(locale);

    return (
        <>
            {suggestion && <LanguageSuggestionBanner {...suggestion} />}
            <MainLayout>{children}</MainLayout>
        </>
    );
}
