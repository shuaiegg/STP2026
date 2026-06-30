import { Suspense } from 'react';
import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getMetadataAlternates, BASE_URL } from '@/lib/seo/locale-metadata';
import { AuditClient } from './AuditClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'publicAudit.meta' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: locale === 'zh' ? `${BASE_URL}/zh/audit` : `${BASE_URL}/audit`,
      languages: getMetadataAlternates('/audit'),
    },
  };
}

export default async function AuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense>
      <AuditClient locale={locale} />
    </Suspense>
  );
}
