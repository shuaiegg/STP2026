import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: '出海营销工具箱 | ScaletoTop',
  description: 'AI 驱动的出海营销工具集：多语言内容生成、站点 SEO 分析、市场竞争情报，一站式提升海外获客效率。',
  alternates: {
    canonical: 'https://www.scaletotop.com/tools',
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

const TOOLS = [
  {
    id: "geo-writer",
    name: "SEO & GEO 写作优化器",
    description: "基于 Google 地图数据与本地 SEO 算法，一键生成针对特定地理位置的高转化 B2B 文案。",
    useCase: "你可以用它快速生成多个城市的本地化服务页内容，批量获取高意向的本地长尾搜索流量。",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    href: "/tools/geo-writer",
    cost: "50 积分 / 次",
    badge: "热门",
    cta: "立即使用"
  },
  {
    id: "maps-scraper",
    name: "Google Maps 潜在客户采集",
    description: "深度采集全球各地区的 B2B 客户信息，包含电话、网站、社交媒体及地理位置。",
    useCase: "你可以用它一键批量获取目标市场经销商或客户的精准联系方式，用于冷邮件或跟进开发。",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    href: "/tools/maps-scraper",
    cost: "50 积分 / 次",
    badge: "Beta",
    cta: "申请测试"
  },
  {
    id: "site-audit",
    name: "出海独立站健康诊断",
    description: "全方位扫描独立站的加载速度、SEO 基准、以及移动端适配情况，并提供优化方案。",
    useCase: "你可以用它在上线前检查网站是否符合 Google 技术规范，排查影响排名的致命隐患。",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    href: "/tools/site-audit",
    cost: "免费",
    badge: "研发中",
    cta: "加入等候名单"
  }
];

export default function Tools() {
  return (
    <div className="container mx-auto py-24 px-6 min-h-[60vh]">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 text-brand-text-primary">数字化效率工具包</h1>
        <p className="text-brand-text-secondary text-lg leading-relaxed">
          为出海团队打造的自动化工具，将重复工作流程化，助力每一个决策都可量化、可追踪。
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {TOOLS.map(tool => (
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
                  <span className="font-bold mr-1">💡 怎么用：</span>
                  {tool.useCase}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-brand-border mt-auto">
                <p className="text-sm font-mono text-brand-text-muted">
                  {tool.cost}
                </p>
                <Link href={tool.href} tabIndex={-1}>
                  <Button as="span" variant="secondary" size="sm" className="font-bold">
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
