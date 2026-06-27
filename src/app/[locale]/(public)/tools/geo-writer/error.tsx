'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('public.errors');
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-brand-error/10 flex items-center justify-center text-brand-error">
        <AlertCircle size={32} aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-brand-text-primary">{t('title')}</h2>
        <p className="text-sm text-brand-text-secondary max-w-xs mx-auto">{t('description')}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <Button
          onClick={() => reset()}
          className="flex items-center gap-2"
        >
          <RefreshCcw size={18} aria-hidden="true" />
          {t('retry')}
        </Button>
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg border border-brand-border text-brand-text-secondary hover:bg-brand-surface hover:text-brand-text-primary hover:border-brand-text-muted transition-all duration-300"
        >
          <Home size={18} aria-hidden="true" />
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
