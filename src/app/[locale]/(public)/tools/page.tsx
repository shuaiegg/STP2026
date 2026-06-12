import React from 'react';
import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { JsonLd } from '@/components/seo/JsonLd';
import { localeCanonical, BASE_URL } from '@/lib/seo/locale-metadata';

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
    },
    openGraph: {
      images: [
        {
          url: '/api/og',
          width: 1200,
          height: 630,
          alt: 'ScaletoTop Tools',
        },
      ],
    },
  };
}

// 结构数据（id/href/free/icon）在代码中，文案在 messages tools.items（按 index 对齐）
const TOOL_DEFS = [
  {
    id: "geo-writer",
    href: "/tools/geo-writer",
    free: false,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: "maps-scraper",
    href: "/tools/maps-scraper",
    free: false,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "site-audit",
    href: "/tools/site-audit",
    free: true,
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

type ToolCopy = {
  name: string;
  description: string;
  useCase: string;
  cost: string;
  badge: string;
  cta: string;
};

export default async function Tools({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('tools');
  const items = t.raw('items') as ToolCopy[];
  const tools = TOOL_DEFS.map((def, i) => ({ ...def, ...items[i] }));

  const toolsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": tools.map((tool, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "SoftwareApplication",
        "name": tool.name,
        "description": tool.description,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "inLanguage": locale === 'zh' ? 'zh-Hans' : 'en',
        "url": `${BASE_URL}${locale === 'zh' ? '/zh' : ''}${tool.href}`,
        "offers": {
          "@type": "Offer",
          "price": tool.free ? "0" : "50",
          "priceCurrency": tool.free ? "USD" : "Points"
        }
      }
    }))
  };

  return (
    <div className="container mx-auto py-24 px-6 min-h-[60vh]">
      <JsonLd data={toolsSchema} />
      <div className="text-center mb-16 max-w-2xl mx-auto">

        <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 text-brand-text-primary">{t('title')}</h1>
        <p className="text-brand-text-secondary text-lg leading-relaxed">
          {t('intro')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tools.map(tool => (
          <div key={tool.id} className="flex h-full font-sans">
            <Card className="flex flex-col w-full h-full p-8 transition-shadow hover:shadow-md cursor-default">
              <div className="w-12 h-12 rounded-lg bg-brand-surface-alt border border-brand-border flex items-center justify-center text-brand-secondary mb-6">
                {tool.icon}
              </div>

              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-xl font-bold text-brand-text-primary">{tool.name}</h2>
                {tool.badge && (
                  <span className="shrink-0 font-mono text-[10px] font-bold text-brand-secondary bg-brand-secondary/10 px-2 py-1 rounded">
                    {tool.badge}
                  </span>
                )}
              </div>

              <p className="text-brand-text-secondary text-sm mb-4 leading-relaxed">
                {tool.description}
              </p>

              <div className="bg-brand-surface p-4 rounded-lg border border-brand-border/50 mb-8 mt-auto">
                <p className="text-xs text-brand-text-primary font-medium leading-relaxed">
                  <span className="font-bold mr-1">{t('howToUse')}</span>
                  {tool.useCase}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-brand-border mt-auto">
                <p className="text-sm font-mono text-brand-text-muted">
                  {tool.cost}
                </p>
                <Link href={tool.href} tabIndex={-1}>
                  <Button as="span" variant="primary" size="sm" className="font-bold">
                    {tool.cta}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
