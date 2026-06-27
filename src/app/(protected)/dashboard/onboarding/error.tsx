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
        <div className="w-20 h-20 bg-brand-error/10 rounded-full flex items-center justify-center mx-auto text-brand-error">
          <AlertCircle size={40} aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-brand-text-primary">{t('onboarding.title')}</h2>
          <p className="text-brand-text-secondary font-medium">{t('onboarding.description')}</p>
          <p className="text-xs text-brand-text-muted font-mono bg-brand-surface p-2 rounded-lg break-all">
            {error.message || t('unknownError')}
          </p>
        </div>
        <Button
          onClick={() => reset()}
          className="px-8"
        >
          <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('retry')}
        </Button>
      </div>
    </div>
  );
}
