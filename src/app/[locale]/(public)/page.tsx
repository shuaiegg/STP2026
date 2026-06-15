/* eslint-disable react/no-unescaped-entities, @typescript-eslint/no-explicit-any */
// ISR: statically generated, revalidated hourly. Publishing content also calls
// revalidatePath('/') / ('/zh'), so changes appear immediately — not only after 1h.
export const revalidate = 3600;

import React from 'react';
import Image from 'next/image';
import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getPublishedContent } from '@/lib/content';
import { 
  Search, 
  PenTool, 
  LineChart, 
  ChevronRight, 
  Zap, 
  ShieldCheck, 
  ArrowUpRight,
  MessageCircle,
  BarChart3
} from 'lucide-react';

import { getMetadataAlternates, BASE_URL } from '@/lib/seo/locale-metadata';
import { Suspense } from 'react';
import { HeroAuditInput } from './HomePageCTA';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home.meta' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: locale === 'zh' ? `${BASE_URL}/zh` : BASE_URL,
      languages: getMetadataAlternates(''),
    },
    openGraph: {
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      images: [
        {
          url: locale === 'zh' ? '/api/og?locale=zh' : '/api/og?locale=en',
          width: 1200,
          height: 630,
          alt: 'ScaletoTop Home',
        },
      ],
    },
  };
}

