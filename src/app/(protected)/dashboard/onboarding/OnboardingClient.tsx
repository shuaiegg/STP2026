"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Globe, ArrowRight, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import posthog from 'posthog-js';
import { useTranslations } from 'next-intl';

// ─── Types ────────────────────────────────────────────────────────────────────

type OnboardingState = 'IDLE' | 'ANALYZING' | 'DONE' | 'ERROR';

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
          } else if (event.type === 'progress') {
            setStatus('SCANNING_GALAXY');
            setScanned(event.scanned);
            setTotal(event.total);
          } else if (event.type === 'done') {
            setStatus('SAVING_RESULTS');
            const saveRes = await fetch('/api/dashboard/site-intelligence/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                domain: targetDomain,
                graphData: event.graphData,
                techScore: event.techScore,
                issueReport: event.issueReport,
              }),
            });
            const saveData = await saveRes.json();
            if (saveData.success) {
              posthog.capture('onboarding_completed', { domain: targetDomain });
              setState('DONE');
              router.push(`/dashboard/site-intelligence/${saveData.siteId}?onboarded=1`);
            } else {
              throw new Error(saveData.error || t('errSave'));
            }
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

  const progressPercent = total > 0 ? Math.round((scanned / total) * 100) : 0;

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

  return (
    <Card className="p-8 md:p-12 bg-white border-slate-200 shadow-2xl rounded-2xl space-y-10">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          {state === 'DONE' ? t('doneTitle') : t('analyzingTitle')}
        </h2>
        <div className="flex items-center justify-center gap-2 text-brand-primary font-bold">
          {state !== 'DONE' && <Loader2 className="animate-spin" size={20} />}
          <span>{t(`status.${status}` as any)}</span>
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

        {/* Detail Steps */}
        <div className="grid grid-cols-1 gap-4">
          <div className={`p-4 rounded-xl border-2 transition-all duration-500 flex items-center justify-between ${
            status === 'INITIALIZING_PROBE' ? 'bg-brand-primary/5 border-brand-primary/20 scale-[1.02]' : 
            (scanned > 0 || state === 'DONE' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100')
          }`}>
            <div className="flex items-center gap-3">
              {scanned > 0 || state === 'DONE' ? <CheckCircle2 className="text-brand-primary" size={20} /> : <Globe className="text-slate-400" size={20} />}
              <span className="font-bold text-slate-700">{t('buildingMap')}</span>
            </div>
            <span className="text-xs font-black text-slate-400 uppercase">{t('buildingMapLabel')}</span>
          </div>

          <div className={`p-4 rounded-xl border-2 transition-all duration-500 flex items-center justify-between ${
            status === 'SCANNING_GALAXY' ? 'bg-brand-primary/5 border-brand-primary/20 scale-[1.02]' : 
            (state === 'DONE' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100')
          }`}>
            <div className="flex items-center gap-3">
              {state === 'DONE' ? <CheckCircle2 className="text-brand-primary" size={20} /> : <Sparkles className="text-slate-400" size={20} />}
              <span className="font-bold text-slate-700">{t('findingGaps')}</span>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-xs font-black text-slate-400 uppercase">{t('findingGapsLabel')}</span>
               {total > 0 && <span className="text-[10px] font-mono text-slate-400">{scanned}/{total}</span>}
            </div>
          </div>
        </div>
      </div>
      
      {state === 'DONE' && (
        <div className="flex justify-center animate-bounce">
          <div className="p-3 bg-brand-primary/10 rounded-full">
            <Loader2 className="animate-spin text-brand-primary" size={24} />
          </div>
        </div>
      )}
    </Card>
  );
}
