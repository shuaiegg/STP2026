/* eslint-disable react/no-unescaped-entities, @typescript-eslint/no-explicit-any */
export const dynamic = 'force-dynamic';

import React from 'react';
import Image from 'next/image';
import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getPublishedContent } from '@/lib/content';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.scaletotop.com';

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
}

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
function ProcessStep({ number, stepLabel, title, description, icon }: {
  number: string;
  stepLabel: string;
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
            <div className="font-mono text-xs text-brand-text-muted mb-2">{stepLabel} {number}</div>
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
import { HeroCTA, BottomCTA } from './HomePageCTA';

function PostsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[0, 1, 2].map((i) => (
        <div key={i} className="border border-brand-border rounded-lg bg-white h-[320px] animate-pulse" />
      ))}
    </div>
  );
}

async function FeaturedPosts({ locale }: { locale: string }) {
  const t = await getTranslations('home.resources');
  let contents: any[] = [];
  try {
    const result = await getPublishedContent({}, { limit: 3 });
    contents = result?.contents || [];
  } catch (error) {
    console.error('Failed to fetch published content for home page:', error);
    contents = [];
  }

  const formatDate = (date: Date | null) => {
    if (!date) return t('notPublished');
    return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (contents.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-brand-border rounded-lg bg-white">
        <h3 className="font-bold text-brand-text-primary mb-2">{t('emptyTitle')}</h3>
        <p className="text-brand-text-secondary text-sm">{t('emptyDesc')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {contents.map((post: any, index: number) => {
        const coverSrc = post.coverImage?.storageUrl || post.coverImage?.originalUrl || '/logo-512.png';
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
                    {t('minutes', { count: post.readingTime || 5 })}
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

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const stats = t.raw('metrics.stats') as { value: number; suffix: string; label: string }[];
  const steps = t.raw('process.steps') as { num: string; title: string; desc: string }[];
  const methods = t.raw('methods.items') as { num: string; title: string; desc: string; tags: string[]; label: string }[];
  const testimonials = t.raw('testimonials.items') as { quote: string; author: string; role: string; company: string; result: string }[];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}

      <section className="relative py-24 md:py-32 overflow-hidden bg-brand-surface">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-4 mb-8 animate-slide-in-up">
              <Badge className="bg-brand-secondary/10 text-brand-secondary">
                {t('hero.badge')}
              </Badge>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
              <span className="text-brand-text-primary">{t('hero.titleLine1')}</span>
              <br />
              <span className="text-brand-secondary">
                {t('hero.titleLine2')}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-brand-text-secondary leading-relaxed mb-10 max-w-2xl mx-auto animate-slide-in-up stagger-2">
              {t('hero.subtitle')}
            </p>

            <HeroCTA
              primary={t('hero.ctaPrimary')}
              secondary={t('hero.ctaSecondary')}
              microText={t('hero.ctaPrimaryMicro')}
            />
          </div>
        </div>
      </section>

      {/* Metrics Bar */}
      <section className="py-20 border-y border-brand-border bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(stat => (
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
              {t('clients.title')}
            </p>
          </div>
          <ClientLogos />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm text-brand-secondary font-bold mb-4 block">{t('process.subtitle')}</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-text-primary mb-4 leading-tight">
              {t('process.titleLine1')} <span className="text-brand-secondary">{t('process.titleLine2')}</span>
            </h2>
            <p className="text-brand-text-secondary leading-relaxed">
              {t('process.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((step, idx) => (
              <ProcessStep
                key={step.num}
                number={step.num}
                stepLabel={t('process.stepLabel')}
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
            <span className="text-sm text-brand-secondary font-bold mb-4 block">{t('methods.subtitle')}</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-text-primary mb-4 leading-tight">
              {t('methods.titleLine1')} <span className="text-brand-secondary">{t('methods.titleLine2')}</span>
            </h2>
            <p className="text-brand-text-secondary leading-relaxed">
              {t('methods.description')}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {methods.map(method => (
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
            <span className="text-sm text-brand-secondary font-bold mb-4 block">{t('testimonials.subtitle')}</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-text-primary leading-tight">
              {t('testimonials.titleLine1')} <span className="text-brand-secondary">{t('testimonials.titleLine2')}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map(item => (
              <TestimonialCard
                key={item.author}
                quote={item.quote}
                author={item.author}
                role={item.role}
                company={item.company}
                result={item.result}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Content */}
      <section className="py-24 bg-brand-surface border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <span className="text-sm text-brand-secondary font-bold mb-4 block">{t('resources.subtitle')}</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-text-primary leading-tight">
                {t('resources.titleLine1')} <br/> {t('resources.titleLine2')}
              </h2>
            </div>
            <Link href="/blog">
              <Button as="span" variant="outline">
                {t('resources.cta')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <Suspense fallback={<PostsSkeleton />}>
            <FeaturedPosts locale={locale} />
          </Suspense>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-brand-primary">
        <div className="max-w-7xl mx-auto text-center max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {t('cta.titleLine1')} <br/>
            <span className="text-brand-secondary">{t('cta.titleLine2')}</span>
          </h2>
          <p className="text-lg text-white/80 mb-10 leading-relaxed">
            {t('cta.subtitle')}
          </p>
          <BottomCTA primary={t('cta.primary')} secondary={t('cta.secondary')} />
        </div>
      </section>
    </div>
  );
}
