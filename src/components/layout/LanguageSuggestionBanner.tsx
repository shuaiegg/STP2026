"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { LOCALE_COOKIE, type Locale } from '@/i18n/routing';
import { isPageAvailable } from '@/lib/i18n/page-availability';
import posthog from 'posthog-js';

interface Props {
    target: Locale;
    suggestion: string;
    switchLabel: string;
    dismissLabel: string;
}

function writeLocaleCookie(locale: string) {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * 语言建议横幅：仅展示建议，绝不自动跳转。
 * 切换或关闭都会写 NEXT_LOCALE cookie，此后不再打扰。
 */
export function LanguageSuggestionBanner({ target, suggestion, switchLabel, dismissLabel }: Props) {
    const [visible, setVisible] = useState(true);
    const currentLocale = useLocale();
    const pathname = usePathname();

    if (!visible) return null;

    // 目标语言无对应版本时跳目标语言首页
    const targetHref = isPageAvailable(pathname, target) ? pathname : '/';

    return (
        <div className="bg-brand-primary text-white text-sm" role="region" aria-label={suggestion}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-4 flex-wrap">
                <span>{suggestion}</span>
                <Link
                    href={targetHref}
                    locale={target}
                    onClick={() => {
                        writeLocaleCookie(target);
                        posthog.capture('language_banner_switched', { from: currentLocale, to: target });
                    }}
                    className="font-bold underline underline-offset-4 text-brand-secondary hover:opacity-80 transition-opacity"
                >
                    {switchLabel}
                </Link>
                <button
                    type="button"
                    onClick={() => {
                        writeLocaleCookie(currentLocale);
                        setVisible(false);
                        posthog.capture('language_banner_dismissed', { locale: currentLocale, suggested: target });
                    }}
                    className="inline-flex items-center gap-1 text-white/70 hover:text-white transition-colors"
                >
                    <X size={14} aria-hidden="true" /> {dismissLabel}
                </button>
            </div>
        </div>
    );
}
