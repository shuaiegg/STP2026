import { Metadata } from 'next';
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
  return <PricingClient />;
}
