import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getPublishedContent } from '@/lib/content';

export const dynamic = 'force-dynamic';

// Animated counter component
function AnimatedCounter({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-4xl md:text-5xl font-black text-brand-secondary mb-2">
        {value}{suffix}
      </div>
      <div className="font-mono text-xs tracking-widest text-brand-text-muted uppercase">
        {label}
      </div>
    </div>
  );
}

// Client logo component
function ClientLogos() {
  const clients = [
    { name: 'TechCorp', initial: 'T' },
    { name: 'GlobalMfg', initial: 'G' },
    { name: 'SmartExport', initial: 'S' },
    { name: 'InnovateCo', initial: 'I' },
    { name: 'TradeWin', initial: 'W' },
  ];
  
  return (
    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
      {clients.map((client) => (
        <div
          key={client.name}
          className="w-16 h-16 border-2 border-brand-border flex items-center justify-center bg-white/50 font-display text-2xl font-bold text-brand-text-muted hover:text-brand-primary hover:border-brand-border-heavy transition-all cursor-default"
        >
          {client.initial}
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
    <div className="border-2 border-brand-border-heavy bg-white p-8 transition-all hover:shadow-[8px_8px_0_0_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] cursor-pointer">
      <div className="mb-6">
        <svg className="w-10 h-10 text-brand-secondary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
        </svg>
      </div>
      <p className="text-lg text-brand-text-primary mb-6 leading-relaxed font-medium">
        "{quote}"
      </p>
      <div className="flex items-center justify-between pt-6 border-t border-brand-border">
        <div>
          <div className="font-display font-bold text-brand-text-primary">{author}</div>
          <div className="text-sm text-brand-text-muted">{role}，{company}</div>
        </div>
        <Badge className="bg-brand-secondary-muted text-brand-text-primary border-2 border-brand-secondary font-mono text-xs">
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
    <div className="relative group">
      <div className="border-2 border-brand-border-heavy p-8 bg-white transition-all group-hover:shadow-[8px_8px_0_0_rgba(10,10,10,1)] group-hover:translate-x-[-4px] group-hover:translate-y-[-4px] cursor-pointer h-full">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0 w-16 h-16 bg-brand-primary flex items-center justify-center text-brand-text-inverted">
            {icon}
          </div>
          <div className="flex-1">
            <div className="font-mono text-xs text-brand-secondary font-bold mb-2">STEP {number}</div>
            <h3 className="font-display text-xl font-bold text-brand-text-primary mb-3">{title}</h3>
            <p className="text-brand-text-secondary leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const { contents } = await getPublishedContent({}, { limit: 3 });
  const featuredPosts = contents;

  const formatDate = (date: Date | null) => {
    if (!date) return '未发布';
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden bg-brand-surface">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="grid-bg-dense h-full w-full"></div>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 opacity-5 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <path d="M20,50 L80,50 L80,80 L120,80 L120,120 L80,120 L80,150 L50,150"
              stroke="currentColor" strokeWidth="4" fill="none" className="text-brand-primary"/>
            <path d="M50,20 L120,20 L120,50 L150,50 L150,90 L120,90 L120,120 L90,120"
              stroke="currentColor" strokeWidth="2" fill="none" className="text-brand-secondary"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-5xl">
            <div className="flex items-center gap-4 mb-8 opacity-0 animate-slide-in-left">
              <Badge className="bg-brand-secondary text-brand-text-primary border-2 border-brand-border-heavy font-mono text-xs px-3 py-1">
                已服务 50+ 出海企业
              </Badge>
            </div>

            <h1 className="font-display text-5xl md:text-[5rem] font-black leading-[0.95] mb-8 tracking-tight opacity-0 animate-slide-in-up stagger-1">
              <span className="text-brand-text-primary">让你的产品</span>
              <br />
              <span className="relative inline-block text-brand-text-primary mt-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-secondary via-brand-accent to-brand-secondary bg-[length:200%_auto] animate-gradient-x">
                  稳定获取海外询盘
                </span>
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-brand-text-secondary leading-relaxed mb-10 max-w-3xl opacity-0 animate-slide-in-up stagger-2 font-normal">
              通过<span className="font-semibold text-brand-text-primary">广告投放 + SEO内容 + 自动化工具</span>的组合策略，
              帮助中国企业建立可持续、可复制的海外获客系统
            </p>

            <div className="flex flex-col sm:flex-row gap-5 mb-12 opacity-0 animate-slide-in-up stagger-3">
              <Link href="/consultation">
                <Button
                  as="span"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto text-base bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-[6px_6px_0_0_rgba(10,10,10,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold cursor-pointer"
                >
                  获取免费获客诊断
                  <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </Button>
              </Link>
              <Link href="/case-studies">
                <Button
                  as="span"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base border-2 border-brand-border-heavy hover:bg-brand-surface-alt transition-colors cursor-pointer"
                >
                  查看成功案例
                </Button>
              </Link>
            </div>

            <div className="opacity-0 animate-slide-in-up stagger-4">
              <div className="inline-flex items-center gap-4 border-2 border-brand-border bg-white p-4 pr-6">
                <div className="w-12 h-12 bg-brand-surface-alt border-2 border-brand-border flex items-center justify-center font-display font-bold text-brand-primary">
                  L
                </div>
                <div>
                  <p className="text-sm text-brand-text-primary font-medium">"3个月内询盘量增长了 280%"</p>
                  <p className="text-xs text-brand-text-muted font-mono">— 李总，某机械制造企业</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Bar */}
      <section className="py-16 bg-brand-primary border-y-2 border-brand-border-heavy">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedCounter value={500} suffix="+" label="生成询盘数" />
            <AnimatedCounter value={50} suffix="+" label="服务企业" />
            <AnimatedCounter value={30} suffix="+" label="覆盖国家" />
            <AnimatedCounter value={3} suffix="x" label="平均ROI提升" />
          </div>
        </div>
      </section>

      {/* Client Logos */}
      <section className="py-16 bg-brand-surface border-b-2 border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="font-mono text-xs tracking-[0.2em] text-brand-text-muted uppercase">
              他们选择了 ScaletoTop
            </p>
          </div>
          <ClientLogos />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-white border-b-2 border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs tracking-[0.25em] text-brand-secondary uppercase font-bold">如何运作</span>
              <div className="h-[1px] flex-1 bg-brand-border"></div>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-brand-text-primary mb-6 leading-tight">
              三步建立你的<br /><span className="text-brand-secondary">海外获客系统</span>
            </h2>
            <p className="text-lg text-brand-text-secondary leading-relaxed">
              我们不只是投广告，而是帮你建立一套可持续、可复制的获客方法
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProcessStep
              number="01"
              title="获客诊断"
              description="分析你的产品、市场和现有渠道，找出最适合你的获客组合"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
              }
            />
            <ProcessStep
              number="02"
              title="策略定制"
              description="根据诊断结果，制定广告+内容+工具的组合策略和执行计划"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
                </svg>
              }
            />
            <ProcessStep
              number="03"
              title="执行优化"
              description="落地执行获客计划，持续追踪数据，优化转化效果"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              }
            />
          </div>

          <div className="hidden md:block relative mt-8">
            <div className="absolute top-0 left-[16.67%] right-[16.67%] h-1 bg-brand-secondary"></div>
          </div>
        </div>
      </section>

      {/* Method Combination Banner */}
      <section className="py-32 relative border-b-2 border-brand-border bg-gradient-to-b from-brand-surface to-white">
        <div className="max-w-7xl mx-auto px-6 mb-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs tracking-[0.25em] text-brand-secondary uppercase font-bold">获客方法</span>
              <div className="h-[1px] flex-1 bg-brand-border"></div>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-brand-text-primary mb-6 leading-tight">
              三种方法组合<br /><span className="text-brand-secondary">形成获客闭环</span>
            </h2>
            <p className="text-lg text-brand-text-secondary leading-relaxed">
              广告带来即时流量，内容积累长期资产，工具提升规模效率
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 - Ads */}
            <div className="group relative">
              <div className="border-2 border-brand-border-heavy p-10 bg-white transition-all hover:shadow-[8px_8px_0_0_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] cursor-pointer h-full">
                <div className="mb-8">
                  <div className="font-mono text-4xl font-bold text-brand-primary mb-2">01</div>
                  <div className="h-1 w-12 bg-brand-secondary"></div>
                </div>
                <h3 className="font-display text-2xl font-bold text-brand-text-primary mb-5 leading-snug">
                  精准广告投放
                </h3>
                <p className="text-brand-text-secondary leading-relaxed text-base mb-6">
                  Google Ads + Meta Ads + LinkedIn Ads 精准触达海外目标客户，从受众定位到转化追踪的完整流程
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <Badge className="bg-brand-surface text-brand-text-secondary border border-brand-border text-xs">Google Ads</Badge>
                  <Badge className="bg-brand-surface text-brand-text-secondary border border-brand-border text-xs">Meta</Badge>
                  <Badge className="bg-brand-surface text-brand-text-secondary border border-brand-border text-xs">LinkedIn</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono text-brand-secondary font-bold">
                  <span>即时获客</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 2 - Content */}
            <div className="group relative">
              <div className="border-2 border-brand-border-heavy p-10 bg-white transition-all hover:shadow-[8px_8px_0_0_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] cursor-pointer h-full">
                <div className="mb-8">
                  <div className="font-mono text-4xl font-bold text-brand-primary mb-2">02</div>
                  <div className="h-1 w-12 bg-brand-secondary"></div>
                </div>
                <h3 className="font-display text-2xl font-bold text-brand-text-primary mb-5 leading-snug">
                  SEO内容矩阵
                </h3>
                <p className="text-brand-text-secondary leading-relaxed text-base mb-6">
                  建立可复用的内容生产流程，从关键词研究到文章优化，让内容成为持续获客的长期资产
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <Badge className="bg-brand-surface text-brand-text-secondary border border-brand-border text-xs">SEO</Badge>
                  <Badge className="bg-brand-surface text-brand-text-secondary border border-brand-border text-xs">博客</Badge>
                  <Badge className="bg-brand-surface text-brand-text-secondary border border-brand-border text-xs">视频</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono text-brand-secondary font-bold">
                  <span>长期累积</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Card 3 - Tools */}
            <div className="group relative">
              <div className="border-2 border-brand-border-heavy p-10 bg-white transition-all hover:shadow-[8px_8px_0_0_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] cursor-pointer h-full">
                <div className="mb-8">
                  <div className="font-mono text-4xl font-bold text-brand-primary mb-2">01</div>
                  <div className="h-1 w-12 bg-brand-secondary"></div>
                </div>
                <h3 className="font-display text-2xl font-bold text-brand-text-primary mb-5 leading-snug">
                  自动化工具
                </h3>
                <p className="text-brand-text-secondary leading-relaxed text-base mb-6">
                  通过工具产品化，把重复的人工操作变成可规模化的流程，让小团队也能实现高效获客
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <Badge className="bg-brand-surface text-brand-text-secondary border border-brand-border text-xs">自动化</Badge>
                  <Badge className="bg-brand-surface text-brand-text-secondary border border-brand-border text-xs">CRM</Badge>
                  <Badge className="bg-brand-surface text-brand-text-secondary border border-brand-border text-xs">邮件</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono text-brand-secondary font-bold">
                  <span>规模放大</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-brand-surface border-b-2 border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs tracking-[0.25em] text-brand-secondary uppercase font-bold">客户评价</span>
              <div className="h-[1px] flex-1 bg-brand-border"></div>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-brand-text-primary mb-6 leading-tight">
              他们这样评价<br /><span className="text-brand-secondary">我们的服务</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="从完全不懂海外营销，到现在每月稳定收到20+询盘，ScaletoTop 帮我们建立了完整的获客流程"
              author="王明"
              role="创始人"
              company="某工业设备公司"
              result="询盘+280%"
            />
            <TestimonialCard
              quote="最有价值的是他们不只是帮我们投广告，而是真正教会了我们团队如何持续获客"
              author="李华"
              role="市场总监"
              company="某电子元器件企业"
              result="ROI 4.2x"
            />
            <TestimonialCard
              quote="SEO内容策略让我们的网站流量半年内增长了5倍，现在自然流量带来的询盘占了一半"
              author="张强"
              role="VP Marketing"
              company="某新材料公司"
              result="流量+500%"
            />
          </div>
        </div>
      </section>

      {/* Featured Content */}
      <section className="py-32 bg-white border-b-2 border-brand-border">
        <div className="max-w-7xl mx-auto px-6 mb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-xs tracking-[0.25em] text-brand-secondary uppercase font-bold">学习资源</span>
                <div className="h-[1px] flex-1 bg-brand-border md:max-w-[100px]"></div>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-brand-text-primary leading-tight">
                实战方法<br />与拆解案例
              </h2>
            </div>
            <Link href="/blog">
              <Button
                as="span"
                variant="outline"
                className="border-2 border-brand-border-heavy hover:bg-brand-surface transition-colors group cursor-pointer"
              >
                查看全部文章
                <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPosts.map((post: any, index: number) => {
              const coverSrc = post.coverImage?.storageUrl || post.coverImage?.originalUrl || 'https://picsum.photos/seed/placeholder/1200/630';
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
                  <article className="border-2 border-brand-border-heavy bg-white overflow-hidden transition-all hover:shadow-[8px_8px_0_0_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] cursor-pointer">
                    <div className="aspect-[16/10] overflow-hidden bg-brand-surface relative border-b-2 border-brand-border-heavy">
                      <img
                        src={coverSrc}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {post.category?.name && (
                        <div className="absolute top-4 left-4">
                          <Badge
                            variant="default"
                            className="bg-white text-brand-text-primary border-2 border-brand-border-heavy font-mono text-xs"
                          >
                            {post.category.name}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-8">
                      <h3 className="font-display text-2xl font-bold text-brand-text-primary group-hover:text-brand-secondary transition-colors mb-4 leading-tight">
                        {post.title}
                      </h3>
                      <p className="text-brand-text-secondary text-base leading-relaxed mb-6 line-clamp-2">
                        {post.summary}
                      </p>
                      <div className="flex items-center gap-3 pt-6 border-t border-brand-border">
                        <span className="font-mono text-xs text-brand-text-muted">
                          {formatDate(post.publishedAt)}
                        </span>
                        <div className="w-1 h-1 bg-brand-text-muted rounded-full"></div>
                        <span className="font-mono text-xs text-brand-text-muted">
                          {post.readingTime || '5'} 分钟
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-brand-primary">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-4xl md:text-6xl font-bold text-brand-text-inverted mb-8 leading-tight">
              准备好建立你的<br />
              <span className="text-brand-secondary">海外获客系统了吗？</span>
            </h2>
            <p className="text-xl text-brand-text-inverted/80 mb-12 leading-relaxed">
              免费获取一份专属于你的获客诊断报告，了解最适合你的获客方法组合
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-5 mb-12">
              <Link href="/consultation">
                <Button
                  as="span"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto text-lg bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(255,255,255,0.3)] hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold cursor-pointer px-10 py-4"
                >
                  获取免费诊断
                  <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </Button>
              </Link>
              <Link href="/blog">
                <Button
                  as="span"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base text-brand-text-inverted border-2 border-brand-text-inverted/30 hover:bg-brand-text-inverted/10 transition-colors cursor-pointer"
                >
                  先看看方法文章
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
