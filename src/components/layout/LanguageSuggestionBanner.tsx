"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { LOCALE_COOKIE, type Locale } from '@/i18n/routing';
import { isPageAvailable } from '@/lib/i18n/page-availability';
import posthog from 'posthog-js';

export interface BannerCopy {
    suggestion: string;
    switch: string;
    dismiss: string;
}

interface Props {
    /** 两种语言的横幅文案（静态注入，避免布局读 headers/cookies）。 */
    copy: Record<Locale, BannerCopy>;
}

function writeLocaleCookie(locale: string) {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

function hasLocaleCookie() {
    return document.cookie.split('; ').some((c) => c.startsWith(`${LOCALE_COOKIE}=`));
}

/**
 * 语言建议横幅：仅展示建议，绝不自动跳转。
 * 决策全部在客户端进行（读 navigator.language + cookie），使公共页可静态/ISR。
 * - 信号用浏览器首选语言，绝不用 IP
 * - 仅在浏览器偏好 ≠ 当前 locale 且用户从未手动选过语言（无 cookie）时展示
 * 切换或关闭都会写 NEXT_LOCALE cookie，此后不再打扰。
 */
export function LanguageSuggestionBanner({ copy }: Props) {
    const currentLocale = useLocale() as Locale;
    const pathname = usePathname();
    const [target, setTarget] = useState<Locale | null>(null);

    useEffect(() => {
        if (hasLocaleCookie()) return;
        const primary = (navigator.language || '').trim().toLowerCase();
        let preferred: Locale | null = null;
        if (primary.startsWith('zh')) preferred = 'zh';
        else if (primary.startsWith('en')) preferred = 'en';
        if (preferred && preferred !== currentLocale) setTarget(preferred);
    }, [currentLocale]);

    if (!target) return null;

    const text = copy[target];
    // 目标语言无对应版本时跳目标语言首页
    const targetHref = isPageAvailable(pathname, target) ? pathname : '/';

    return (
        <div className="bg-brand-primary text-white text-sm" role="region" aria-label={text.suggestion}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-4 flex-wrap">
                <span>{text.suggestion}</span>
                <Link
                    href={targetHref}
                    locale={target}
                    onClick={() => {
                        writeLocaleCookie(target);
                        posthog.capture('language_banner_switched', { from: currentLocale, to: target });
                    }}
                    className="font-bold underline underline-offset-4 text-brand-secondary hover:opacity-80 transition-opacity"
                >
                    {text.switch}
                </Link>
                <button
                    type="button"
                    onClick={() => {
                        writeLocaleCookie(currentLocale);
                        setTarget(null);
                        posthog.capture('language_banner_dismissed', { locale: currentLocale, suggested: target });
                    }}
                    className="inline-flex items-center gap-1 text-white/70 hover:text-white transition-colors"
                >
                    <X size={14} aria-hidden="true" /> {text.dismiss}
                </button>
            </div>
        </div>
    );
}
