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
    // 只看首选语言（最高优先级那一项）。无明确信号（空 / 既非 zh 也非 en）→ 不建议，
    // 避免在 /zh 上对没有英文偏好的访客误显 "Switch to English"。
    const primary = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? '';
    let preferred: Locale | null = null;
    if (primary.startsWith('zh')) preferred = 'zh';
    else if (primary.startsWith('en')) preferred = 'en';
    if (!preferred || preferred === currentLocale) return null;

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
