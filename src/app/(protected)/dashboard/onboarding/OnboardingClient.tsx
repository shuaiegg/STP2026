"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Globe, ArrowRight, Loader2, CheckCircle2, AlertCircle, Sparkles, Target, Zap, ShieldCheck, X } from 'lucide-react';
import posthog from 'posthog-js';
import { useTranslations, useLocale } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type OnboardingState = 'IDLE' | 'ANALYZING' | 'CONFIRMING' | 'SAVING' | 'DONE' | 'ERROR';

// ─── OnboardingClient ─────────────────────────────────────────────────────────

export function OnboardingClient({ daysSinceSignup = 0 }: { daysSinceSignup?: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainFromUrl = searchParams.get('domain');
  const t = useTranslations('dashboard.onboarding');
  const locale = useLocale();
  
  const [domain, setDomain] = useState('');
  const [state, setState] = useState<OnboardingState>('IDLE');
  const [status, setStatus] = useState('');
  const [scanned, setScanned] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Results gathered during analysis
  const [businessDna, setBusinessDna] = useState<any>(null);
  const [inferredCompetitors, setInferredCompetitors] = useState<{ domain: string; reason: string }[]>([]);
  const [confirmedCompetitors, setConfirmedCompetitors] = useState<string[]>([]);
  const [auditData, setAuditData] = useState<any>(null);
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});
  const [showAllIssues, setShowAllIssues] = useState(false);

  // Auto-trigger audit if domain is provided
  React.useEffect(() => {
    const targetDomain = domainFromUrl || (typeof window !== 'undefined' ? window.sessionStorage.getItem('pending_audit_domain') : null);
    
    if (targetDomain && state === 'IDLE') {
      setDomain(targetDomain);
      handleStartInternal(targetDomain);
      
      // Clear session storage once triggered to avoid re-triggering
      if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('pending_audit_domain');
      }
    }
  }, [domainFromUrl]);

  const validateDomain = (val: string) => {
    if (!val) return t('validationEmpty');
    if (!val.includes('.')) return t('validationInvalid');
    return null;
  };

  const handleStart = async (e?: React.FormEvent) => {
    e?.preventDefault();
    handleStartInternal(domain);
  };

  const handleStartInternal = async (targetDomain: string) => {
    const err = validateDomain(targetDomain);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setError(null);
    setState('ANALYZING');
    setStatus('INITIALIZING_PROBE');
    posthog.capture('onboarding_started', { domain: targetDomain, auto: !!targetDomain });
    setScanned(0);
    setTotal(0);
    setBusinessDna(null);
    setInferredCompetitors([]);

    try {
      const response = await fetch('/api/dashboard/site-intelligence/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: targetDomain }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('errStart'));
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error(t('errStream'));
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event: any;
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (event.type === 'discovery') {
            setStatus('SITE_STRUCTURE_DISCOVERED');
            setTotal(event.urls?.length || 0);
          } else if (event.type === 'dna_extracted') {
            setBusinessDna(event.dna);
          } else if (event.type === 'competitors_inferred') {
            setInferredCompetitors(event.competitors);
            setConfirmedCompetitors(event.competitors.map((c: any) => c.domain));
          } else if (event.type === 'progress') {
            setStatus('SCANNING_GALAXY');
            setScanned(event.scanned);
            setTotal(event.total);
          } else if (event.type === 'done') {
            posthog.capture('audit_completed', { domain: targetDomain, scanned: event.scanned });
            setStatus('GALAXY_CONSTRUCTED');
            setAuditData(event);
            setState('CONFIRMING');
          } else if (event.type === 'error') {
            throw new Error(event.error || t('errAnalysis'));
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('errGeneric'));
      setState('ERROR');
    }
  };

  const handleFinalConfirm = async () => {
    setState('SAVING');
    setStatus('SAVING_RESULTS');
    
    try {
        const finalCompetitors = inferredCompetitors
            .filter(c => confirmedCompetitors.includes(c.domain));

        const saveRes = await fetch('/api/dashboard/site-intelligence/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              domain: domain,
              graphData: auditData.graphData,
              techScore: auditData.techScore,
              issueReport: auditData.issueReport,
              businessDna: businessDna || auditData.businessDna,
              competitors: finalCompetitors
            }),
          });
          
          const saveData = await saveRes.json();
          if (saveData.success) {
            posthog.capture('onboarding_completed', {
                domain: domain,
                competitors_count: finalCompetitors.length,
                has_dna: !!businessDna,
                days_since_signup: daysSinceSignup,
            });
            setState('DONE');
            // Land on the growth home (coach moment), not the raw tab grid.
            router.push(`/dashboard?onboarded=1`);
          } else {
            throw new Error(saveData.error || t('errSave'));
          }
    } catch (err: any) {
        console.error(err);
        setError(err.message || t('errGeneric'));
        setState('ERROR');
    }
  };

  const toggleCompetitor = (dom: string) => {
    setConfirmedCompetitors(prev => 
        prev.includes(dom) ? prev.filter(d => d !== dom) : [...prev, dom]
    );
  };

  const progressPercent = total > 0 ? Math.round((scanned / total) * 100) : 0;

  // --- RENDERING ---

  if (state === 'IDLE' || state === 'ERROR') {
    return (
      <Card className="p-8 md:p-12 bg-white border-brand-border-heavy shadow-xl rounded-xl space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-black uppercase tracking-widest mb-2">
            <Sparkles size={14} aria-hidden="true" />
            <span>{t('badge')}</span>
          </div>
          <h1 className="text-4xl font-black text-brand-text-primary tracking-tight leading-tight">
            {t('headline')}{' '}
            <span className="text-brand-primary italic">{t('headlineAccent')}</span>{' '}
            {t('headlineSuffix')}
          </h1>
          <p className="text-brand-text-muted text-lg font-medium max-w-sm mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <form onSubmit={handleStart} className="space-y-6 max-w-md mx-auto">
          <div className="space-y-2">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted group-focus-within:text-brand-primary transition-colors">
                <Globe size={20} aria-hidden="true" />
              </div>
              <input
                type="text"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value);
                  setValidationError(null);
                }}
                placeholder={t('placeholder')}
                className="block w-full pl-12 pr-4 py-4 bg-brand-surface border-2 border-brand-border rounded-xl text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-lg font-medium"
              />
            </div>
            {validationError && (
              <p className="text-brand-error text-xs font-bold flex items-center gap-1 animate-shake">
                <AlertCircle size={12} />
                {validationError}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full py-8 text-xl bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            disabled={state !== 'IDLE' && state !== 'ERROR'}
          >
            {t('submitIdle')}
            <ArrowRight className="ml-2 w-6 h-6" />
          </Button>

          <p className="text-center text-brand-text-muted text-xs font-medium">
            {t('costHint')}
          </p>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-brand-error/10 border border-brand-error/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="text-brand-error shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-brand-error">{t('errorTitle')}</p>
              <p className="text-xs text-brand-error leading-relaxed">{error}</p>
            </div>
          </div>
        )}
      </Card>
    );
  }

  if (state === 'ANALYZING' || state === 'CONFIRMING' || state === 'SAVING') {
    const isDone = state === 'CONFIRMING' || state === 'SAVING';
    const isSavingState = state === 'SAVING';

    if (isDone) {
      const techScore = auditData?.techScore ?? 0;
      const geoScore = auditData?.issueReport?.geoScore;
      const hasGeoSupport = geoScore !== undefined && geoScore !== null;
      const issuesList = auditData?.issueReport?.issues || [];
      const scannedCount = auditData?.scanned || scanned;
      const totalCount = auditData?.total || total;
      const badPages = auditData?.issueReport?.badPages || [];
      const badPagesCount = badPages.length;
      
      // Sort issues: Critical -> Warning -> Info
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      const sortedIssues = [...issuesList].sort((a, b) => {
        return (severityOrder[a.severity as keyof typeof severityOrder] ?? 99) - 
               (severityOrder[b.severity as keyof typeof severityOrder] ?? 99);
      });

      // Show top 3 by default, or all if showAllIssues is true
      const visibleIssues = showAllIssues ? sortedIssues : sortedIssues.slice(0, 3);
      
      // Get AI crawler status details
      const geoSite = auditData?.issueReport?.geoSignals?.site || auditData?.geoSignals?.site;
      const blockedBots = [];
      if (geoSite?.aiCrawlerStatus) {
        for (const [botName, botStatus] of Object.entries(geoSite.aiCrawlerStatus)) {
          if (botStatus === 'blocked') blockedBots.push(botName);
        }
      }
      const hasBlockedBots = blockedBots.length > 0;

      return (
        <Card className="p-6 md:p-10 bg-white border-brand-border-heavy shadow-2xl rounded-2xl space-y-8 animate-in fade-in zoom-in-95 duration-500 max-w-3xl mx-auto">
          {/* Header & Scan Bounding */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-border">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-brand-success/10 text-brand-success text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck size={12} />
                <span>{t('result.analysisCompleted')}</span>
              </div>
              <h2 className="text-2xl font-black text-brand-text-primary tracking-tight">
                {t('result.diagnosticReport', { domain })}
              </h2>
            </div>
            <div className="text-left md:text-right shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-surface border border-brand-border text-brand-text-muted">
                {t('result.preliminaryScan', { scanned: scannedCount, total: totalCount })}
              </span>
            </div>
          </div>

          {/* Narrative sequence wrapper */}
          <div className="space-y-8">
            
            {/* Phase 1: Business DNA (Understand You) */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-widest flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary font-mono text-[10px]">1</span>
                {t('result.businessUnderstanding')}
              </h3>
              
              {businessDna ? (
                <div className="p-6 rounded-2xl border-2 border-brand-success/30 bg-brand-success/5 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-4 top-4 text-brand-success/20 group-hover:scale-110 transition-transform">
                    <Sparkles size={40} />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-brand-success uppercase tracking-wider">{t('result.coreOffering')}</p>
                      <p className="text-sm font-bold text-brand-text-primary mt-0.5 leading-relaxed">
                        {businessDna.coreOfferings.join(' · ')}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div>
                        <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">{t('result.targetAudience')}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {businessDna.targetAudience.slice(0, 3).map((a: string) => (
                            <Badge key={a} variant="outline" className="bg-white border-brand-border-heavy text-brand-text-secondary text-[10px] font-bold px-2 py-0.5">{a}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">{t('result.brandTone')}</p>
                        <p className="text-xs text-brand-text-secondary mt-1 font-bold">{businessDna.brandTone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl border border-brand-border bg-brand-surface text-center">
                  <p className="text-xs text-brand-text-muted leading-relaxed">
                    {t('result.dnaFallbackDesc')}
                  </p>
                </div>
              )}
            </div>

            {/* Phase 2: GEO Readiness */}
            {hasGeoSupport && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-widest flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary font-mono text-[10px]">2</span>
                  {t('result.geoReadiness')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* GEO Score Card */}
                  <div className="p-5 rounded-2xl border-2 border-brand-info/30 bg-brand-info/5 flex flex-col items-center justify-center text-center shadow-sm">
                    <span className="text-[10px] font-bold text-brand-info uppercase tracking-wider">{t('result.geoScore')}</span>
                    <div className="text-3xl font-black text-brand-info mt-1 font-mono">{geoScore}/100</div>
                    <span className="text-[9px] text-brand-text-muted mt-1 leading-snug">
                      {t('result.geoScoreDesc')}
                    </span>
                  </div>

                  {/* AI Crawler Status Card */}
                  <div className="md:col-span-2 p-5 rounded-2xl border border-brand-border bg-white flex flex-col justify-between shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">{t('result.geoCrawlerStatus')}</span>
                        <h4 className="text-xs font-bold text-brand-text-primary mt-1">
                          {hasBlockedBots ? (
                            <span className="text-brand-error flex items-center gap-1">
                              <AlertCircle size={14} />
                              {t('result.geoCrawlersBlocked')}
                            </span>
                          ) : (
                            <span className="text-brand-success flex items-center gap-1">
                              <CheckCircle2 size={14} />
                              {t('result.geoCrawlersAllowed')}
                            </span>
                          )}
                        </h4>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-brand-border">
                      {['GPTBot', 'Google-Extended', 'ClaudeBot', 'PerplexityBot', 'CCBot'].map(bot => {
                        const isBlocked = geoSite?.aiCrawlerStatus?.[bot] === 'blocked';
                        const isAllowed = geoSite?.aiCrawlerStatus?.[bot] === 'allowed';
                        return (
                          <span 
                            key={bot} 
                            className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              isBlocked 
                                ? 'bg-brand-error/10 text-brand-error border border-brand-error/20' 
                                : isAllowed 
                                  ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' 
                                  : 'bg-brand-surface-alt text-brand-text-muted border border-brand-border'
                            }`}
                          >
                            {bot}: {isBlocked ? t('result.botStatus.blocked') : isAllowed ? t('result.botStatus.allowed') : t('result.botStatus.unknown')}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Phase 3: Issues Dragging Down Ranking (SEO & Tech Health) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-widest flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary font-mono text-[10px]">3</span>
                  {t('result.issuesTitle')}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">{t('result.techScore')}</span>
                  <span className={`text-sm font-black font-mono px-2 py-0.5 rounded ${
                    techScore >= 80 ? 'bg-brand-success/10 text-brand-success' : techScore >= 50 ? 'bg-brand-warning/10 text-brand-warning' : 'bg-brand-error/10 text-brand-error'
                  }`}>
                    {techScore}/100
                  </span>
                </div>
              </div>

              {/* Dead Pages Warning Banner */}
              {badPagesCount > 0 && (
                <div className="p-4 rounded-xl border border-brand-error/20 bg-brand-error/10 flex items-start gap-3">
                  <AlertCircle className="text-brand-error shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-brand-error">
                      {t('result.badPagesFound', { count: badPagesCount })}
                    </p>
                    <p className="text-[10px] text-brand-text-secondary leading-relaxed">
                      {t('result.badPagesDesc')}
                    </p>
                  </div>
                </div>
              )}

              {sortedIssues.length > 0 ? (
                <div className="space-y-3">
                  {visibleIssues.map((issue) => {
                    const isExpanded = !!expandedIssues[issue.code];
                    const isGeo = issue.code.startsWith('GEO_');
                    const isCritical = issue.severity === 'critical';
                    const isWarning = issue.severity === 'warning';
                    
                    return (
                      <div 
                        key={issue.code}
                        className={`border rounded-xl transition-all duration-200 bg-white ${
                          isCritical 
                            ? 'border-brand-error/20 hover:border-brand-error/40' 
                            : isWarning 
                              ? 'border-brand-warning/20 hover:border-brand-warning/40' 
                              : isGeo 
                                ? 'border-brand-info/20 hover:border-brand-info/40' 
                                : 'border-brand-border hover:border-brand-border-heavy'
                        }`}
                      >
                        {/* Issue Header */}
                        <button 
                          type="button"
                          onClick={() => setExpandedIssues(prev => ({ ...prev, [issue.code]: !prev[issue.code] }))}
                          className="w-full text-left p-4 flex items-start justify-between gap-3 cursor-pointer select-none focus:outline-none focus-visible:bg-brand-surface/75 focus-visible:ring-2 focus-visible:ring-brand-primary/30 rounded-t-xl"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex gap-3">
                            <div className="mt-0.5 shrink-0">
                              {isCritical ? (
                                <AlertCircle className="text-brand-error" size={16} />
                              ) : isWarning ? (
                                <AlertCircle className="text-brand-warning" size={16} />
                              ) : isGeo ? (
                                <Sparkles className="text-brand-info" size={16} />
                              ) : (
                                <AlertCircle className="text-brand-text-muted" size={16} />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-brand-text-primary leading-tight">
                                  {issue.title}
                                </h4>
                                {isGeo && (
                                  <Badge className="bg-brand-info/10 text-brand-info border-brand-info/20 text-[8px] font-bold py-0 px-1.5 uppercase">
                                    GEO
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[10px] text-brand-text-muted mt-1">
                                {t('result.affectsPages', { count: issue.affectedPages?.length || 0 })}
                              </p>
                            </div>
                          </div>

                          <div className="text-brand-text-muted shrink-0 mt-0.5">
                            {isExpanded ? <X size={14} /> : <ArrowRight size={14} className="rotate-90 md:rotate-0" />}
                          </div>
                        </button>


                        {/* Issue Details (Expanded) */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-brand-border bg-brand-surface/50 rounded-b-xl space-y-3 animate-in fade-in duration-200">
                            <div>
                              <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">{t('result.explanation')}</p>
                              <p className="text-xs text-brand-text-secondary mt-0.5 leading-relaxed">{issue.explanation}</p>
                            </div>
                            
                            <div>
                              <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">{t('result.howToFix')}</p>
                              <p className="text-xs text-brand-text-primary mt-0.5 font-bold leading-relaxed">{issue.howToFix}</p>
                            </div>

                            {issue.affectedPages && issue.affectedPages.length > 0 && (
                              <div>
                                <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider mb-1">
                                  {t('result.affectedPagesCount', { count: issue.affectedPages.length })}
                                </p>
                                <div className="max-h-24 overflow-y-auto space-y-1.5 bg-white p-2 rounded-lg border border-brand-border">
                                  {issue.affectedPages.map((ap: any, i: number) => (
                                    <div key={i} className="text-[10px] font-mono text-brand-text-secondary truncate flex items-center justify-between gap-2">
                                      <a 
                                        href={ap.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="hover:underline text-brand-primary truncate"
                                      >
                                        {ap.url.replace(/^https?:\/\/[^\/]+/, '') || '/'}
                                      </a>
                                      {ap.detail && (
                                        <span className="shrink-0 px-1 bg-brand-surface-alt border rounded text-[8px] text-brand-text-muted font-sans font-bold">
                                          {ap.detail}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {sortedIssues.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllIssues(prev => !prev)}
                      className="w-full py-2 bg-brand-surface border border-brand-border hover:bg-brand-surface-alt text-xs font-bold text-brand-text-secondary rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>
                        {showAllIssues 
                          ? t('result.collapseDetails') 
                          : t('result.viewAllIssues', { count: sortedIssues.length })}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-brand-success rounded-xl bg-brand-success/5 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-brand-success/15 flex items-center justify-center mx-auto text-brand-success">
                    ✓
                  </div>
                  <h4 className="text-xs font-bold text-brand-success">{t('result.noIssuesTitle')}</h4>
                  <p className="text-[10px] text-brand-text-muted max-w-sm mx-auto">
                    {t('result.noIssuesDesc')}
                  </p>
                </div>
              )}
            </div>

            {/* Phase 4: Opportunities (Competitors & Integrations) */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-widest flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary font-mono text-[10px]">4</span>
                {t('result.growthRadar')}
              </h3>

              {inferredCompetitors.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-brand-text-muted leading-relaxed">
                    {t('result.competitorsDesc')}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {inferredCompetitors.map((comp) => {
                      const isSelected = confirmedCompetitors.includes(comp.domain);
                      return (
                        <button
                          key={comp.domain}
                          type="button"
                          onClick={() => toggleCompetitor(comp.domain)}
                          className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3 group bg-white ${
                            isSelected 
                              ? 'border-brand-info/40 shadow-sm' 
                              : 'border-brand-border hover:border-brand-border-heavy opacity-60 grayscale'
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-brand-info border-brand-info text-white' : 'border-brand-border-heavy text-transparent'
                          }`}>
                            <CheckCircle2 size={10} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-xs truncate ${isSelected ? 'text-brand-info' : 'text-brand-text-secondary'}`}>{comp.domain}</p>
                            <p className="text-[10px] text-brand-text-muted line-clamp-1 italic">"{comp.reason}"</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl border border-dashed border-brand-border flex flex-col items-center gap-3 text-center">
                  <p className="text-xs text-brand-text-muted">
                    {t('result.noCompetitorsInferred')}
                  </p>
                  <div className="flex gap-2 w-full max-w-sm">
                    <input 
                      type="text" 
                      placeholder="e.g. competitor.com"
                      className="flex-1 px-3 py-2 text-xs border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary"
                      id="manual-competitor-input"
                    />
                    <Button 
                      type="button" 
                      size="sm"
                      className="bg-brand-text-primary text-white text-xs px-4"
                      onClick={() => {
                        const input = document.getElementById('manual-competitor-input') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          const newComp = input.value.trim().toLowerCase();
                          if (!inferredCompetitors.some(c => c.domain === newComp)) {
                            setInferredCompetitors(prev => [...prev, { domain: newComp, reason: t('result.manuallyAdded') }]);
                            setConfirmedCompetitors(prev => [...prev, newComp]);
                          }
                          input.value = '';
                        }
                      }}
                    >
                      {t('result.addButton')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Google Search Console connection CTA */}
              <div className="bg-brand-surface p-4 rounded-xl border border-brand-border flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-left space-y-1">
                  <p className="text-xs font-bold text-brand-text-primary">
                    {t('result.gscPrompt')}
                  </p>
                  <p className="text-[10px] text-brand-text-muted">
                    {t('result.gscDesc')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-brand-info/30 text-brand-info hover:bg-brand-info/10 font-bold text-xs rounded-lg bg-white"
                  onClick={() => {
                    toast.info(t('gscToast'));
                  }}
                >
                  {t('btnConnectGsc')}
                </Button>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-brand-border flex flex-col sm:flex-row justify-end gap-3">
            <button 
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-brand-border hover:bg-brand-surface text-xs font-bold text-brand-text-muted rounded-xl transition-colors uppercase tracking-widest text-center"
            >
              {t('skipConfirmation')}
            </button>
            <Button
              onClick={handleFinalConfirm}
              disabled={isSavingState}
              className="py-3 px-6 text-sm bg-brand-text-primary hover:bg-brand-text-primary text-white shadow-xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingState ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>{t('status.SAVING_RESULTS')}</span>
                </>
              ) : (
                <>
                  <Zap size={16} className="fill-brand-secondary text-brand-secondary group-hover:scale-110 transition-transform" />
                  <span>{t('btnConfirmSave')}</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-8 md:p-12 bg-white border-brand-border-heavy shadow-2xl rounded-2xl space-y-8 animate-in fade-in zoom-in-95 duration-500">
        {/* Unified Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-black uppercase tracking-widest">
            <Sparkles size={14} aria-hidden="true" />
            <span>{isDone ? t('doneTitle') : t('badge')}</span>
          </div>
          <h2 className="text-3xl font-black text-brand-text-primary tracking-tight">
            {isSavingState 
              ? t('status.SAVING_RESULTS') 
              : isDone 
                ? t('confirmTitle') 
                : t('analyzingTitle')
            }
          </h2>
          <p className="text-brand-text-muted text-sm font-medium">
            {isSavingState 
              ? t('status.SAVING_RESULTS') 
              : isDone 
                ? t('confirmSubtitle') 
                : t(`status.${status}` as any) || status
            }
          </p>
        </div>

        {/* Progress Bar (Only when analyzing/saving) */}
        {!isDone && (
          <div className="space-y-3 max-w-md mx-auto">
            <div className="flex justify-between items-end">
              <span className="text-xs font-black text-brand-text-muted uppercase tracking-widest">
                {t('scanProgress')}
              </span>
              <span className="text-xl font-mono font-black text-brand-primary">
                {progressPercent}%
              </span>
            </div>
            <div className="h-3 w-full bg-brand-border rounded-full overflow-hidden border border-brand-border-heavy p-0.5">
              <div
                className="h-full bg-brand-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Unified Timeline / Step reveals */}
        <div className="space-y-6 max-w-2xl mx-auto">
          
          {/* STEP 1: Business DNA */}
          <div className={`p-5 rounded-2xl border-2 transition-all duration-500 space-y-3 ${
            businessDna 
              ? 'bg-brand-success/10 border-brand-success/30' 
              : (!businessDna && isDone) 
                ? 'bg-brand-surface border-brand-border-heavy' 
                : 'bg-white border-brand-border animate-pulse'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-brand-success">
                <ShieldCheck size={16} />
                <span>{t('stepDnaTitle')}</span>
              </div>
              {businessDna ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-success/20 text-brand-success">
                  {t('stepDnaSuccess')}
                </span>
              ) : (!businessDna && isDone) ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-border-heavy text-brand-text-secondary">
                  {t('stepDnaFallback')}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-border text-brand-text-muted">
                  {t('buildingMapLabel')}
                </span>
              )}
            </div>

            {businessDna ? (
              <div className="space-y-2">
                <p className="text-sm font-bold text-brand-text-primary leading-relaxed italic">
                  {businessDna.brandTone}: {businessDna.coreOfferings.slice(0, 3).join(' · ')}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {businessDna.targetAudience.slice(0, 3).map((a: string) => (
                    <Badge key={a} variant="outline" className="bg-white border-brand-border-heavy text-brand-text-muted text-[10px] font-bold">{a}</Badge>
                  ))}
                </div>
              </div>
            ) : (!businessDna && isDone) ? (
              <div className="space-y-1">
                <p className="text-xs text-brand-text-muted leading-relaxed">{t('stepDnaFallbackDesc')}</p>
              </div>
            ) : (
              <p className="text-xs text-brand-text-muted italic">{t('stepDnaAnalyzing')}</p>
            )}
          </div>

          {/* STEP 2: Site Structure & Technical Health */}
          <div className={`p-5 rounded-2xl border-2 transition-all duration-500 space-y-3 ${
            isDone 
              ? 'bg-brand-info/10 border-brand-info/30' 
              : scanned > 0 
                ? 'bg-white border-brand-primary/30' 
                : 'bg-white border-brand-border'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-brand-info">
                <Globe size={16} />
                <span>{t('stepHealthTitle')}</span>
              </div>
              {isDone ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-info/20 text-brand-info">
                  {t('stepHealthSuccess')}
                </span>
              ) : scanned > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-primary/10 text-brand-primary animate-pulse">
                  {t('buildingMapLabel')}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-border text-brand-text-muted">
                  {t('status.preparing')}
                </span>
              )}
            </div>

            {isDone ? (
              <div className="grid grid-cols-3 gap-4 text-center pt-1">
                <div className="bg-white p-3 rounded-xl border border-brand-border">
                  <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">{t('stepHealthScore')}</p>
                  <p className={`text-xl font-mono font-black mt-1 ${
                    (auditData?.techScore ?? 0) >= 80 ? 'text-brand-success' : (auditData?.techScore ?? 0) >= 50 ? 'text-brand-warning' : 'text-brand-error'
                  }`}>
                    {auditData?.techScore ?? '--'}/100
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-brand-border">
                  <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">{t('buildingMap')}</p>
                  <p className="text-xl font-mono font-black text-brand-text-primary mt-1">{t('stepHealthPages', { count: scanned })}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-brand-border">
                  <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">{t('findingGaps')}</p>
                  <p className="text-xl font-mono font-black text-brand-text-primary mt-1">
                    {t('stepHealthIssues', { count: auditData?.issueReport?.issues?.length || 0 })}
                  </p>
                </div>
              </div>
            ) : scanned > 0 ? (
              <div className="space-y-1">
                <p className="text-xs text-brand-text-secondary font-bold">{t('status.SCANNING_GALAXY')}</p>
                {total > 0 && <span className="text-[10px] font-mono text-brand-text-muted">{scanned}/{total}</span>}
              </div>
            ) : (
              <p className="text-xs text-brand-text-muted italic">{t('stepHealthAnalyzing')}</p>
            )}
          </div>

          {/* STEP 3: Competitor Mapping & Opportunities */}
          <div className={`p-5 rounded-2xl border-2 transition-all duration-500 space-y-4 ${
            inferredCompetitors.length > 0 || isDone
              ? 'bg-brand-info/10 border-brand-info/30' 
              : 'bg-white border-brand-border'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-brand-info">
                <Target size={16} />
                <span>{t('stepCompTitle')}</span>
              </div>
              {inferredCompetitors.length > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-info/20 text-brand-info">
                  {t('stepCompSuccess')}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-brand-border text-brand-text-muted">
                  {t('findingGapsLabel')}
                </span>
              )}
            </div>

            {inferredCompetitors.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-brand-text-muted">{t('stepCompDesc')}</p>
                <div className="grid grid-cols-1 gap-2">
                  {inferredCompetitors.map((comp) => {
                    const isSelected = confirmedCompetitors.includes(comp.domain);
                    return (
                      <button
                        key={comp.domain}
                        type="button"
                        onClick={() => toggleCompetitor(comp.domain)}
                        className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3 group ${
                          isSelected 
                            ? 'bg-white border-brand-info/30 shadow-sm' 
                            : 'bg-white border-brand-border hover:border-brand-border-heavy grayscale opacity-60'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-brand-info border-brand-info text-white' : 'border-brand-border-heavy text-transparent'
                        }`}>
                          <CheckCircle2 size={10} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-xs truncate ${isSelected ? 'text-brand-info' : 'text-brand-text-secondary'}`}>{comp.domain}</p>
                          <p className="text-[10px] text-brand-text-muted line-clamp-1 italic">"{comp.reason}"</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Google Search Console connect CTA */}
                <div className="bg-white p-4 rounded-xl border border-brand-info/20 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                  <div className="text-left space-y-1">
                    <p className="text-xs font-bold text-brand-text-primary">{t('connectGscPrompt')}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-brand-info/30 text-brand-info hover:bg-brand-info/10 font-bold text-xs rounded-lg"
                    onClick={() => {
                      toast.info(t('gscToast'));
                    }}
                  >
                    {t('btnConnectGsc')}
                  </Button>
                </div>
              </div>
            ) : isDone ? (
              <p className="text-xs text-brand-text-muted italic">{t('noCompetitorsFound')}</p>
            ) : (
              <p className="text-xs text-brand-text-muted italic">{t('stepCompAnalyzing')}</p>
            )}
          </div>

        </div>

        {/* Unified Bottom Action Buttons */}
        <div className="pt-4 max-w-md mx-auto flex flex-col gap-3">
          <Button
            onClick={isDone ? handleFinalConfirm : undefined}
            disabled={!isDone || isSavingState}
            className="w-full py-7 text-lg bg-brand-text-primary hover:bg-brand-text-primary text-white shadow-xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingState ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>{t('status.SAVING_RESULTS')}</span>
              </>
            ) : isDone ? (
              <>
                <Zap size={18} className="fill-brand-secondary text-brand-secondary group-hover:scale-110 transition-transform" />
                <span>{t('btnConfirmSave')}</span>
              </>
            ) : (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>{t('submitAnalyzing')}</span>
              </>
            )}
          </Button>

          {isDone && (
            <button 
              type="button"
              onClick={() => router.push('/dashboard')}
              className="text-[10px] font-black text-brand-text-muted hover:text-brand-text-secondary uppercase tracking-widest text-center"
            >
              {t('skipConfirmation')}
            </button>
          )}
        </div>
      </Card>
    );
  }

  return null;
}
