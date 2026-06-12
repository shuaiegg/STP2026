"use client";

import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { LOCALE_COOKIE, type Locale } from '@/i18n/routing';
import { isPageAvailable } from '@/lib/i18n/page-availability';

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
    // 目标语言无对应版本时跳目标语言首页（不切到 404）
    const targetHref = isPageAvailable(pathname, target) ? pathname : '/';

    return (
        <Link
            href={targetHref}
            locale={target}
            onClick={() => rememberLocale(target)}
            className={className ?? 'hover:text-brand-primary transition-colors'}
        >
            {LOCALE_LABELS[target]}
        </Link>
    );
};
