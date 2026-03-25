"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Globe, ArrowRight, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

// ─── COPY & config (file scope for i18n readiness) ────────────────────────────

const COPY = {
  badge: 'AI 驱动的 SEO 增长',
  headline: '开启你的',
  headlineAccent: 'Stellar',
  headlineSuffix: '增长之旅',
  subtitle: '只需输入你的网站域名，我们的 AI 引擎将立即扫描并生成全量 SEO 星图。',
  placeholder: 'example.com',
  submitIdle: '立即分析网站',
  submitAnalyzing: '分析中...',
  costHint: '消耗 5 积分 · 预计耗时 15-30 秒',
  errorTitle: '分析失败',
  analyzingTitle: '正在分析网站情报...',
  doneTitle: '分析完成！',
  scanProgress: '扫描进度',
  buildingMap: '技术健康星图',
  buildingMapLabel: '正在构建',
  findingGaps: '市场增长空白',
  findingGapsLabel: '正在探寻',
  validationEmpty: '请输入网站域名',
  validationInvalid: '请输入有效的网站域名 (例如 example.com)',
} as const;

const STATUS_LABELS: Record<string, string> = {
  'INITIALIZING_PROBE': '正在初始化探针...',
  'SITE_STRUCTURE_DISCOVERED': '站点结构已探明',
  'SCANNING_GALAXY': '正在深度扫描页面...',
  'GALAXY_CONSTRUCTED': '审计分析完成',
  'SAVING_RESULTS': '正在为你准备工作台...',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type OnboardingState = 'IDLE' | 'ANALYZING' | 'DONE' | 'ERROR';

// ─── OnboardingClient ─────────────────────────────────────────────────────────

export function OnboardingClient() {
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [state, setState] = useState<OnboardingState>('IDLE');
  const [status, setStatus] = useState('');
  const [scanned, setScanned] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateDomain = (val: string) => {
    if (!val) return COPY.validationEmpty;
    if (!val.includes('.')) return COPY.validationInvalid;
    return null;
  };

  const handleStart = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const err = validateDomain(domain);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setError(null);
    setState('ANALYZING');
    setStatus('INITIALIZING_PROBE');
    setScanned(0);
    setTotal(0);

    try {
      const response = await fetch('/api/dashboard/site-intelligence/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '分析启动失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');
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
                domain,
                graphData: event.graphData,
                techScore: event.techScore,
                issueReport: event.issueReport,
              }),
            });
            const saveData = await saveRes.json();
            if (saveData.success) {
              setState('DONE');
              router.push(`/dashboard/site-intelligence/${saveData.siteId}?onboarded=1`);
            } else {
              throw new Error(saveData.error || '保存失败');
            }
          } else if (event.type === 'error') {
            throw new Error(event.error || '分析过程中发生错误');
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '系统繁忙，请稍后再试');
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
            <span>{COPY.badge}</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {COPY.headline}{' '}
            <span className="text-brand-primary italic">{COPY.headlineAccent}</span>{' '}
            {COPY.headlineSuffix}
          </h1>
          <p className="text-slate-500 text-lg font-medium max-w-sm mx-auto">
            {COPY.subtitle}
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
                  if (validationError) setValidationError(null);
                }}
                placeholder={COPY.placeholder}
                disabled={state === 'ANALYZING'}
                aria-invalid={!!validationError}
                aria-describedby={validationError ? 'domain-error' : undefined}
                className={`w-full bg-slate-50 border-2 rounded-lg py-4 pl-12 pr-6 text-lg font-bold focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all ${
                  validationError
                    ? 'border-rose-200 focus:border-rose-400'
                    : 'border-slate-100 focus:border-brand-primary'
                }`}
              />
            </div>
            {validationError && (
              <p
                id="domain-error"
                role="alert"
                className="text-rose-500 text-sm font-bold pl-2 flex items-center gap-1.5 motion-safe:animate-in motion-safe:slide-in-from-top-1"
              >
                <AlertCircle size={14} aria-hidden="true" />
                {validationError}
              </p>
            )}
          </div>

          {state === 'ERROR' && (
            <div
              role="alert"
              className="p-4 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-3 text-rose-600 motion-safe:animate-in motion-safe:fade-in duration-500"
            >
              <AlertCircle className="shrink-0 mt-0.5" size={18} aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-bold">{COPY.errorTitle}</p>
                <p className="text-xs opacity-80">{error}</p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={state === 'ANALYZING'}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-8 text-xl font-black group shadow-xl hover:shadow-2xl transition-all"
          >
            {state === 'ANALYZING' ? COPY.submitAnalyzing : COPY.submitIdle}
            <ArrowRight aria-hidden="true" className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-center text-xs text-slate-400 font-medium italic">
            {COPY.costHint}
          </p>
        </form>
      </Card>
    );
  }

  return (
    <Card className="p-8 md:p-12 bg-white border-slate-200 shadow-xl rounded-xl text-center space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-500 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" aria-hidden="true" />

      <div className="relative space-y-8">
        <div className="w-24 h-24 bg-white border-4 border-brand-primary/20 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-brand-primary/20">
          {state === 'DONE' ? (
            <CheckCircle2 size={48} aria-hidden="true" className="text-emerald-500 motion-safe:animate-in motion-safe:zoom-in duration-500" />
          ) : (
            <div className="relative">
              <Loader2 size={48} aria-hidden="true" className="text-brand-primary motion-safe:animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-brand-primary rounded-full" aria-hidden="true" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {state === 'DONE' ? COPY.doneTitle : COPY.analyzingTitle}
          </h2>
          <p className="text-slate-500 font-medium italic">
            {STATUS_LABELS[status] || '准备中...'}
          </p>
        </div>

        <div className="max-w-xs mx-auto space-y-3">
          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>{COPY.scanProgress}</span>
            <span>{scanned} / {total}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 p-1 shadow-inner overflow-hidden">
            <div
              className="h-full bg-brand-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        <div className="pt-4 grid grid-cols-2 gap-4 text-left">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{COPY.buildingMapLabel}</p>
            <p className="text-sm font-bold text-slate-700">{COPY.buildingMap}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{COPY.findingGapsLabel}</p>
            <p className="text-sm font-bold text-slate-700">{COPY.findingGaps}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
