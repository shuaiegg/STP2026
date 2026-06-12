import NextLink from 'next/link';
import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getMetadataAlternates, localeCanonical, BASE_URL } from '@/lib/seo/locale-metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about.meta' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localeCanonical(locale, '/about'),
      languages: getMetadataAlternates('/about'),
    },
    openGraph: {
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      images: [
        {
          url: locale === 'zh' ? '/api/og?locale=zh' : '/api/og?locale=en',
          width: 1200,
          height: 630,
          alt: 'ScaletoTop About',
        },
      ],
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');
  const COPY = {
    badge: t('badge'),
    heroHeadline: t('heroHeadline'),
    heroHighlight: t('heroHighlight'),
    heroDescription: t('heroDescription'),
    philosophyLabel: t('philosophyLabel'),
    philosophyHeadline: t('philosophyHeadline'),
    principles: t.raw('principles') as { number: string; title: string; description: string }[],
    statsLabel: t('statsLabel'),
    stats: t.raw('stats') as { value: string; label: string }[],
    techLabel: t('techLabel'),
    techHeadline: t('techHeadline'),
    techDescription: t('techDescription'),
    techFeatures: t.raw('techFeatures') as string[],
    ctaHeadline: t('ctaHeadline'),
    ctaDescription: t('ctaDescription'),
    ctaPrimary: t('ctaPrimary'),
    ctaSecondary: t('ctaSecondary'),
  };
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl animate-slide-in-up">
          <Badge variant="muted" className="mb-6">{COPY.badge}</Badge>
          <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight mb-6 text-brand-text-primary tracking-tight">
            {COPY.heroHeadline}
          </h1>
          <p className="text-xl text-brand-secondary font-semibold mb-4">{COPY.heroHighlight}</p>
          <p className="text-lg text-brand-text-secondary leading-relaxed max-w-2xl">
            {COPY.heroDescription}
          </p>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y border-brand-border bg-brand-surface">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-xs font-mono text-brand-text-muted uppercase tracking-widest mb-8">{COPY.statsLabel}</p>
          <div className="grid grid-cols-3 gap-8 md:gap-16 max-w-lg">
            {COPY.stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-mono font-bold text-brand-text-primary">{stat.value}</div>
                <div className="text-xs text-brand-text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHILOSOPHY ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-xs font-mono text-brand-secondary uppercase tracking-widest mb-3">{COPY.philosophyLabel}</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-text-primary tracking-tight max-w-xl">
            {COPY.philosophyHeadline}
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {COPY.principles.map((p) => (
            <div key={p.number} className="border border-brand-border rounded-lg p-8 bg-white hover:shadow-md transition-shadow">
              <div className="text-4xl font-mono font-bold text-brand-border mb-6">{p.number}</div>
              <h3 className="text-lg font-display font-bold text-brand-text-primary mb-3">{p.title}</h3>
              <p className="text-brand-text-secondary leading-relaxed text-sm">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TECHNOLOGY ── */}
      <section className="bg-brand-primary">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-mono text-brand-secondary uppercase tracking-widest mb-4">{COPY.techLabel}</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight mb-6">
                {COPY.techHeadline}
              </h2>
              <p className="text-brand-text-muted leading-relaxed mb-10">
                {COPY.techDescription}
              </p>
              <ul className="space-y-3">
                {COPY.techFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/10 p-8 font-mono text-sm text-brand-text-muted">
              <pre className="overflow-hidden leading-relaxed">
{`{
  "platform": "ScaletoTop",
  "version": "2026",
  "engine": "IntelligenceEngine",
  "strategy": "Internal-Driven",
  "goals": [
    "Semantic Integrity",
    "Topical Authority",
    "Zero-Friction Execution"
  ],
  "status": "Active"
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-12 md:p-16 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-brand-text-primary mb-4 tracking-tight">
            {COPY.ctaHeadline}
          </h2>
          <p className="text-brand-text-secondary mb-10 leading-relaxed">
            {COPY.ctaDescription}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <NextLink href="/dashboard/site-intelligence/instant-audit">
              <Button size="lg">{COPY.ctaPrimary}</Button>
            </NextLink>
            <Link href="/pricing">
              <Button size="lg" variant="outline">{COPY.ctaSecondary}</Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
