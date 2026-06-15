"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Globe, ArrowRight, Loader2, CheckCircle2, AlertCircle, Sparkles, Target, Zap, ShieldCheck, X } from 'lucide-react';
import posthog from 'posthog-js';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';

// ─── Types ────────────────────────────────────────────────────────────────────

type OnboardingState = 'IDLE' | 'ANALYZING' | 'CONFIRMING' | 'SAVING' | 'DONE' | 'ERROR';

// ─── OnboardingClient ─────────────────────────────────────────────────────────

export function OnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainFromUrl = searchParams.get('domain');
  const t = useTranslations('dashboard.onboarding');
  
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
      <Card className="p-8 md:p-12 bg-white border-slate-200 shadow-xl rounded-xl space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-black uppercase tracking-widest mb-2">
            <Sparkles size={14} aria-hidden="true" />
            <span>{t('badge')}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {t('headline')}{' '}
            <span className="text-brand-primary italic">{t('headlineAccent')}</span>{' '}
            {t('headlineSuffix')}
          </h1>
          <p className="text-slate-500 text-lg font-medium max-w-sm mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <form onSubmit={handleStart} className="space-y-6 max-w-md mx-auto">
          <div className="space-y-2">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors">
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
                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-lg font-medium"
              />
            </div>
            {validationError && (
              <p className="text-red-500 text-xs font-bold flex items-center gap-1 animate-shake">
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

          <p className="text-center text-slate-400 text-xs font-medium">
            {t('costHint')}
          </p>
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-800">{t('errorTitle')}</p>
              <p className="text-xs text-red-600 leading-relaxed">{error}</p>
            </div>
          </div>
        )}
      </Card>
    );
  }

  if (state === 'ANALYZING' || state === 'SAVING') {
    return (
      <Card className="p-8 md:p-12 bg-white border-slate-200 shadow-2xl rounded-2xl space-y-10">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {t('analyzingTitle')}
          </h2>
          <div className="flex items-center justify-center gap-2 text-brand-primary font-bold">
            <Loader2 className="animate-spin" size={20} />
            <span>{t(`status.${status}` as any) || status}</span>
          </div>
        </div>

        <div className="space-y-8">
          {/* Total Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
                {t('scanProgress')}
              </span>
              <span className="text-2xl font-mono font-black text-brand-primary">
                {progressPercent}%
              </span>
            </div>
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
              <div
                className="h-full bg-brand-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Real-time Intel Badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            {businessDna && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center gap-2 animate-in zoom-in duration-300">
                    <ShieldCheck size={14} /> {t('intelDna')}
                </div>
            )}
            {inferredCompetitors.length > 0 && (
                <div className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center gap-2 animate-in zoom-in duration-300">
                    <Target size={14} /> {t('intelCompetitors', { count: inferredCompetitors.length })}
                </div>
            )}
          </div>

          {/* Detail Steps */}
          <div className="grid grid-cols-1 gap-4">
            <div className={`p-4 rounded-xl border-2 transition-all duration-500 flex items-center justify-between ${
              status === 'INITIALIZING_PROBE' || status === 'SITE_STRUCTURE_DISCOVERED' ? 'bg-brand-primary/5 border-brand-primary/20 scale-[1.02]' : 'bg-white border-slate-100'
            }`}>
              <div className="flex items-center gap-3">
                {scanned > 0 ? <CheckCircle2 className="text-brand-primary" size={20} /> : <Globe className="text-slate-400" size={20} />}
                <span className="font-bold text-slate-700">{t('buildingMap')}</span>
              </div>
              <span className="text-xs font-black text-slate-400 uppercase">{t('buildingMapLabel')}</span>
            </div>

            <div className={`p-4 rounded-xl border-2 transition-all duration-500 flex items-center justify-between ${
              status === 'SCANNING_GALAXY' ? 'bg-brand-primary/5 border-brand-primary/20 scale-[1.02]' : 'bg-white border-slate-100'
            }`}>
              <div className="flex items-center gap-3">
                {scanned >= total && total > 0 ? <CheckCircle2 className="text-brand-primary" size={20} /> : <Sparkles className="text-slate-400" size={20} />}
                <span className="font-bold text-slate-700">{t('findingGaps')}</span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-xs font-black text-slate-400 uppercase">{t('findingGapsLabel')}</span>
                 {total > 0 && <span className="text-[10px] font-mono text-slate-400">{scanned}/{total}</span>}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (state === 'CONFIRMING') {
    return (
        <Card className="p-8 bg-white border-slate-200 shadow-2xl rounded-2xl space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-black uppercase tracking-widest mb-2">
                    <CheckCircle2 size={14} />
                    <span>{t('auditComplete')}</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('confirmTitle')}</h2>
                <p className="text-slate-500 font-medium italic">{t('confirmSubtitle')}</p>
            </div>

            <div className="space-y-6">
                {/* DNA Summary */}
                {businessDna && (
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                            <ShieldCheck size={14} /> {t('dnaLabel')}
                        </div>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed italic">
                            {businessDna.brandTone}: {businessDna.coreOfferings.slice(0, 3).join(' · ')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {businessDna.targetAudience.slice(0, 3).map((a: string) => (
                                <Badge key={a} variant="outline" className="bg-white border-slate-200 text-slate-500 text-[10px] font-bold">{a}</Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Competitors List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                            <Target size={14} /> {t('competitorsLabel')}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{confirmedCompetitors.length} SELECTED</span>
                    </div>
                    
                    <div className="space-y-2">
                        {inferredCompetitors.length > 0 ? inferredCompetitors.map((comp) => {
                            const isSelected = confirmedCompetitors.includes(comp.domain);
                            return (
                                <button
                                    key={comp.domain}
                                    onClick={() => toggleCompetitor(comp.domain)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 group ${
                                        isSelected 
                                            ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' 
                                            : 'bg-white border-slate-100 hover:border-slate-200 grayscale opacity-60'
                                    }`}
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-transparent'
                                    }`}>
                                        <CheckCircle2 size={12} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm truncate ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>{comp.domain}</p>
                                        <p className="text-[11px] text-slate-500 line-clamp-1 italic">"{comp.reason}"</p>
                                    </div>
                                </button>
                            );
                        }) : (
                            <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                <p className="text-xs text-slate-400 font-medium">{t('noCompetitorsFound')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
                <Button
                    onClick={handleFinalConfirm}
                    className="w-full py-7 text-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xl flex items-center justify-center gap-2 group"
                >
                    <Zap size={18} className="fill-brand-secondary text-brand-secondary group-hover:scale-110 transition-transform" />
                    <span>{t('btnConfirmSave')}</span>
                </Button>
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                >
                    {t('skipConfirmation')}
                </button>
            </div>
        </Card>
    );
  }

  return null;
}
