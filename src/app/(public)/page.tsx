/* eslint-disable react/no-unescaped-entities, @typescript-eslint/no-explicit-any */
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getPublishedContent } from '@/lib/content';

export const metadata: Metadata = {
  title: 'ScaletoTop | 帮中国出海企业每月新增 50+ 优质询盘',
  description: '专为中国出海企业打造。通过精准广告投流、SEO 内容矩阵和自动化跟进工具，帮你建立可预测、低成本的海外获客闭环。',
  alternates: {
    canonical: 'https://www.scaletotop.com',
  },
  openGraph: {
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'ScaletoTop Home',
      },
    ],
  },
};

const COPY = {
  hero: {
    badge: "已服务 50+ 出海企业",
    titleLine1: "让你的海外业务",
    titleLine2: "平均每月新增 50+ 优质询盘",
    subtitle: "专为出海企业打造。通过精准广告投流、SEO 内容矩阵和自动化跟进工具，帮你建立可预测、低成本的海外获客闭环。",
    ctaPrimary: "免费获取获客诊断报告",
    ctaPrimaryMicro: "无需信用卡 · 专属增长方案",
    ctaSecondary: "探索自动化工具"
  },
  metrics: {
    stats: [
      { value: 500, suffix: "+", label: "生成询盘数" },
      { value: 50, suffix: "+", label: "服务企业" },
      { value: 30, suffix: "+", label: "覆盖国家" },
      { value: 3, suffix: "x", label: "平均ROI提升" }
    ]
  },
  process: {
    subtitle: "如何运作",
    titleLine1: "三步建立你的",
    titleLine2: "海外获客系统",
    description: "我们不只是投广告，而是帮你建立一套可持续、可复制的获客方法",
    steps: [
      { num: "01", title: "获客诊断", desc: "分析你的产品、市场和现有渠道，找出最适合你的获客组合" },
      { num: "02", title: "策略定制", desc: "根据诊断结果，制定广告+内容+工具的组合策略和执行计划" },
      { num: "03", title: "执行优化", desc: "落地执行获客计划，持续追踪数据，优化转化效果" }
    ]
  },
  methods: {
    subtitle: "获客方法",
    titleLine1: "三种方法组合",
    titleLine2: "形成获客闭环",
    description: "广告带来即时流量，内容积累长期资产，工具提升规模效率",
    items: [
      {
        num: "01",
        title: "精准广告投放",
        desc: "Google Ads + Meta Ads 精准触达海外目标客户，从受众定位到转化追踪的完整流程",
        tags: ["Google Ads", "Meta", "LinkedIn"],
        label: "即时获客"
      },
      {
        num: "02",
        title: "SEO内容矩阵",
        desc: "建立可复用的内容生产流程，从关键词研究到文章优化，让内容成为持续获客的长期资产",
        tags: ["SEO", "博客", "视频"],
        label: "长期累积"
      },
      {
        num: "03",
        title: "自动化工具",
        desc: "通过工具产品化，把重复的人工操作变成可规模化的流程，让小团队也能实现高效获客",
        tags: ["自动化", "CRM", "邮件"],
        label: "规模放大"
      }
    ]
  },
  testimonials: {
    subtitle: "客户评价",
    titleLine1: "他们这样评价",
    titleLine2: "我们的服务"
  },
  resources: {
    subtitle: "学习资源",
    titleLine1: "实战方法",
    titleLine2: "与拆解案例",
    cta: "查看全部文章",
    emptyTitle: "即将推出更多内容",
    emptyDesc: "我们的内容团队正在整理实战案例，敬请期待。"
  },
  cta: {
    titleLine1: "准备好建立你的",
    titleLine2: "海外获客系统了吗？",
    subtitle: "免费获取一份专属于你的获客诊断报告，了解最适合你的获客方法组合",
    primary: "立即开启增长",
    secondary: "查看方法论文章"
  }
};

// Animated counter component
function AnimatedCounter({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-4xl font-bold text-brand-secondary mb-2">
        {value}{suffix}
      </div>
      <div className="text-sm text-brand-text-muted">
        {label}
      </div>
    </div>
  );
}

// Client logo component
function ClientLogos() {
  const clients = [
    { name: 'IndustrialAI', initial: 'AI' },
    { name: 'SmartTrade', initial: 'ST' },
    { name: 'ExportPro', initial: 'EP' },
    { name: 'GlobalSync', initial: 'GS' },
    { name: 'NeoMarket', initial: 'NM' },
  ];

  return (
    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
      {clients.map((client) => (
        <div
          key={client.name}
          className="px-6 py-4 flex items-center justify-center font-display text-lg font-black italic tracking-tighter text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-default"
        >
          {client.name.toUpperCase()}
        </div>
      ))}
    </div>
  );
}

