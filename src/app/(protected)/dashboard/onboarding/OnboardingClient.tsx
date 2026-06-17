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

export function OnboardingClient() {
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
                has_dna: !!businessDna 
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
