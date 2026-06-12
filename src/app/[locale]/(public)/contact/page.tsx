import React from 'react';
import { Metadata } from 'next';
import { Mail, MessageCircle, Clock } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { localeCanonical } from '@/lib/seo/locale-metadata';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'contact.meta' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: { canonical: localeCanonical(locale, '/contact') },
    };
}

export default async function ContactPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('contact');
    const bold = (chunks: React.ReactNode) => <span className="text-brand-text-primary font-bold">{chunks}</span>;

    return (
        <div className="bg-brand-surface min-h-[80vh] pt-32 pb-24 px-6">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-brand-text-primary mb-6 italic tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-lg text-brand-text-secondary font-medium">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="p-8 border-2 border-brand-border bg-white flex flex-col items-center text-center group hover:border-brand-primary/20 transition-all">
                        <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                            <Mail size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-text-primary mb-2">{t('emailTitle')}</h3>
                        <p className="text-sm text-brand-text-secondary mb-6 font-medium">
                            {t('emailDesc')}
                        </p>
                        <a
                            href="mailto:support@scaletotop.com"
                            className="text-lg font-black text-brand-primary hover:underline underline-offset-4"
                        >
                            support@scaletotop.com
                        </a>
                    </Card>

                    <Card className="p-8 border-2 border-brand-border bg-white flex flex-col items-center text-center group hover:border-brand-primary/20 transition-all">
                        <div className="w-16 h-16 rounded-2xl bg-brand-secondary/5 flex items-center justify-center text-brand-secondary mb-6 group-hover:scale-110 transition-transform">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-text-primary mb-2">{t('responseTitle')}</h3>
                        <p className="text-sm text-brand-text-secondary mb-4 font-medium leading-relaxed">
                            {t.rich('responseDesc', { b: bold })}
                        </p>
                    </Card>
                </div>

                <div className="mt-16 p-8 bg-slate-50 border-2 border-brand-border rounded-3xl">
                    <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MessageCircle size={16} className="text-brand-primary" /> {t('faqTitle')}
                    </h4>
                    <p className="text-sm text-brand-text-secondary leading-relaxed font-medium">
                        {t.rich('faqBody', { b: bold })}
                    </p>
                </div>
            </div>
        </div>
    );
}
