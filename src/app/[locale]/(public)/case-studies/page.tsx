import React from 'react';
import { Metadata } from 'next';
import { Construction, ArrowLeft } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { localeCanonical } from '@/lib/seo/locale-metadata';

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
        alternates: { canonical: localeCanonical(locale, '/case-studies') },
    };
}

export default async function ComingSoon({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
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
