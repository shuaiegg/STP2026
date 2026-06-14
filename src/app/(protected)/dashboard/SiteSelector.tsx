import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ExternalLink, Calendar, ChevronRight, Plus } from 'lucide-react';
import { HealthScoreBadge } from '@/components/ui/HealthScoreBadge';

// ─── COPY (file scope for i18n readiness) ─────────────────────────────────────


// ─── Types ────────────────────────────────────────────────────────────────────

interface Site {
  id: string;
  domain: string;
  latestHealthScore: number | null;
  lastAuditAt: Date | null;
}

interface SiteSelectorProps {
  sites: Site[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date, t: (k: string, v?: Record<string, string | number | Date>) => string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return t('justNow');
  if (mins < 60) return t('minsAgo', { n: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('hrsAgo', { n: hrs });
  return t('daysAgo', { n: Math.floor(hrs / 24) });
}

// ─── SiteSelector ─────────────────────────────────────────────────────────────

export function SiteSelector({ sites }: SiteSelectorProps) {
  const t = useTranslations('dashboard.siteSelector');
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('title')}</h1>
        <p className="text-slate-500 font-medium">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map(site => (
          <Link
            key={site.id}
            href={`/dashboard/site-intelligence/${site.id}`}
            className="group bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/5 transition-colors">
                  <ExternalLink size={24} aria-hidden="true" />
                </div>
                <HealthScoreBadge score={site.latestHealthScore} className="scale-110 origin-right" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 truncate mb-1">{site.domain}</h2>

              <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
                <Calendar size={14} aria-hidden="true" />
                <span>
                  {site.lastAuditAt
                    ? `${t('auditPrefix')}${timeAgo(site.lastAuditAt, t)}`
                    : t('auditNever')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-sm font-bold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">
                {t('enterWorkbench')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all">
                <ChevronRight size={18} aria-hidden="true" />
              </div>
            </div>
          </Link>
        ))}

        {/* Add New Site Card */}
        <Link
          href="/dashboard/onboarding"
          className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-6 hover:bg-white hover:border-brand-primary/40 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all">
            <Plus size={24} aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{t('addSite')}</h3>
            <p className="text-xs text-slate-500">{t('addSiteDesc')}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
