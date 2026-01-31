import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getPublishedContent } from '@/lib/content';

export const dynamic = 'force-dynamic';

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
      {/* Hero Section - Editorial Magazine Style */}
      <section className="relative pt-32 pb-40 md:pt-48 md:pb-56 overflow-hidden bg-brand-surface">
        {/* Structured Grid Background - Suggests System & Methodology */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="grid-bg-dense h-full w-full"></div>
        </div>

        {/* Geometric Flow Accent - Top Right */}
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
            {/* Eyebrow - Process Indicator */}
            <div className="flex items-center gap-4 mb-12 opacity-0 animate-slide-in-left">
              <div className="h-[2px] w-12 bg-brand-secondary"></div>
              <span className="font-mono text-xs tracking-[0.2em] text-brand-text-muted uppercase font-bold">
                可复制的获客方法
              </span>
            </div>

            {/* Main Headline - Result-Focused per Brand Guidelines */}
            <h1 className="font-display text-6xl md:text-[5.5rem] font-black leading-[0.95] mb-10 tracking-tight opacity-0 animate-slide-in-up stagger-1">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary bg-[length:200%_auto] animate-gradient-x">
                帮中国企业
              </span>
              <br />
              <span className="relative inline-block text-brand-text-primary mt-2">
                稳定获取
                <svg className="absolute -bottom-3 left-0 w-full h-4 opacity-30 text-brand-secondary" viewBox="0 0 300 20" preserveAspectRatio="none">
                  <path d="M0,10 Q75,5 150,10 T300,10" stroke="currentColor" strokeWidth="6" fill="none" />
                </svg>
              </span>
              <br />
              <span className="text-brand-text-primary">海外询盘与客户</span>
            </h1>

            {/* Subtitle - Method Focus, No Abstract Terms */}
            <p className="text-xl md:text-2xl text-brand-text-secondary leading-relaxed mb-16 max-w-3xl opacity-0 animate-slide-in-up stagger-2 font-normal">
              通过<span className="font-semibold text-brand-text-primary">广告、内容与工具的组合</span>，把一次性的海外获客，变成可长期使用的获客方式
            </p>

            {/* CTA Buttons - Per Brand Guidelines */}
            <div className="flex flex-col sm:flex-row gap-5 opacity-0 animate-slide-in-up stagger-3">
              <Link href="/blog">
                <Button
                  as="span"
                  variant="default"
                  size="lg"
                  className="w-full sm:w-auto text-base bg-brand-primary hover:bg-brand-primary-hover text-brand-text-inverted border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-[6px_6px_0_0_rgba(10,10,10,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  查看获客方法与实战拆解
                </Button>
              </Link>
              <Link href="/tools">
                <Button
                  as="span"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base border-2 border-brand-border-heavy hover:bg-brand-surface-alt transition-colors"
                >
                  正在构建的工具
                  <span className="ml-2 text-xs font-mono text-brand-text-muted">BETA</span>
                </Button>
              </Link>
            </div>

            {/* Trust Indicators - Subtle */}
            <div className="flex items-center gap-8 mt-16 text-sm text-brand-text-muted opacity-0 animate-slide-in-up stagger-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-secondary rounded-full"></div>
                <span>长期可用的方法</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-secondary rounded-full"></div>
                <span>实战验证的流程</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-secondary rounded-full"></div>
                <span>可复制的组合</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition - Second Screen, Can Introduce "System" Concepts */}
      <section className="py-32 relative border-t-2 border-brand-border bg-gradient-to-b from-transparent to-brand-surface/30">
        {/* Section Header */}
        <div className="max-w-7xl mx-auto px-6 mb-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs tracking-[0.25em] text-brand-secondary uppercase font-bold">01</span>
              <div className="h-[1px] flex-1 bg-brand-border"></div>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-brand-text-primary mb-6 leading-tight">
              把零散的获客动作<br />变成<span className="text-brand-secondary">可持续的流程</span>
            </h2>
            <p className="text-lg text-brand-text-secondary leading-relaxed">
              不同于一次性的广告投放或零散技巧，我们关注的是如何通过方法组合，建立长期稳定的获客体系
            </p>
          </div>
        </div>

        {/* Three Value Props - Structured Grid Layout */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group relative">
              <div className="border-2 border-brand-border-heavy p-10 bg-white transition-all hover:shadow-[8px_8px_0_0_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px]">
                <div className="mb-8">
                  <div className="font-mono text-4xl font-bold text-brand-primary mb-2">01</div>
                  <div className="h-1 w-12 bg-brand-secondary"></div>
                </div>
                <h3 className="font-display text-2xl font-bold text-brand-text-primary mb-5 leading-snug">
                  广告投放<br />不只是投广告
                </h3>
                <p className="text-brand-text-secondary leading-relaxed text-base mb-6">
                  从受众定位到落地页设计，从转化追踪到数据分析，完整的广告获客流程让每一分预算都有明确的回报路径
                </p>
                <div className="flex items-center gap-2 text-sm font-mono text-brand-text-muted">
                  <svg className="w-4 h-4 text-brand-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  <span>稳定可控</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative">
              <div className="border-2 border-brand-border-heavy p-10 bg-white transition-all hover:shadow-[8px_8px_0_0_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px]">
                <div className="mb-8">
                  <div className="font-mono text-4xl font-bold text-brand-primary mb-2">02</div>
                  <div className="h-1 w-12 bg-brand-secondary"></div>
                </div>
                <h3 className="font-display text-2xl font-bold text-brand-text-primary mb-5 leading-snug">
                  内容产出<br />从单篇到流程
                </h3>
                <p className="text-brand-text-secondary leading-relaxed text-base mb-6">
                  建立可复用的内容生产流程，从关键词研究到文章结构，从 SEO 优化到持续更新，让内容成为长期资产
                </p>
                <div className="flex items-center gap-2 text-sm font-mono text-brand-text-muted">
                  <svg className="w-4 h-4 text-brand-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  <span>长期累积</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative">
              <div className="border-2 border-brand-border-heavy p-10 bg-white transition-all hover:shadow-[8px_8px_0_0_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px]">
                <div className="mb-8">
                  <div className="font-mono text-4xl font-bold text-brand-primary mb-2">03</div>
                  <div className="h-1 w-12 bg-brand-secondary"></div>
                </div>
                <h3 className="font-display text-2xl font-bold text-brand-text-primary mb-5 leading-snug">
                  工具辅助<br />提升效率和规模
                </h3>
                <p className="text-brand-text-secondary leading-relaxed text-base mb-6">
                  通过工具产品化，把重复的人工操作变成可规模化的流程，让小团队也能实现大规模的获客动作
                </p>
                <div className="flex items-center gap-2 text-sm font-mono text-brand-text-muted">
                  <svg className="w-4 h-4 text-brand-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  <span>可规模化</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Process Flow Visualization */}
        <div className="max-w-7xl mx-auto px-6 mt-20">
          <div className="border-2 border-brand-border-heavy p-12 bg-brand-surface-alt relative overflow-hidden">
            {/* Flow Diagram Background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                <path d="M50,100 L150,100 L150,80 L250,80 L250,120 L350,120 L350,100 L450,100"
                  stroke="currentColor" strokeWidth="3" fill="none" className="text-brand-primary"/>
                <circle cx="50" cy="100" r="8" fill="currentColor" className="text-brand-secondary"/>
                <circle cx="250" cy="100" r="8" fill="currentColor" className="text-brand-secondary"/>
                <circle cx="450" cy="100" r="8" fill="currentColor" className="text-brand-secondary"/>
              </svg>
            </div>

            <div className="relative z-10">
              <div className="font-mono text-xs tracking-[0.2em] text-brand-secondary uppercase font-bold mb-4">
                方法组合示例
              </div>
              <p className="text-lg text-brand-text-primary font-semibold mb-2">
                广告获客 + SEO 内容 + 营销自动化工具 = 可持续的客户获取体系
              </p>
              <p className="text-sm text-brand-text-muted">
                每个环节相互配合，形成长期稳定的获客机制
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Content - Editorial Grid */}
      <section className="py-32 bg-white border-t-2 border-brand-border">
        {/* Section Header */}
        <div className="max-w-7xl mx-auto px-6 mb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-xs tracking-[0.25em] text-brand-secondary uppercase font-bold">02</span>
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
                className="border-2 border-brand-border-heavy hover:bg-brand-surface transition-colors group"
              >
                查看全部文章
                <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </Button>
            </Link>
          </div>
        </div>

        {/* Articles Grid */}
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
                  <article className="border-2 border-brand-border-heavy bg-white overflow-hidden transition-all hover:shadow-[8px_8px_0_0_rgba(10,10,10,1)] hover:translate-x-[-4px] hover:translate-y-[-4px]">
                    {/* Image */}
                    <div className="aspect-[16/10] overflow-hidden bg-brand-surface relative border-b-2 border-brand-border-heavy">
                      <img
                        src={coverSrc}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* Category Badge Overlay */}
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

                    {/* Content */}
                    <div className="p-8">
                      <h3 className="font-display text-2xl font-bold text-brand-text-primary group-hover:text-brand-secondary transition-colors mb-4 leading-tight">
                        {post.title}
                      </h3>
                      <p className="text-brand-text-secondary text-base leading-relaxed mb-6 line-clamp-2">
                        {post.summary}
                      </p>

                      {/* Meta */}
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

      {/* CTA Section - Strong, Clear */}
      <section className="py-32 px-6 bg-brand-primary border-t-2 border-brand-border-heavy">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-4xl md:text-6xl font-bold text-brand-text-inverted mb-8 leading-tight">
              开始建立你的<br />
              <span className="text-brand-secondary">长期获客方法</span>
            </h2>
            <p className="text-xl text-brand-text-inverted/80 mb-12 leading-relaxed">
              从实战案例中学习可复制的方法，逐步建立适合自己业务的获客流程
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-5 mb-12">
              <Link href="/blog">
                <Button
                  as="span"
                  variant="default"
                  size="lg"
                  className="w-full sm:w-auto text-base bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(255,255,255,0.3)] hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
                >
                  浏览实战文章
                </Button>
              </Link>
              <Link href="/course">
                <Button
                  as="span"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base text-brand-text-inverted border-2 border-brand-text-inverted/30 hover:bg-brand-text-inverted/10 transition-colors"
                >
                  查看完整框架
                </Button>
              </Link>
            </div>

            {/* Trust Line */}
            <p className="text-sm text-brand-text-inverted/60 font-mono">
              所有方法均来自实战验证，专注长期可用的获客体系构建
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
