'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type Severity = 'critical' | 'warning' | 'info';

export interface AffectedPage {
  url: string;
  detail?: string;
}

export interface IssueCardProps {
  code: string;
  severity: Severity;
  title: string;
  explanation: string;
  howToFix: string;
  affectedPages: AffectedPage[];
}

export default function IssueCard({
  code,
  severity,
  title,
  explanation,
  howToFix,
  affectedPages
}: IssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations('dashboard.issueCard');
  const tAudit = useTranslations('dashboard.audit.issues');

  const getSeverityStyles = (sev: Severity) => {
    switch (sev) {
      case 'critical':
        return {
          badge: 'bg-brand-error/10 text-brand-error border-brand-error/20',
          icon: <AlertCircle className="w-5 h-5 text-brand-error" />,
          label: t('severity.critical')
        };
      case 'warning':
        return {
          badge: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
          icon: <AlertTriangle className="w-5 h-5 text-brand-warning" />,
          label: t('severity.warning')
        };
      case 'info':
      default:
        return {
          badge: 'bg-brand-info/10 text-brand-info border-brand-info/20',
          icon: <Info className="w-5 h-5 text-brand-info" />,
          label: t('severity.info')
        };
    }
  };

  const styles = getSeverityStyles(severity);

  // Use translated content if available for the code, fallback to props.
  // Use .raw() so message text containing HTML-like snippets (e.g. "<head>", "<meta>")
  // is returned literally instead of being parsed as next-intl rich-text tags.
  const displayTitle = tAudit.has(`${code}.title`) ? (tAudit.raw(`${code}.title`) as string) : title;
  const displayExplanation = tAudit.has(`${code}.explanation`) ? (tAudit.raw(`${code}.explanation`) as string) : explanation;
  const displayHowToFix = tAudit.has(`${code}.howToFix`) ? (tAudit.raw(`${code}.howToFix`) as string) : howToFix;

  return (
    <Card className="bg-white border-brand-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button 
        type="button"
        className="w-full text-left p-4 cursor-pointer flex items-start justify-between gap-4 focus:outline-none focus-visible:bg-brand-surface/75 focus-visible:ring-2 focus-visible:ring-brand-primary/30 rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="flex gap-3 items-start">
          <div className="mt-0.5">{styles.icon}</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={`${styles.badge} text-[10px] py-0 px-1.5 font-bold border`}>
                {styles.label}
              </Badge>
              <h4 className="text-sm font-bold text-brand-text-primary">{displayTitle}</h4>
            </div>
            <p className="text-xs text-brand-text-secondary line-clamp-1">
              {t('affectedPages', { count: affectedPages.length })}
            </p>
          </div>
        </div>
        <div className="text-brand-text-muted mt-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>


      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-brand-border/30 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-2">
            <h5 className="text-[10px] font-bold tracking-widest text-brand-text-muted uppercase">{t('explanation')}</h5>
            <p className="text-xs text-brand-text-secondary leading-relaxed">{displayExplanation}</p>
          </div>

          <div className="space-y-2">
            <h5 className="text-[10px] font-bold tracking-widest text-brand-text-muted uppercase">{t('howToFix')}</h5>
            <div className="bg-brand-surface p-3 rounded-lg border border-brand-border/50">
              <p className="text-xs text-brand-text-secondary font-medium leading-relaxed">{displayHowToFix}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h5 className="text-[10px] font-bold tracking-widest text-brand-text-muted uppercase">{t('affectedPagesTitle', { count: affectedPages.length })}</h5>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {affectedPages.map((page, idx) => (
                <div key={idx} className="flex flex-col gap-0.5 py-1.5 px-2 bg-brand-surface/50 rounded-md border border-brand-border/30">
                  <a 
                    href={page.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[11px] text-brand-primary hover:underline font-mono break-all line-clamp-1"
                  >
                    {page.url}
                  </a>
                  {page.detail && (
                    <span className="text-[10px] text-brand-text-muted font-medium">{page.detail}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
