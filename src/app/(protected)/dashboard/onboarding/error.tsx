'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';


// ─── OnboardingError ──────────────────────────────────────────────────────────

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('dashboard.errors');
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4"
    >
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
          <AlertCircle size={40} aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">{t('onboarding.title')}</h2>
          <p className="text-slate-500 font-medium">{t('onboarding.description')}</p>
          <p className="text-xs text-slate-400 font-mono bg-slate-50 p-2 rounded-lg break-all">
            {error.message || t('unknownError')}
          </p>
        </div>
        <Button
          onClick={() => reset()}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-8"
        >
          <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('retry')}
        </Button>
      </div>
    </div>
  );
}
