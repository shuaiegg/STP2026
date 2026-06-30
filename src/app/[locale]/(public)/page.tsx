// ISR: statically generated, revalidated hourly. Publishing content also calls
// revalidatePath('/') / ('/zh'), so changes appear immediately — not only after 1h.
export const revalidate = 3600;

import React, { Suspense } from 'react';
import Image from 'next/image';
import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getPublishedContent } from '@/lib/content';
import {
  ChevronRight,
  Zap,
  MessageCircle,
  CheckCircle,
  XCircle,
  Search,
  Bot,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';

import { getMetadataAlternates, BASE_URL } from '@/lib/seo/locale-metadata';
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
          alt: 'ScaletoTop — Free SEO + GEO Audit',
        },
      ],
    },
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <span className="text-sm text-brand-secondary font-bold mb-4 block uppercase tracking-wider">
      {text}
    </span>
  );
}

function SectionHeading({ label, title, description, centered = false }: {
  label: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={`mb-12 ${centered ? 'text-center max-w-2xl mx-auto' : 'max-w-3xl'}`}>
      <SectionLabel text={label} />
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function FeaturedPosts({ locale }: { locale: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let contents: any[] = [];
  try {
    const result = await getPublishedContent({ locale }, { limit: 3 });
    contents = result?.contents || [];
  } catch {
    contents = [];
  }

  if (contents.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proofItems = t.raw('proof.items') as string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const painItems = t.raw('pain.items') as { title: string; desc: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const steps = t.raw('steps.steps') as { title: string; desc: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compareRows = t.raw('compare.rows') as { feature: string; us: boolean; seoOnly: boolean; writingOnly: boolean }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compareCols = t.raw('compare.cols') as string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faqItems = t.raw('faq.items') as { q: string; a: string }[];

  return (
    <div className="flex flex-col">

      {/* ① Hero */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-secondary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-brand-primary/5 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-brand-surface border border-brand-border mb-8 animate-slide-in-up">
              <Zap className="w-4 h-4 text-brand-secondary mr-2 fill-brand-secondary" />
              <span className="text-xs font-bold text-brand-text-primary tracking-wide uppercase">
                {locale === 'zh' ? 'SEO + GEO 双引擎可见度' : 'SEO + GEO Visibility — Free Audit'}
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

      {/* ② Proof — what you'll see */}
      <section className="py-16 md:py-24 bg-brand-surface border-y border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <SectionLabel text={t('proof.label')} />
              <h2 className="font-display text-3xl md:text-4xl font-black text-brand-text-primary mb-4 leading-tight">
                {t('proof.title')}
              </h2>
              <p className="text-brand-text-secondary mb-8 leading-relaxed">
                {t('proof.desc')}
              </p>
              <ul className="space-y-3">
                {proofItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-brand-text-secondary">
                    <CheckCircle className="w-5 h-5 text-brand-secondary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/audit">
                  <Button className="bg-brand-secondary hover:bg-brand-secondary/90 text-brand-text-primary font-bold rounded-lg">
                    {t('cta.primary')}
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-brand-border bg-white shadow-sm aspect-[4/3]">
              <Image
                src="/assets/images/site-intelligence.png"
                alt="Site Intelligence audit report showing SEO health score and issues"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ③ Pain points */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading
            label={t('pain.label')}
            title={t('pain.title')}
            centered
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {painItems.map((item, i) => (
              <div key={i} className="p-6 bg-brand-surface border border-brand-border rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-brand-error/10 flex items-center justify-center mb-4">
                  <XCircle className="w-5 h-5 text-brand-error" />
                </div>
                <h3 className="font-bold text-brand-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-brand-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ④ Method — SEO + GEO education */}
      <section className="py-24 md:py-32 bg-brand-surface border-y border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading
            label={t('method.label')}
            title={t('method.title')}
            description={t('method.desc')}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-white border border-brand-border rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-brand-secondary-muted flex items-center justify-center mb-6">
                <Search className="w-6 h-6 text-brand-secondary" />
              </div>
              <h3 className="font-display text-xl font-black text-brand-text-primary mb-3">
                {t('method.seo.title')}
              </h3>
              <p className="text-brand-text-secondary leading-relaxed">
                {t('method.seo.desc')}
              </p>
            </div>
            <div className="p-8 bg-white border border-brand-border rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-brand-accent-muted flex items-center justify-center mb-6">
                <Bot className="w-6 h-6 text-brand-accent-hover" />
              </div>
              <h3 className="font-display text-xl font-black text-brand-text-primary mb-3">
                {t('method.geo.title')}
              </h3>
              <p className="text-brand-text-secondary leading-relaxed">
                {t('method.geo.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ⑤ How it works — 3 steps, no "register first" */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading
            centered
            label={t('steps.label')}
            title={t('steps.title')}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px border-t border-dashed border-brand-border z-0" />
            {steps.map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-brand-border flex items-center justify-center font-display text-2xl font-black text-brand-text-muted mb-8 group-hover:border-brand-secondary group-hover:text-brand-secondary transition-[border-color,color] duration-300">
                  {idx + 1}
                </div>
                <h3 className="text-xl font-bold text-brand-text-primary mb-4">{step.title}</h3>
                <p className="text-brand-text-secondary leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⑥ Compare — trust / differentiation */}
      <section className="py-24 md:py-32 bg-brand-surface border-y border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading
            label={t('compare.label')}
            title={t('compare.title')}
          />
          <div className="overflow-x-auto rounded-xl border border-brand-border">
            <table className="w-full bg-white text-sm">
              <thead>
                <tr className="border-b border-brand-border">
                  {compareCols.map((col, i) => (
                    <th
                      key={i}
                      className={`px-6 py-4 text-left font-bold ${i === 0 ? 'text-brand-text-primary' : i === 1 ? 'text-brand-secondary' : 'text-brand-text-muted'}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr key={i} className="border-b border-brand-border/50 last:border-0 hover:bg-brand-surface/50 transition-colors">
                    <td className="px-6 py-4 text-brand-text-primary font-medium">{row.feature}</td>
                    <td className="px-6 py-4">
                      {row.us ? <CheckCircle className="w-5 h-5 text-brand-success" /> : <XCircle className="w-5 h-5 text-brand-text-muted/30" />}
                    </td>
                    <td className="px-6 py-4">
                      {row.seoOnly ? <CheckCircle className="w-5 h-5 text-brand-text-muted" /> : <XCircle className="w-5 h-5 text-brand-text-muted/30" />}
                    </td>
                    <td className="px-6 py-4">
                      {row.writingOnly ? <CheckCircle className="w-5 h-5 text-brand-text-muted" /> : <XCircle className="w-5 h-5 text-brand-text-muted/30" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ⑦ FAQ */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <SectionHeading
            centered
            label={t('faq.label')}
            title={t('faq.title')}
          />
          <div className="space-y-2">
            {faqItems.map((item, i) => (
              <details key={i} className="group border border-brand-border rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none font-semibold text-brand-text-primary hover:bg-brand-surface transition-colors">
                  {item.q}
                  <ChevronDown className="w-4 h-4 text-brand-text-muted group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4" />
                </summary>
                <div className="px-6 pb-5 text-brand-text-secondary text-sm leading-relaxed border-t border-brand-border/50 pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ⑧ Single CTA */}
      <section className="py-24 md:py-32 bg-brand-surface border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl bg-brand-primary p-8 md:p-16 overflow-hidden relative shadow-2xl text-center">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-brand-secondary/20 rounded-full blur-[80px]" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <SectionLabel text={t('cta.label')} />
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight font-display">
                {t('cta.title')}
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/audit">
                  <Button size="lg" className="px-10 h-14 text-base bg-brand-secondary hover:bg-brand-secondary/90 text-brand-text-primary font-black rounded-xl">
                    {t('cta.primary')}
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/consultation">
                  <Button variant="ghost" size="lg" className="px-10 h-14 text-base text-white/80 hover:text-white border border-white/20 hover:bg-white/10 rounded-xl">
                    {t('cta.secondary')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <SectionHeading
              label={t('insights.label')}
              title={t('insights.title')}
            />
            <Link href="/blog">
              <Button variant="outline" className="mb-4 shrink-0">
                {locale === 'zh' ? '浏览全部文章' : 'View all articles'}
              </Button>
            </Link>
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse bg-brand-surface rounded-xl" />}>
            <FeaturedPosts locale={locale} />
          </Suspense>
        </div>
      </section>

      {/* Consultation strip */}
      <section className="py-16 bg-white border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-4 p-4 rounded-xl bg-brand-surface border border-brand-border">
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
