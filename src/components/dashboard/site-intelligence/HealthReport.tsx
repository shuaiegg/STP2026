'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import IssueCard from './IssueCard';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
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
    badPages?: any[];
  } | null;
  previousIssueReport?: HealthReportProps['issueReport'] | null;
}

export default function HealthReport({ issueReport, previousIssueReport }: HealthReportProps) {
  const t = useTranslations('dashboard.healthReport');

  if (!issueReport) {
    return (
      <Card className="bg-brand-surface border-brand-border border-dashed p-12 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-brand-surface-alt flex items-center justify-center mb-4">
          <span className="text-xl text-brand-text-muted">?</span>
        </div>
        <h3 className="text-sm font-bold text-brand-text-primary mb-1">{t('noData')}</h3>
        <p className="text-xs text-brand-text-secondary max-w-xs">
          {t('noDataDesc')}
        </p>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-brand-success bg-brand-secondary-muted/30 border-brand-secondary/20';
    if (score >= 50) return 'text-brand-warning bg-brand-accent-muted/30 border-brand-accent/20';
    return 'text-brand-error bg-brand-error/10 border-brand-error/20';
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
        <Card className="px-4 py-3 border-brand-border bg-brand-surface/50 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">{t('delta.title')}</span>
            <div className="h-3 w-[1px] bg-brand-border mx-1" />
            <div className="flex items-center gap-4">
              {deltaInfo.newCount === 0 && deltaInfo.fixedCount === 0 ? (
                <div className="flex items-center gap-1.5">
                  <Minus className="w-3.5 h-3.5 text-brand-text-muted" />
                  <span className="text-xs font-bold text-brand-text-secondary">{t('delta.noChange')}</span>
                </div>
              ) : (
                <>
                  {deltaInfo.newCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-brand-error" />
                      <span className="text-xs font-bold text-brand-text-secondary">{t('delta.newIssues', { count: deltaInfo.newCount })}</span>
                    </div>
                  )}
                  {deltaInfo.fixedCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-brand-success" />
                      <span className="text-xs font-bold text-brand-text-secondary">{t('delta.fixedIssues', { count: deltaInfo.fixedCount })}</span>
                    </div>
                  )}
                  {deltaInfo.pageCountChanges.slice(0, 2).map((change) => (
                    <div key={change.code} className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-background rounded border border-brand-border">
                      {change.diff > 0 ? <TrendingDown className="w-3 h-3 text-brand-error" /> : <TrendingUp className="w-3 h-3 text-brand-success" />}
                      <span className="text-[10px] font-bold text-brand-text-secondary">
                        {change.title}: {change.diff > 0 ? '↑' : '↓'} {t('delta.pages', { count: Math.abs(change.diff) })}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          {deltaInfo.fixedCount > 0 && deltaInfo.newCount === 0 && issueReport.issues.length === 0 && (
            <Badge className="bg-brand-secondary text-white border-0 text-[10px] font-bold animate-pulse">
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

      {/* Dead Pages Warning Banner */}
      {issueReport.badPages && issueReport.badPages.length > 0 && (
        <Card className="p-4 rounded-xl border border-brand-error/20 bg-brand-error/10 flex items-start gap-3 shadow-sm">
          <AlertCircle className="text-brand-error shrink-0 mt-0.5" size={16} />
          <div className="space-y-1">
            <p className="text-xs font-bold text-brand-error">
              {t('issues.badPagesFound', { count: issueReport.badPages.length })}
            </p>
            <p className="text-[10px] text-brand-text-secondary leading-relaxed">
              {t('issues.badPagesDesc')}
            </p>
          </div>
        </Card>
      )}

      {/* Issues List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-brand-text-primary">{t('issues.title', { count: issueReport.issues.length })}</h3>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-brand-error" />
              <span className="text-[10px] font-bold text-brand-text-secondary">{issueReport.stats.critical} {t('issues.critical')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-brand-warning" />
              <span className="text-[10px] font-bold text-brand-text-secondary">{issueReport.stats.warning} {t('issues.warning')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-brand-info" />
              <span className="text-[10px] font-bold text-brand-text-secondary">{issueReport.stats.info} {t('issues.info')}</span>
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
          <Card className="p-12 border-dashed border-brand-success/30 bg-brand-success/5 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-brand-success/15 flex items-center justify-center mb-4 text-brand-success">
              <span className="text-xl">✓</span>
            </div>
            <h3 className="text-sm font-bold text-brand-success mb-1">{t('issues.notFound')}</h3>
            <p className="text-xs text-brand-text-muted">
              {t('issues.notFoundDesc')}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
