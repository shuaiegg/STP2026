"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { CheckCircle2, Search, BarChart2, Users, X, ArrowRight } from 'lucide-react';

// ─── COPY & config (file scope for i18n readiness) ────────────────────────────


const STEPS_CONFIG = [
  {
    id: 'gsc' as const,
    titleKey: 'gscTitle',
    descKey: 'gscDesc',
    icon: Search,
  },
  {
    id: 'ga4' as const,
    titleKey: 'ga4Title',
    descKey: 'ga4Desc',
    icon: BarChart2,
  },
  {
    id: 'competitors' as const,
    titleKey: 'compTitle',
    descKey: 'compDesc',
    icon: Users,
  },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface NextStepsBannerProps {
  siteId: string;
  hasGsc: boolean;
  hasGa4: boolean;
  hasCompetitors: boolean;
}

// ─── NextStepsBanner ──────────────────────────────────────────────────────────

export function NextStepsBanner({ siteId, hasGsc, hasGa4, hasCompetitors }: NextStepsBannerProps) {
  const t = useTranslations('dashboard.nextSteps');
  const [isDismissed, setIsDismissed] = useState(true); // default true prevents flash

  useEffect(() => {
    const dismissed = localStorage.getItem(`stp_next_steps_dismissed_${siteId}`);
    if (!dismissed) {
      setIsDismissed(false);
    }
  }, [siteId]);

  const handleDismiss = () => {
    localStorage.setItem(`stp_next_steps_dismissed_${siteId}`, '1');
    setIsDismissed(true);
  };

  if (isDismissed || (hasGsc && hasGa4 && hasCompetitors)) return null;

  const doneMap: Record<string, boolean> = { gsc: hasGsc, ga4: hasGa4, competitors: hasCompetitors };
  const hrefMap: Record<string, string> = {
    gsc: `/dashboard/site-intelligence/${siteId}#integrations`,
    ga4: `/dashboard/site-intelligence/${siteId}#integrations`,
    competitors: `/dashboard/site-intelligence/${siteId}#competitors`,
  };

  return (
    <div
      role="region"
      aria-label={t('title')}
      className="bg-gradient-to-r from-brand-primary/10 via-white to-brand-primary/5 border border-brand-primary/20 rounded-lg p-6 relative overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 duration-700"
    >
      <div className="absolute top-4 right-4">
        <button
          onClick={handleDismiss}
          aria-label={t('dismissLabel')}
          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        <div className="flex flex-col gap-1 max-w-sm">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{t('title')}</h2>
          <p className="text-sm text-slate-500 font-medium">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          {STEPS_CONFIG.map(step => {
            const done = doneMap[step.id];
            const href = hrefMap[step.id];
            return (
              <Link
                key={step.id}
                href={href}
                className={`flex flex-col gap-3 p-4 rounded-lg border transition-shadow ${
                  done
                    ? 'bg-emerald-50/50 border-emerald-100 opacity-80'
                    : 'bg-white border-slate-100 hover:border-brand-primary/30 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    <step.icon size={18} aria-hidden="true" />
                  </div>
                  {done && <CheckCircle2 size={16} aria-hidden="true" className="text-emerald-500" />}
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">{t(step.titleKey)}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{t(step.descKey)}</p>
                </div>
                {!done && (
                  <div className="pt-1 flex items-center text-[11px] font-black text-brand-primary uppercase tracking-widest">
                    {t('connectNow')} <ArrowRight size={12} aria-hidden="true" className="ml-1" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
