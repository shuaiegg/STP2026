'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import {
  Globe, ArrowRight, CheckCircle, XCircle, AlertTriangle, Info,
  ChevronDown, ChevronUp, ShieldCheck, ShieldX, ShieldQuestion, Loader2
} from 'lucide-react';
import posthog from 'posthog-js';

// ─── Types ───────────────────────────────────────────────────────────────────

interface IssueItem {
  code: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  explanation: string;
  howToFix: string;
  affectedPages: { url: string; detail?: string }[];
}

interface AuditIssueReport {
  techScore: number;
  contentScore: number;
  seoScore: number;
  geoScore: number;
  issues: IssueItem[];
  stats: { critical: number; warning: number; info: number };
  geoSignals?: {
    site: {
      aiCrawlerStatus: Record<string, 'allowed' | 'blocked' | 'unknown'>;
      hasLlmsTxt: boolean | null;
    };
  };
}

type ScanState =
  | { phase: 'idle' }
  | { phase: 'scanning'; status: string; scanned?: number; total?: number }
  | { phase: 'done'; domain: string; report: AuditIssueReport; pageCount: number; cached?: boolean }
  | { phase: 'error'; message: string };

// ─── Constants ───────────────────────────────────────────────────────────────

const COPY = {
  domainInputAriaLabel: 'Enter domain to audit',
  expandIssue: 'Expand issue details',
  collapseIssue: 'Collapse issue details',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'text-brand-success' : score >= 50 ? 'text-brand-warning' : 'text-brand-error';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-4xl font-black font-display ${color}`}>{score}</div>
      <div className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}

function SeverityBadge({ severity, label }: { severity: string; label: string }) {
  const styles = {
    critical: 'bg-brand-error/10 text-brand-error border-brand-error/20',
    warning: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
    info: 'bg-brand-info-muted text-brand-info-hover border-brand-info-muted',
  }[severity] ?? 'bg-brand-surface text-brand-text-muted border-brand-border';

  const icons = {
    critical: <XCircle className="w-3 h-3" />,
    warning: <AlertTriangle className="w-3 h-3" />,
    info: <Info className="w-3 h-3" />,
  }[severity];

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${styles}`}>
      {icons}
      {label}
    </span>
  );
}

