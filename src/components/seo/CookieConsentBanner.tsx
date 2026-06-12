'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

// Helper to manage cookies
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

interface PostHogClient {
  opt_in_capturing: () => void;
  opt_out_capturing: () => void;
}

interface CustomWindow {
  dataLayer?: Record<string, unknown>[];
  posthog?: PostHogClient;
}

// GTM dynamic injection helper
export function loadGtm(gtmId: string) {
  if (typeof window === 'undefined') return;
  const win = window as unknown as CustomWindow;
  if (win.dataLayer) return;

  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });
  
  const f = document.getElementsByTagName('script')[0];
  const j = document.createElement('script');
  j.async = true;
  j.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  f.parentNode?.insertBefore(j, f);
}

// locale 经 props 传入：本组件挂在 root layout（NextIntlClientProvider 之外），不能用 useLocale()
export function CookieConsentBanner({ locale = 'en' }: { locale?: string }) {
  const [visible, setVisible] = useState(false);

  // Trigger tracking functions
  function triggerTracking() {
    // 1. Opt-in PostHog
    if (typeof window !== 'undefined') {
      const win = window as unknown as CustomWindow;
      if (win.posthog) {
        win.posthog.opt_in_capturing();
      }
    }
    // 2. Inject Google Tag Manager dynamically
    const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
    if (gtmId && process.env.NODE_ENV === 'production') {
      loadGtm(gtmId);
    }
  }

  useEffect(() => {
    // Check if user has already made a choice
    const consent = getCookie('cookie_consent_status');
    if (!consent) {
      // Show banner if no choice is saved
      setTimeout(() => setVisible(true), 0);
    } else if (consent === 'accepted') {
      // If already accepted, trigger tracking client-side
      triggerTracking();
    }
  }, []);

  const handleAccept = () => {
    setCookie('cookie_consent_status', 'accepted', 365);
    setVisible(false);
    triggerTracking();
  };

  const handleDecline = () => {
    setCookie('cookie_consent_status', 'declined', 365);
    setVisible(false);
    // Explicitly opt out of PostHog just in case
    if (typeof window !== 'undefined') {
      const win = window as unknown as CustomWindow;
      if (win.posthog) {
        win.posthog.opt_out_capturing();
      }
    }
  };

  if (!visible) return null;

  const text = locale === 'zh' 
    ? '我们使用 Cookie 提升您的浏览体验，并进行匿名的流量分析（通过 Google Tag Manager 和 PostHog）。您可以选择接受或拒绝非必要的 Cookie。'
    : 'We use cookies to improve your browsing experience and analyze anonymous site traffic (via Google Tag Manager and PostHog). You can choose to accept or decline non-essential cookies.';

  const acceptBtnText = locale === 'zh' ? '接受必要及分析 Cookie' : 'Accept All';
  const declineBtnText = locale === 'zh' ? '仅使用必要 Cookie' : 'Decline';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-brand-border-heavy p-5 md:py-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm font-medium text-brand-text-secondary md:max-w-3xl text-left leading-relaxed">
          {text}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <Button
            variant="ghost"
            onClick={handleDecline}
            className="text-xs md:text-sm font-bold text-brand-text-muted hover:bg-slate-100 hover:text-brand-text-primary px-4 py-2.5 rounded-lg border-2 border-transparent transition-all w-1/2 md:w-auto text-center"
          >
            {declineBtnText}
          </Button>
          <Button
            onClick={handleAccept}
            className="text-xs md:text-sm font-bold bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary px-5 py-2.5 rounded-lg border-2 border-brand-border-heavy transition-all w-1/2 md:w-auto text-center"
          >
            {acceptBtnText}
          </Button>
        </div>
      </div>
    </div>
  );
}
