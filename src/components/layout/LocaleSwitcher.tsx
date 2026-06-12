"use client";

import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { LOCALE_COOKIE, type Locale } from '@/i18n/routing';

const LOCALE_LABELS: Record<Locale, string> = {
    en: 'English',
    zh: '中文 (简体)',
};

// 手动切换语言时写 cookie，记住用户选择（建议横幅据此不再打扰）
function rememberLocale(locale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export const LocaleSwitcher: React.FC<{ className?: string }> = ({ className }) => {
    const locale = useLocale() as Locale;
    const pathname = usePathname();
    const target: Locale = locale === 'zh' ? 'en' : 'zh';

    return (
        <Link
            href={pathname}
            locale={target}
            onClick={() => rememberLocale(target)}
            className={className ?? 'hover:text-brand-primary transition-colors'}
        >
            {LOCALE_LABELS[target]}
        </Link>
    );
};
