import React from 'react';
import Link from 'next/link';
import { ExternalLink, Calendar, ChevronRight, Plus } from 'lucide-react';
import { HealthScoreBadge } from '@/components/ui/HealthScoreBadge';

// ─── COPY (file scope for i18n readiness) ─────────────────────────────────────

const COPY = {
  title: '选择你的网站',
  subtitle: '查看并管理你已添加的 SEO 资产',
  enterWorkbench: '进入工作台',
  addSite: '添加新站点',
  addSiteDesc: '开启 AI 驱动的 SEO 增长',
  auditNever: '尚未审计',
  auditPrefix: '上次审计：',
} as const;

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

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  return `${Math.floor(hrs / 24)} 天前`;
}

// ─── SiteSelector ─────────────────────────────────────────────────────────────

export function SiteSelector({ sites }: SiteSelectorProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{COPY.title}</h1>
        <p className="text-slate-500 font-medium">{COPY.subtitle}</p>
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
                    ? `${COPY.auditPrefix}${timeAgo(site.lastAuditAt)}`
                    : COPY.auditNever}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-sm font-bold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">
                {COPY.enterWorkbench}
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
            <h3 className="font-bold text-slate-900">{COPY.addSite}</h3>
            <p className="text-xs text-slate-500">{COPY.addSiteDesc}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
