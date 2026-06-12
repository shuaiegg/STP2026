import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { CREDIT_PRODUCTS } from '@/lib/billing/products';
import PricingClient from './PricingClient';

import { getMetadataAlternates, BASE_URL } from '@/lib/seo/locale-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing.meta' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: locale === 'zh' ? `${BASE_URL}/zh/pricing` : `${BASE_URL}/pricing`,
      languages: getMetadataAlternates('/pricing'),
    },
    openGraph: {
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      images: [
        {
          url: locale === 'zh' ? '/api/og?locale=zh' : '/api/og?locale=en',
          width: 1200,
          height: 630,
          alt: 'ScaletoTop Pricing',
        },
      ],
    },
  };
}

export default function PricingPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.scaletotop.com';
  const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ScaletoTop AI Credits",
    "description": "Flexible AI credits for SEO content generation, site audit, and marketing automation.",
    "brand": {
      "@type": "Brand",
      "name": "ScaletoTop"
    },
    "offers": CREDIT_PRODUCTS.map(pack => ({
      "@type": "Offer",
      "name": pack.label,
      "price": pack.price,
      "priceCurrency": "USD",
      "url": `${baseUrl}/pricing`,
      "availability": "https://schema.org/InStock"
    }))
  };

  return (
    <>
      <JsonLd data={pricingSchema} />
      <PricingClient />
    </>
  );
}
