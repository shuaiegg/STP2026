import React from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, Search, BarChart2, Lightbulb } from 'lucide-react';
import { useTranslations } from 'next-intl';

// ─── Config (file scope for icons) ──────────────────────────────────────────

const ICONS = {
  'gsc': Search,
  'ga4': BarChart2,
  'content-plan': Lightbulb,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface IntegrationGuidanceCardProps {
  type: 'gsc' | 'ga4' | 'content-plan';
  href?: string;
  onClick?: () => void;
}

// ─── IntegrationGuidanceCard ──────────────────────────────────────────────────

export function IntegrationGuidanceCard({ type, href, onClick }: IntegrationGuidanceCardProps) {
  const t = useTranslations('dashboard.integrationGuidance');
  const Icon = ICONS[type];

  const content = (
    <>
      <div className="w-14 h-14 bg-white border border-slate-100 rounded-lg flex items-center justify-center mx-auto text-slate-400 group-hover:text-brand-primary transition-colors shadow-sm">
        <div className="relative">
          <Icon size={28} aria-hidden="true" />
          <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
            <Lock size={12} aria-hidden="true" className="text-slate-300" />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">{t(`${type}.title` as any)}</h3>
        <p className="text-sm text-slate-500 font-medium max-w-[220px] mx-auto">{t(`${type}.desc` as any)}</p>
      </div>

      <div className="inline-flex items-center gap-2 text-sm font-black text-brand-primary uppercase tracking-widest pt-2">
        {t(`${type}.cta` as any)}
        <ArrowRight size={16} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" />
      </div>
    </>
  );

  const className = "group block w-full p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg hover:bg-white hover:border-brand-primary/40 hover:shadow-md transition-all text-center space-y-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href || '#'} className={className}>
      {content}
    </Link>
  );
}
