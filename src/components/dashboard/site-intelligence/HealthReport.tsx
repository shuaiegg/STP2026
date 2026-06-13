'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import IssueCard from './IssueCard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface HealthReportProps {
  issueReport: {
    techScore: number;
    contentScore: number;
    seoScore: number;
    issues: any[];
    stats: {
      critical: number;
      warning: number;
      info: number;
    };
  } | null;
  previousIssueReport?: HealthReportProps['issueReport'] | null;
}

export default function HealthReport({ issueReport, previousIssueReport }: HealthReportProps) {
  const t = useTranslations('dashboard.healthReport');

  if (!issueReport) {
    return (
      <Card className="bg-slate-50 border-slate-200 border-dashed p-12 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <span className="text-xl text-slate-400">?</span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">{t('noData')}</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          {t('noDataDesc')}
        </p>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-100';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  const scoreCards = [
    { label: t('techLabel'), score: issueReport.techScore },
    { label: t('contentLabel'), score: issueReport.contentScore },
    { label: t('seoLabel'), score: issueReport.seoScore },
  ];

  // Calculate Delta
  let deltaInfo = null;
  if (previousIssueReport) {
    const currentCodes = new Set(issueReport.issues.map(i => i.code));
    const previousCodes = new Set(previousIssueReport.issues.map(i => i.code));

    const newIssues = Array.from(currentCodes).filter(code => !previousCodes.has(code));
    const fixedIssues = Array.from(previousCodes).filter(code => !currentCodes.has(code));

    // Persistent issues: compare affected pages count
    const pageCountChanges = Array.from(currentCodes)
      .filter(code => previousCodes.has(code))
      .map(code => {
        const curIssue = issueReport.issues.find(i => i.code === code);
        const prevIssue = previousIssueReport.issues.find(i => i.code === code);
        const diff = (curIssue?.affectedPages?.length || 0) - (prevIssue?.affectedPages?.length || 0);
        return { code, title: curIssue?.title, diff };
      })
      .filter(change => change.diff !== 0);

    deltaInfo = {
      newCount: newIssues.length,
      fixedCount: fixedIssues.length,
      pageCountChanges
    };
  }

  return (
    <div className="space-y-6">
      {/* Delta Banner */}
      {deltaInfo && (
        <Card className="px-4 py-3 border-slate-200 bg-slate-50/50 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('delta.title')}</span>
            <div className="h-3 w-[1px] bg-slate-200 mx-1" />
            <div className="flex items-center gap-4">
              {deltaInfo.newCount === 0 && deltaInfo.fixedCount === 0 ? (
                <div className="flex items-center gap-1.5">
                  <Minus className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">{t('delta.noChange')}</span>
                </div>
              ) : (
                <>
                  {deltaInfo.newCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs font-bold text-slate-700">{t('delta.newIssues', { count: deltaInfo.newCount })}</span>
                    </div>
                  )}
                  {deltaInfo.fixedCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-700">{t('delta.fixedIssues', { count: deltaInfo.fixedCount })}</span>
                    </div>
                  )}
                  {deltaInfo.pageCountChanges.slice(0, 2).map((change) => (
                    <div key={change.code} className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded border border-slate-100">
                      {change.diff > 0 ? <TrendingDown className="w-3 h-3 text-rose-400" /> : <TrendingUp className="w-3 h-3 text-emerald-400" />}
                      <span className="text-[10px] font-bold text-slate-500">
                        {change.title}: {change.diff > 0 ? '↑' : '↓'} {t('delta.pages', { count: Math.abs(change.diff) })}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          {deltaInfo.fixedCount > 0 && deltaInfo.newCount === 0 && issueReport.issues.length === 0 && (
            <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-bold animate-pulse">
              {t('delta.allFixed')}
            </Badge>
          )}
        </Card>
      )}

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scoreCards.map((card, idx) => (
          <Card key={idx} className={`p-6 flex flex-col items-center justify-center gap-2 border shadow-sm ${getScoreColor(card.score)}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{card.label}</span>
            <div className="text-4xl font-black tracking-tight">{card.score}</div>
          </Card>
        ))}
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">{t('issues.title', { count: issueReport.issues.length })}</h3>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold text-slate-500">{issueReport.stats.critical} {t('issues.critical')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-slate-500">{issueReport.stats.warning} {t('issues.warning')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-slate-500">{issueReport.stats.info} {t('issues.info')}</span>
            </div>
          </div>
        </div>

        {issueReport.issues.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {issueReport.issues.map((issue, idx) => (
              <IssueCard key={idx} {...issue} />
            ))}
          </div>
        ) : (
          <Card className="p-12 border-dashed border-green-200 bg-green-50/30 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <span className="text-xl text-green-600">✓</span>
            </div>
            <h3 className="text-sm font-bold text-green-800">{t('issues.notFound')}</h3>
            <p className="text-xs text-green-600/70">
              {t('issues.notFoundDesc')}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