function IssueCard({ issue, t }: { issue: IssueItem; t: ReturnType<typeof useTranslations> }) {
  const [expanded, setExpanded] = useState(false);

  const severityLabel = t(`results.severity.${issue.severity}` as Parameters<typeof t>[0]);

  return (
    <div className="border border-brand-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-brand-surface transition-colors"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? COPY.collapseIssue : COPY.expandIssue}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <SeverityBadge severity={issue.severity} label={severityLabel} />
          <span className="font-semibold text-brand-text-primary text-sm truncate">{issue.title}</span>
          {issue.affectedPages.length > 0 && (
            <span className="text-xs text-brand-text-muted shrink-0">
              {t('results.affectsPages', { count: issue.affectedPages.length })}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-brand-text-muted shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-brand-text-muted shrink-0 ml-2" />}
      </button>

      {expanded && (
        <div className="border-t border-brand-border bg-brand-surface p-4 space-y-4">
          <div>
            <p className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1">{t('results.explanation')}</p>
            <p className="text-sm text-brand-text-secondary">{issue.explanation}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1">{t('results.howToFix')}</p>
            <p className="text-sm text-brand-text-secondary">{issue.howToFix}</p>
          </div>

          {/* Register-to-act CTA per issue */}
          <div className="pt-2 border-t border-brand-border/50">
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-brand-secondary border-brand-secondary/50 hover:bg-brand-secondary/5 text-xs">
                {t('action.fixCta')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function GeoStatus({ status }: { status: 'allowed' | 'blocked' | 'unknown' }) {
  if (status === 'allowed') return <CheckCircle className="w-4 h-4 text-brand-success" />;
  if (status === 'blocked') return <XCircle className="w-4 h-4 text-brand-error" />;
  return <ShieldQuestion className="w-4 h-4 text-brand-text-muted" />;
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AuditClient({ locale }: { locale: string }) {
  const t = useTranslations('publicAudit');
  const searchParams = useSearchParams();
  const domainParam = searchParams.get('domain') ?? '';

  const [inputDomain, setInputDomain] = useState(domainParam);
  const [scanState, setScanState] = useState<ScanState>({ phase: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  // Auto-start if domain provided in URL
  useEffect(() => {
    if (domainParam) {
      setInputDomain(domainParam);
      startAudit(domainParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function normalizeDomainInput(raw: string): string {
    return raw.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '');
  }

  async function startAudit(raw: string) {
    const cleaned = normalizeDomainInput(raw);
    if (!cleaned || !cleaned.includes('.') || cleaned.length < 4) {
      setScanState({ phase: 'error', message: t('error.invalidDomain') });
      return;
    }

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setScanState({ phase: 'scanning', status: t('scanning.discovery') });

    posthog.capture('public_audit_started', { domain: cleaned, locale });

    try {
      const res = await fetch('/api/public-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleaned }),
        signal: abort.signal,
      });

      if (res.status === 429) {
        setScanState({ phase: 'error', message: t('error.rateLimited') });
        return;
      }

      if (!res.ok || !res.body) {
        setScanState({ phase: 'error', message: t('error.generic') });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleEvent(event, cleaned);
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      setScanState({ phase: 'error', message: t('error.generic') });
    }
  }

  function handleEvent(event: Record<string, unknown>, domain: string) {
    switch (event.type) {
      case 'discovery':
        setScanState({ phase: 'scanning', status: t('scanning.progress'), scanned: 0, total: (event.scanLimit as number) ?? 0 });
        break;
      case 'progress':
        setScanState({ phase: 'scanning', status: t('scanning.progress'), scanned: event.scanned as number, total: event.total as number });
        break;
      case 'cached':
      case 'done':
        setScanState({
          phase: 'done',
          domain: (event.domain as string) ?? domain,
          report: event.issueReport as AuditIssueReport,
          pageCount: event.pageCount as number,
          cached: event.type === 'cached',
        });
        posthog.capture('public_audit_done', { domain, locale, cached: event.type === 'cached' });
        break;
      case 'error':
        const code = event.code as string;
        const msg = code === 'UNREACHABLE' ? t('error.unreachable') : t('error.generic');
        setScanState({ phase: 'error', message: msg });
        posthog.capture('public_audit_error', { domain, locale, code });
        break;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startAudit(inputDomain);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const isScanning = scanState.phase === 'scanning';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      {/* Domain input form */}
      <form onSubmit={handleSubmit} className="mb-10">
        <label className="block text-sm font-semibold text-brand-text-primary mb-2">
          {t('form.label')}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center px-4 gap-3 bg-white border border-brand-border rounded-lg focus-within:border-brand-secondary/50 transition-colors">
            <Globe className="w-4 h-4 text-brand-text-muted shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={inputDomain}
              onChange={e => setInputDomain(e.target.value)}
              placeholder={t('form.inputPlaceholder')}
              aria-label={COPY.domainInputAriaLabel}
              className="w-full py-3 bg-transparent text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none text-sm"
              disabled={isScanning}
            />
          </div>
          <Button
            type="submit"
            disabled={isScanning}
            className="px-6 bg-brand-secondary hover:bg-brand-secondary/90 text-brand-text-primary font-bold rounded-lg shrink-0"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
        <p className="mt-2 text-xs text-brand-text-muted">{t('form.microcopy')}</p>
      </form>

      {/* Scanning state */}
      {scanState.phase === 'scanning' && (
        <div className="rounded-xl border border-brand-border bg-brand-surface p-8 text-center">
          <Loader2 className="w-10 h-10 text-brand-secondary animate-spin mx-auto mb-4" />
          <p className="font-semibold text-brand-text-primary mb-1">{scanState.status}</p>
          {scanState.scanned !== undefined && scanState.total !== undefined && scanState.total > 0 && (
            <p className="text-sm text-brand-text-muted">
              {scanState.scanned} / {scanState.total}
            </p>
          )}
        </div>
      )}

      {/* Error state */}
      {scanState.phase === 'error' && (
        <div className="rounded-xl border border-brand-error/20 bg-brand-error/10 p-6">
          <XCircle className="w-6 h-6 text-brand-error mb-2" />
          <p className="font-semibold text-brand-error">{scanState.message}</p>
        </div>
      )}

      {/* Results */}
      {scanState.phase === 'done' && (
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-xl font-black text-brand-text-primary font-display mb-1">
              {t('results.title', { domain: scanState.domain })}
            </h1>
            <p className="text-sm text-brand-text-muted">
              {t('results.pagesScanned', { count: scanState.pageCount })}
              {scanState.cached && ` · ${t('results.cached')}`}
            </p>
          </div>

          {/* Score row */}
          <div className="flex items-center justify-around p-6 bg-white border border-brand-border rounded-xl">
            <ScoreRing score={scanState.report.techScore} label={t('results.scoreLabel')} />
            <div className="w-px h-12 bg-brand-border" />
            <ScoreRing score={scanState.report.geoScore} label={t('results.geoLabel')} />
          </div>

          {/* GEO signals */}
          {scanState.report.geoSignals?.site && (
            <div className="p-4 bg-white border border-brand-border rounded-xl">
              <p className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-3">
                {t('results.aiCrawlersTitle')}
              </p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(scanState.report.geoSignals.site.aiCrawlerStatus).map(([bot, status]) => (
                  <div key={bot} className="flex items-center gap-1.5 text-sm text-brand-text-secondary">
                    <GeoStatus status={status} />
                    <span className="font-medium">{bot}</span>
                    <span className="text-brand-text-muted capitalize">({status})</span>
                  </div>
                ))}
              </div>
              {scanState.report.geoSignals.site.hasLlmsTxt === true && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-brand-success">
                  <ShieldCheck className="w-4 h-4" />
                  <span>llms.txt found</span>
                </div>
              )}
            </div>
          )}

          {/* Issues */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-brand-text-primary">{t('results.issuesTitle')}</p>
              <span className="text-xs text-brand-text-muted">
                {t('results.issueCount', {
                  critical: scanState.report.stats.critical,
                  warning: scanState.report.stats.warning,
                  info: scanState.report.stats.info,
                })}
              </span>
            </div>

            {scanState.report.issues.length === 0 ? (
              <div className="p-6 bg-brand-success/10 border border-brand-success/20 rounded-xl text-center">
                <CheckCircle className="w-8 h-8 text-brand-success mx-auto mb-2" />
                <p className="font-semibold text-brand-success">{t('results.noIssuesTitle')}</p>
                <p className="text-sm text-brand-success/80 mt-1">{t('results.noIssuesDesc')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scanState.report.issues.map(issue => (
                  <IssueCard key={issue.code} issue={issue} t={t} />
                ))}
              </div>
            )}
          </div>

          {/* Register-to-act banner */}
          <div className="rounded-xl bg-brand-primary p-6 text-white">
            <p className="font-black text-lg mb-1">{t('action.title')}</p>
            <p className="text-white/80 text-sm mb-4">{t('action.desc')}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/login?domain=${encodeURIComponent(scanState.domain)}`}>
                <Button className="w-full sm:w-auto bg-brand-secondary hover:bg-brand-secondary/90 text-brand-text-primary font-bold">
                  {t('action.primary')}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/blog">
                <Button variant="ghost" className="w-full sm:w-auto text-white/80 hover:text-white hover:bg-white/10 border border-white/20">
                  {t('action.secondary')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