// Testimonial card component
function TestimonialCard({ quote, author, role, company, result }: {
  quote: string;
  author: string;
  role: string;
  company: string;
  result: string;
}) {
  return (
    <div className="border border-brand-border rounded-lg bg-white p-8 transition-shadow hover:shadow-md cursor-pointer flex flex-col h-full">
      <div className="mb-6">
        <svg className="w-8 h-8 text-brand-secondary/40" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
        </svg>
      </div>
      <p className="text-base text-brand-text-primary mb-6 leading-relaxed flex-1">
        "{quote}"
      </p>
      <div className="flex items-center justify-between pt-6 border-t border-brand-border mt-auto">
        <div>
          <div className="font-bold text-sm text-brand-text-primary mb-1">{author}</div>
          <div className="text-xs text-brand-text-muted">{role}，{company}</div>
        </div>
        <Badge variant="success" className="font-mono">
          {result}
        </Badge>
      </div>
    </div>
  );
}

// Process step component
function ProcessStep({ number, title, description, icon }: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative group h-full">
      <div className="border border-brand-border rounded-lg p-8 bg-white transition-shadow hover:shadow-md cursor-pointer h-full">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
            {icon}
          </div>
          <div className="flex-1">
            <div className="font-mono text-xs text-brand-text-muted mb-2">步骤 {number}</div>
            <h3 className="text-lg font-bold text-brand-text-primary mb-2">{title}</h3>
            <p className="text-sm text-brand-text-secondary leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from 'react';
import { JsonLd } from '@/components/seo/JsonLd';

function PostsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[0, 1, 2].map((i) => (
        <div key={i} className="border border-brand-border rounded-lg bg-white h-[320px] animate-pulse" />
      ))}
    </div>
  );
}

