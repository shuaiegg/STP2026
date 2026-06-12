import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ConsultationForm } from './ConsultationForm';
import { localeCanonical } from '@/lib/seo/locale-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consultation.meta' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: localeCanonical(locale, '/consultation') },
  };
}

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('consultation');

  return (
    <main className="min-h-screen bg-brand-bg">
      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-secondary bg-brand-secondary/10 px-3 py-1 rounded-full mb-4">
            {t('badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-brand-text-primary mb-4 leading-tight">
            {t('title')}
          </h1>
          <p className="text-brand-text-secondary max-w-lg mx-auto leading-relaxed">{t('sub')}</p>
          <p className="mt-4 text-xs text-brand-text-muted">{t('trustLine')}</p>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ConsultationForm />
        </div>
      </section>
    </main>
  );
}
