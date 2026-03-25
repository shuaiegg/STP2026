import React from 'react';
import { HealthScoreBadge } from '@/components/ui/HealthScoreBadge';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Zap } from 'lucide-react';
import Link from 'next/link';

// ─── COPY (file scope for i18n readiness) ─────────────────────────────────────

const COPY = {
  scoreNow: '立即评分',
  viewMap: '查看星图',
  runAudit: '运行新审计',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SiteHeaderProps {
  site: {
    id: string;
    domain: string;
    latestAudit?: {
      overallScore: number | null;
    } | null;
  };
}

// ─── SiteHeader ───────────────────────────────────────────────────────────────

export function SiteHeader({ site }: SiteHeaderProps) {
  const score = site.latestAudit?.overallScore ?? null;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display italic">
            {site.domain}
          </h1>
          <HealthScoreBadge score={score} />
          {score === null && (
            <Link
              href={`/dashboard/site-intelligence/instant-audit?siteId=${site.id}&rescan=1`}
              className="text-xs font-bold text-brand-primary hover:underline underline-offset-4 flex items-center gap-1"
            >
              <Zap size={12} aria-hidden="true" />
              {COPY.scoreNow}
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href={`/dashboard/site-intelligence/instant-audit?siteId=${site.id}`}>
          <Button variant="outline" size="sm" className="rounded-lg font-bold h-9">
            {COPY.viewMap}
          </Button>
        </Link>
        <Link href={`/dashboard/site-intelligence/instant-audit?siteId=${site.id}&rescan=1`}>
          <Button
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-5 font-bold h-9 flex items-center gap-2"
          >
            <RefreshCw size={14} aria-hidden="true" />
            {COPY.runAudit}
          </Button>
        </Link>
      </div>
    </div>
  );
}