async function FeaturedPosts() {
  let contents: any[] = [];
  try {
    const result = await getPublishedContent({}, { limit: 3 });
    contents = result?.contents || [];
  } catch (error) {
    console.error('Failed to fetch published content for home page:', error);
    contents = [];
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '未发布';
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (contents.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-brand-border rounded-lg bg-white">
        <h3 className="font-bold text-brand-text-primary mb-2">{COPY.resources.emptyTitle}</h3>
        <p className="text-brand-text-secondary text-sm">{COPY.resources.emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {contents.map((post: any, index: number) => {
        const coverSrc = post.coverImage?.storageUrl || post.coverImage?.originalUrl || 'https://picsum.photos/seed/placeholder/1200/630';
        return (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block h-full">
            <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
              <div className="aspect-[16/10] overflow-hidden relative border-b border-brand-border">
                <Image
                  src={coverSrc}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index === 0}
                />
                {post.category?.name && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 backdrop-blur text-brand-text-primary">
                      {post.category.name}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-display text-lg font-bold text-brand-text-primary group-hover:text-brand-secondary transition-colors mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-brand-text-secondary leading-relaxed mb-4 line-clamp-2 flex-1">
                  {post.summary}
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-brand-border mt-auto">
                  <span className="text-xs text-brand-text-muted">
                    {formatDate(post.publishedAt)}
                  </span>
                  <div className="w-1 h-1 bg-brand-border rounded-full"></div>
                  <span className="text-xs text-brand-text-muted">
                    {post.readingTime || '5'} 分钟
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default async function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}

      <section className="relative py-24 md:py-32 overflow-hidden bg-brand-surface">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-4 mb-8 animate-slide-in-up">
              <Badge className="bg-brand-secondary/10 text-brand-secondary">
                {COPY.hero.badge}
              </Badge>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
              <span className="text-brand-text-primary">{COPY.hero.titleLine1}</span>
              <br />
              <span className="text-brand-secondary">
                {COPY.hero.titleLine2}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-brand-text-secondary leading-relaxed mb-10 max-w-2xl mx-auto animate-slide-in-up stagger-2">
              {COPY.hero.subtitle}
            </p>

            <div className="flex flex-col items-center gap-4 mb-12 animate-slide-in-up stagger-3">
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link href="/blog" className="w-full sm:w-auto">
                  <Button as="span" variant="primary" size="lg" className="w-full">
                    {COPY.hero.ctaPrimary}
                  </Button>
                </Link>
                <Link href="/tools" className="w-full sm:w-auto">
                  <Button as="span" variant="outline" size="lg" className="w-full">
                    {COPY.hero.ctaSecondary}
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-brand-text-muted mt-2">{COPY.hero.ctaPrimaryMicro}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Bar */}
      <section className="py-20 border-y border-brand-border bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {COPY.metrics.stats.map(stat => (
              <AnimatedCounter key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} />
            ))}
          </div>
        </div>
      </section>

      {/* Client Logos */}
      <section className="py-20 bg-brand-surface border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-sm text-brand-text-muted">
              他们选择了 ScaletoTop
            </p>
          </div>
          <ClientLogos />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm text-brand-secondary font-bold mb-4 block">{COPY.process.subtitle}</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-text-primary mb-4 leading-tight">
              {COPY.process.titleLine1} <span className="text-brand-secondary">{COPY.process.titleLine2}</span>
            </h2>
            <p className="text-brand-text-secondary leading-relaxed">
              {COPY.process.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {COPY.process.steps.map((step, idx) => (
              <ProcessStep
                key={step.num}
                number={step.num}
                title={step.title}
                description={step.desc}
                icon={
                  idx === 0 ? <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> :
                  idx === 1 ? <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg> :
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* Method Combination */}
      <section className="py-24 bg-brand-surface border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <div className="max-w-2xl">
            <span className="text-sm text-brand-secondary font-bold mb-4 block">{COPY.methods.subtitle}</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-text-primary mb-4 leading-tight">
              {COPY.methods.titleLine1} <span className="text-brand-secondary">{COPY.methods.titleLine2}</span>
            </h2>
            <p className="text-brand-text-secondary leading-relaxed">
              {COPY.methods.description}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {COPY.methods.items.map(method => (
              <div key={method.num} className="border border-brand-border rounded-lg p-8 bg-white transition-shadow hover:shadow-md h-full flex flex-col">
                <div className="mb-6 flex items-center justify-between">
                  <div className="font-mono text-xl text-brand-text-muted">{method.num}</div>
                  <div className="text-xs font-bold text-brand-secondary bg-brand-secondary/10 px-2 py-1 rounded">{method.label}</div>
                </div>
                <h3 className="text-xl font-bold text-brand-text-primary mb-4">{method.title}</h3>
                <p className="text-sm text-brand-text-secondary leading-relaxed mb-6 flex-1">
                  {method.desc}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-auto">
                  {method.tags.map(tag => (
                    <Badge key={tag} variant="muted" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm text-brand-secondary font-bold mb-4 block">{COPY.testimonials.subtitle}</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-text-primary leading-tight">
              {COPY.testimonials.titleLine1} <span className="text-brand-secondary">{COPY.testimonials.titleLine2}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="从完全不懂海外营销，到现在每月稳定收到20+询盘，ScaletoTop 帮我们建立了完整的获客流程"
              author="陈先生"
              role="创始人"
              company="华东某智能制造企业"
              result="询盘 +280%"
            />
            <TestimonialCard
              quote="最有价值的是他们不只是帮我们投广告，而是真正通过 AI 智作工具，让我们具备了低成本规模化产出的能力"
              author="Sarah"
              role="市场负责人"
              company="某跨境电商独立站"
              result="ROI 4.2x"
            />
            <TestimonialCard
              quote="SEO内容矩阵让我们在半年内拿下了 30 多个核心词的前三名，现在的询盘大多来自精准的自然流量"
              author="张总"
              role="CEO"
              company="深圳某新材料出海品牌"
              result="流量 +500%"
            />
          </div>
        </div>
      </section>

      {/* Featured Content */}
      <section className="py-24 bg-brand-surface border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <span className="text-sm text-brand-secondary font-bold mb-4 block">{COPY.resources.subtitle}</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-text-primary leading-tight">
                {COPY.resources.titleLine1} <br/> {COPY.resources.titleLine2}
              </h2>
            </div>
            <Link href="/blog">
              <Button as="span" variant="outline">
                {COPY.resources.cta}
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <Suspense fallback={<PostsSkeleton />}>
            <FeaturedPosts />
          </Suspense>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-brand-primary">
        <div className="max-w-7xl mx-auto text-center max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {COPY.cta.titleLine1} <br/>
            <span className="text-brand-secondary">{COPY.cta.titleLine2}</span>
          </h2>
          <p className="text-lg text-white/80 mb-10 leading-relaxed">
            {COPY.cta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/tools" className="w-full sm:w-auto">
              <Button as="span" variant="primary" size="lg" className="w-full sm:w-auto text-white">
                {COPY.cta.primary}
              </Button>
            </Link>
            <Link href="/blog" className="w-full sm:w-auto">
              <Button as="span" variant="outline" size="lg" className="w-full sm:w-auto text-white border-white/20 hover:bg-white/10 hover:text-white">
                {COPY.cta.secondary}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
