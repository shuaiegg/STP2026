import { JsonLd } from '@/components/seo/JsonLd';
import { CREDIT_PRODUCTS } from '@/lib/billing/products';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: '积分套餐与定价 | ScaletoTop',
  description: '灵活按需付费，无月费订阅压力。AI 内容生成、站点 SEO 体检等工具按积分计费，小团队也能高效出海。',
  alternates: {
    canonical: 'https://www.scaletotop.com/pricing',
  },
  openGraph: {
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'ScaletoTop Pricing',
      },
    ],
  },
};

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
