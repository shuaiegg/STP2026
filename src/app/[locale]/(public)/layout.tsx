import { getTranslations } from 'next-intl/server';
import { MainLayout } from "@/components/layout/MainLayout";
import { LanguageSuggestionBanner, type BannerCopy } from "@/components/layout/LanguageSuggestionBanner";
import type { Locale } from '@/i18n/routing';

/**
 * 语言建议（设计决策 2）：横幅决策已移至客户端（读 navigator.language + cookie），
 * 因此本布局不再读 headers/cookies → 公共页可静态/ISR。
 * 这里仅静态注入两种语言的横幅文案。
 */
async function getBannerCopy(): Promise<Record<Locale, BannerCopy>> {
    const [zh, en] = await Promise.all([
        getTranslations({ locale: 'zh', namespace: 'banner' }),
        getTranslations({ locale: 'en', namespace: 'banner' }),
    ]);
    const build = (t: Awaited<ReturnType<typeof getTranslations>>): BannerCopy => ({
        suggestion: t('suggestion'),
        switch: t('switch'),
        dismiss: t('dismiss'),
    });
    return { zh: build(zh), en: build(en) };
}

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const copy = await getBannerCopy();

    return (
        <>
            <LanguageSuggestionBanner copy={copy} />
            <MainLayout>{children}</MainLayout>
        </>
    );
}