function SectionHeading({ subtitle, title, description, centered = false }: { 
  subtitle: string; 
  title: string; 
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={`mb-16 ${centered ? 'text-center max-w-2xl mx-auto' : 'max-w-3xl'}`}>
      <span className="text-sm text-brand-secondary font-bold mb-4 block uppercase tracking-wider">
        {subtitle}
      </span>
      <h2 className="font-display text-3xl md:text-5xl font-black text-brand-text-primary mb-6 leading-tight tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-brand-text-secondary leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

function PillarCard({ title, desc, learnMore, icon: Icon, color }: { title: string; desc: string; learnMore: string; icon: any; color: string }) {
  return (
    <div className="group border border-brand-border rounded-xl p-8 bg-white hover:shadow-xl transition-[border-color,transform,box-shadow] duration-300 h-full flex flex-col">
      <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-brand-text-primary mb-4">{title}</h3>
      <p className="text-brand-text-secondary leading-relaxed flex-1">
        {desc}
      </p>
      <div className="mt-8 pt-6 border-t border-brand-border/50">
        <div className="flex items-center text-sm font-bold text-brand-text-muted group-hover:text-brand-secondary transition-colors duration-200">
          {learnMore} <ChevronRight className="ml-1 w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

async function FeaturedPosts({ locale }: { locale: string }) {
  const t = await getTranslations('home.resources');
  let contents: any[] = [];
  try {
    const result = await getPublishedContent({ locale }, { limit: 3 });
    contents = result?.contents || [];
  } catch (error) {
    console.error('Failed to fetch published content for home page:', error);
    contents = [];
  }

  if (contents.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {contents.map((post: any) => {
        const coverSrc = post.coverImage?.storageUrl || post.coverImage?.originalUrl || '/logo-512.png';
        return (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
            <Card className="h-full border-brand-border/50 hover:border-brand-secondary/50 overflow-hidden flex flex-col transition-[border-color,box-shadow] duration-300">
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src={coverSrc}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-brand-text-primary mb-2 line-clamp-2 group-hover:text-brand-secondary transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-brand-text-secondary line-clamp-2">
                  {post.summary}
                </p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const steps = t.raw('process.steps') as { title: string; desc: string }[];
  const pricingFeatures = t.raw('pricing.features') as string[];

  return (
    <div className="flex flex-col">
      {/* ① Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden bg-white">
        {/* Background Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-brand-primary/5 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-brand-surface border border-brand-border mb-8 animate-slide-in-up">
              <Zap className="w-4 h-4 text-brand-secondary mr-2 fill-brand-secondary" />
              <span className="text-xs font-bold text-brand-text-primary tracking-wide uppercase">
                {locale === 'zh' ? '14 维度全站语义审计已就绪' : '14-Dimension Semantic Audit Ready'}
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-black leading-[1.1] mb-8 tracking-tight text-brand-text-primary">
              {t('hero.title')}
            </h1>

            <p className="text-lg md:text-xl text-brand-text-secondary leading-relaxed mb-12 max-w-2xl mx-auto animate-slide-in-up stagger-2">
              {t('hero.subtitle')}
            </p>

            <HeroAuditInput 
              placeholder={t('hero.inputPlaceholder')}
              cta={t('hero.cta')}
              microcopy={t('hero.microcopy')}
              locale={locale}
            />
          </div>
        </div>
      </section>

      {/* ③ Pillars Section */}
      <section className="py-24 md:py-32 bg-brand-surface border-y border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading 
            subtitle={locale === 'zh' ? '核心能力' : 'Capabilities'}
            title={locale === 'zh' ? '诊断 → 生产 → 验证' : 'Diagnose → Produce → Verify'}
            description={locale === 'zh' ? '全链路闭环，让 SEO 变成可计算、可观测的工程指标。' : 'A closed-loop system that turns SEO into a measurable, engineered metric.'}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PillarCard
              title={t('pillars.diagnosis.title')}
              desc={t('pillars.diagnosis.desc')}
              learnMore={t('pillars.learnMore')}
              icon={Search}
              color="bg-emerald-50 text-emerald-600"
            />
            <PillarCard
              title={t('pillars.production.title')}
              desc={t('pillars.production.desc')}
              learnMore={t('pillars.learnMore')}
              icon={PenTool}
              color="bg-amber-50 text-amber-600"
            />
            <PillarCard
              title={t('pillars.verification.title')}
              desc={t('pillars.verification.desc')}
              learnMore={t('pillars.learnMore')}
              icon={LineChart}
              color="bg-blue-50 text-blue-600"
            />
          </div>
        </div>
      </section>

      {/* ④ How It Works (Steps) */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading 
            centered
            subtitle={locale === 'zh' ? '运作机制' : 'How It Works'}
            title={t('process.title')}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-px bg-dashed border-t border-dashed border-brand-border -translate-y-1/2 z-0" />
            
            {steps.map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-brand-border flex items-center justify-center font-display text-2xl font-black text-brand-text-muted mb-8 group-hover:border-brand-secondary group-hover:text-brand-secondary transition-[border-color,color] duration-300">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-bold text-brand-text-primary mb-4">{step.title}</h3>
                <p className="text-brand-text-secondary leading-relaxed max-w-xs">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⑤ Pricing Section */}
      <section className="py-24 md:py-32 bg-brand-surface border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl bg-brand-primary p-8 md:p-16 overflow-hidden relative shadow-2xl">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-brand-secondary/20 rounded-full blur-[80px]" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-xl text-center md:text-left">
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
                  {t('pricing.title')}
                </h2>
                <p className="text-lg text-white/80 leading-relaxed mb-8">
                  {t('pricing.subtitle')}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-white/90 font-bold text-sm">
                  <div className="flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-brand-secondary" /> {pricingFeatures[0]}</div>
                  <div className="flex items-center"><Zap className="w-5 h-5 mr-2 text-brand-secondary" /> {pricingFeatures[1]}</div>
                  <div className="flex items-center"><ArrowUpRight className="w-5 h-5 mr-2 text-brand-secondary" /> {pricingFeatures[2]}</div>
                </div>
              </div>
              
              <Link href="/pricing" className="flex-shrink-0">
                <Button size="lg" className="px-10 h-16 text-lg bg-white text-brand-primary hover:bg-white/90 font-black rounded-xl">
                  {t('pricing.cta')}
                  <ChevronRight className="ml-2 w-6 h-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles Section */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <SectionHeading 
              subtitle={locale === 'zh' ? '增长洞察' : 'Insights'}
              title={locale === 'zh' ? '实战指南与案例' : 'Playbooks & Case Studies'}
            />
            <Link href="/blog">
              <Button variant="outline" className="mb-4">
                {locale === 'zh' ? '浏览全部文章' : 'View all articles'}
              </Button>
            </Link>
          </div>
          
          <Suspense fallback={<div className="h-64 animate-pulse bg-brand-surface rounded-xl" />}>
            <FeaturedPosts locale={locale} />
          </Suspense>
        </div>
      </section>

      {/* ⑥ Consultation Section */}
      <section className="py-16 bg-white border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-4 p-4 rounded-2xl bg-brand-surface border border-brand-border">
            <div className="w-10 h-10 rounded-full bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
              <MessageCircle className="w-5 h-5" />
            </div>
            <p className="font-bold text-brand-text-primary mr-4">
              {t('consultation.text')}
            </p>
            <Link href="/consultation">
              <Button variant="ghost" className="font-black text-brand-secondary hover:text-brand-secondary/80 p-0 h-auto">
                {t('consultation.cta')}
                <ChevronRight className="ml-1 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
