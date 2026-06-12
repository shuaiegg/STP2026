import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }
    // 启用静态渲染（页面/布局内的 next-intl API 依赖此调用）
    setRequestLocale(locale);

    // messages 由 NextIntlClientProvider 自动从 request 配置继承
    return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
}
