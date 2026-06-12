import React from 'react';
import { Metadata } from 'next';
import { Construction, ArrowLeft } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { getMetadataAlternates, localeCanonical, BASE_URL } from '@/lib/seo/locale-metadata';
import { isPageAvailable } from '@/lib/i18n/page-availability';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'caseStudies.meta' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: localeCanonical(locale, '/case-studies'),
            languages: getMetadataAlternates('/case-studies'),
        },
        openGraph: {
            locale: locale === 'zh' ? 'zh_CN' : 'en_US',
            images: [
                {
                    url: locale === 'zh' ? '/api/og?locale=zh' : '/api/og?locale=en',
                    width: 1200,
                    height: 630,
                    alt: 'ScaletoTop Case Studies',
                },
            ],
        },
    };
}

export default async function ComingSoon({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    if (!isPageAvailable('/case-studies', locale as Locale)) notFound();
    setRequestLocale(locale);
    const t = await getTranslations('caseStudies');

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mb-8 animate-pulse">
                <Construction size={40} />
            </div>
            <h1 className="text-4xl font-black text-brand-text-primary mb-4 font-display italic">{t('title')}</h1>
            <p className="text-brand-text-secondary max-w-md mb-10 leading-relaxed">
                {t('desc')}
            </p>
            <Link href="/">
                <Button className="font-bold px-8 py-6 shadow-lg">
                    <ArrowLeft className="mr-2" size={18} /> {t('backHome')}
                </Button>
            </Link>
        </div>
    );
}
