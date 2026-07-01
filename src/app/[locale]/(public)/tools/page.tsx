import React from 'react';
import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import NextLink from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { getMetadataAlternates, localeCanonical, BASE_URL } from '@/lib/seo/locale-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tools.meta' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localeCanonical(locale, '/tools'),
      languages: getMetadataAlternates('/tools'),
    },
    openGraph: {
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      images: [
        {
          url: locale === 'zh' ? '/api/og?locale=zh' : '/api/og?locale=en',
          width: 1200,
          height: 630,
          alt: 'ScaletoTop — Platform Capabilities',
        },
      ],
    },
  };
}

type Capability = {
  title: string;
  body: string;
  badge: string;
  note: string;
};

const BADGE_STYLES: Record<string, string> = {
  free: 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20',
  Free: 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20',
  免费: 'bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20',
};

const FREE_AUDIT_PATH = '/dashboard/site-intelligence/instant-audit';

export default async function ToolsMarketingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('tools');
  const capabilities = t.raw('capabilities') as Capability[];

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t('meta.title'),
    description: t('meta.description'),
    url: `${BASE_URL}${locale === 'zh' ? '/zh' : ''}/tools`,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <JsonLd data={pageSchema} />

      {/* Hero */}
      <div className="text-center py-20 max-w-3xl mx-auto">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-secondary mb-4">
          {t('hero.tag')}
        </span>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-brand-text-primary mb-6 leading-tight">
          {t('hero.title')}
        </h1>
        <p className="text-brand-text-secondary text-lg leading-relaxed mb-10">
          {t('hero.sub')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-brand-secondary text-black font-bold px-8 py-3.5 rounded-lg hover:bg-brand-secondary/90 transition-colors"
          >
            {t('hero.cta')}
          </Link>
          <NextLink
            href={FREE_AUDIT_PATH}
            className="inline-flex items-center justify-center gap-2 border-2 border-brand-border text-brand-text-primary font-semibold px-8 py-3.5 rounded-lg hover:border-brand-text-muted transition-colors"
          >
            {t('hero.ctaFree')}
          </NextLink>
        </div>
      </div>

      {/* Capabilities grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
        {capabilities.map((cap, i) => {
          const badgeStyle = BADGE_STYLES[cap.badge] ?? 'bg-brand-surface text-brand-text-muted border-brand-border/50';
          return (
            <div
              key={i}
              className="flex flex-col p-8 bg-white border border-brand-border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-brand-text-primary font-display leading-snug">
                  {cap.title}
                </h2>
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${badgeStyle}`}>
                  {cap.badge}
                </span>
              </div>
              <p className="text-sm text-brand-text-secondary leading-relaxed flex-1">
                {cap.body}
              </p>
              {cap.note && (
                <p className="mt-4 text-[11px] text-brand-text-muted font-medium">
                  {cap.note}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-brand-border py-20 text-center max-w-2xl mx-auto">
        <h2 className="font-display text-3xl font-bold text-brand-text-primary mb-4">
          {t('footer.title')}
        </h2>
        <p className="text-brand-text-secondary leading-relaxed mb-8">
          {t('footer.body')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-brand-secondary text-black font-bold px-8 py-3.5 rounded-lg hover:bg-brand-secondary/90 transition-colors"
          >
            {t('footer.cta')}
          </Link>
          <NextLink
            href={FREE_AUDIT_PATH}
            className="inline-flex items-center justify-center gap-2 text-brand-text-secondary font-semibold hover:text-brand-text-primary transition-colors py-3.5"
          >
            {t('footer.ctaFree')}
          </NextLink>
        </div>
      </div>
    </div>
  );
}
