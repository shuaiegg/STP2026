'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react';
import posthog from 'posthog-js';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  submitConsultation,
  type ConsultationFormData,
  type AIDetails,
  type CrawlerDetails,
  type GrowthDetails,
} from '@/app/actions/consultation';

// ─── Copy ─────────────────────────────────────────────────────────────────────

// 文案在 messages consultation.form；此处仅保留结构数据（id/icon/value）
const SERVICE_DEFS = [
  { id: 'ai' as const, icon: '🤖' },
  { id: 'crawler' as const, icon: '🕷️' },
  { id: 'growth' as const, icon: '📈' },
];

const BUDGET_VALUES = ['<5k', '5k-20k', '20k-50k', '>50k', 'project'];

const AD_PLATFORM_IDS = ['google', 'meta', 'tiktok', 'linkedin', 'xiaohongshu', 'other'];

function BudgetSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations('consultation.form');
  const labels = t.raw('budgets') as string[];
  return (
    <Field label={t('budgetLabel')}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        <option value="">{t('selectPlaceholder')}</option>
        {BUDGET_VALUES.map((v, i) => <option key={v} value={v}>{labels[i]}</option>)}
      </select>
    </Field>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const inputCls =
  'w-full text-sm bg-brand-surface-alt border border-brand-border rounded-lg px-4 py-2.5 text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-secondary/30 focus:border-brand-secondary transition-colors';

const selectCls = inputCls + ' appearance-none';

function Field({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-brand-text-primary">
        {label}
        {required && <span className="ml-1 text-brand-error">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-brand-error">{error}</p>}
    </div>
  );
}

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
              i < step
                ? 'bg-brand-secondary text-black'
                : i === step
                  ? 'bg-brand-secondary/20 text-brand-secondary border border-brand-secondary'
                  : 'bg-brand-surface-alt text-brand-text-muted border border-brand-border'
            }`}
          >
            {i < step ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`flex-1 h-px ${i < step ? 'bg-brand-secondary' : 'bg-brand-border'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function NavRow({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  loading,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}) {
  const t = useTranslations('consultation.form');
  return (
    <div className="flex items-center justify-between pt-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-brand-text-secondary hover:text-brand-text-primary transition-colors text-sm font-medium"
        >
          <ChevronLeft size={16} /> {t('back')}
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || loading}
        className="inline-flex items-center gap-2 bg-brand-secondary text-black font-semibold px-6 py-3 rounded-lg hover:bg-brand-secondary/90 transition-colors disabled:opacity-50"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {nextLabel ?? t('next')}
        {!loading && <ChevronRight size={16} />}
      </button>
    </div>
  );
}

// ─── Step 2 — AI 与自动化 ─────────────────────────────────────────────────────

function AIStep({
  value,
  onChange,
  errors,
  budget,
  onBudget,
}: {
  value: Partial<AIDetails>;
  onChange: (v: Partial<AIDetails>) => void;
  errors: Partial<Record<string, string>>;
  budget: string;
  onBudget: (v: string) => void;
}) {
  const set = (k: keyof AIDetails, v: string) => onChange({ ...value, [k]: v });
  const t = useTranslations('consultation.form');
  return (
    <div className="space-y-4">
      <Field label={t('ai.scenarioLabel')} required error={errors.scenario}>
        <textarea
          value={value.scenario ?? ''}
          onChange={(e) => set('scenario', e.target.value)}
          placeholder={t('ai.scenarioPh')}
          rows={4}
          className={inputCls}
        />
      </Field>
      <Field label={t('ai.toolsLabel')}>
        <input
          type="text"
          value={value.tools ?? ''}
          onChange={(e) => set('tools', e.target.value)}
          placeholder={t('ai.toolsPh')}
          className={inputCls}
        />
      </Field>
      <Field label={t('ai.painLabel')}>
        <textarea
          value={value.painPoints ?? ''}
          onChange={(e) => set('painPoints', e.target.value)}
          placeholder={t('ai.painPh')}
          rows={2}
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('ai.deliveryLabel')}>
          <select value={value.deliveryType ?? ''} onChange={(e) => set('deliveryType', e.target.value)} className={selectCls}>
            <option value="">{t('selectPlaceholder')}</option>
            <option value="agent">{t('ai.deliveryOptions.agent')}</option>
            <option value="workflow">{t('ai.deliveryOptions.workflow')}</option>
            <option value="chatbot">{t('ai.deliveryOptions.chatbot')}</option>
            <option value="report">{t('ai.deliveryOptions.report')}</option>
            <option value="other">{t('ai.deliveryOptions.other')}</option>
          </select>
        </Field>
        <BudgetSelect value={budget} onChange={onBudget} />
      </div>
    </div>
  );
}

// ─── Step 2 — 数据爬虫 ────────────────────────────────────────────────────────

function CrawlerStep({
  value,
  onChange,
  errors,
  budget,
  onBudget,
}: {
  value: Partial<CrawlerDetails>;
  onChange: (v: Partial<CrawlerDetails>) => void;
  errors: Partial<Record<string, string>>;
  budget: string;
  onBudget: (v: string) => void;
}) {
  const set = (k: keyof CrawlerDetails, v: string) => onChange({ ...value, [k]: v });
  const t = useTranslations('consultation.form');
  return (
    <div className="space-y-4">
      <Field label={t('crawler.sourcesLabel')} required error={errors.dataSources}>
        <textarea
          value={value.dataSources ?? ''}
          onChange={(e) => set('dataSources', e.target.value)}
          placeholder={t('crawler.sourcesPh')}
          rows={3}
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('crawler.useLabel')}>
          <select value={value.dataUse ?? ''} onChange={(e) => set('dataUse', e.target.value)} className={selectCls}>
            <option value="">{t('selectPlaceholder')}</option>
            <option value="price_monitor">{t('crawler.useOptions.price_monitor')}</option>
            <option value="competitor">{t('crawler.useOptions.competitor')}</option>
            <option value="leads">{t('crawler.useOptions.leads')}</option>
            <option value="research">{t('crawler.useOptions.research')}</option>
            <option value="other">{t('crawler.useOptions.other')}</option>
          </select>
        </Field>
        <Field label={t('crawler.freqLabel')}>
          <select value={value.frequency ?? ''} onChange={(e) => set('frequency', e.target.value)} className={selectCls}>
            <option value="">{t('selectPlaceholder')}</option>
            <option value="once">{t('crawler.freqOptions.once')}</option>
            <option value="daily">{t('crawler.freqOptions.daily')}</option>
            <option value="weekly">{t('crawler.freqOptions.weekly')}</option>
            <option value="realtime">{t('crawler.freqOptions.realtime')}</option>
          </select>
        </Field>
        <Field label={t('crawler.formatLabel')}>
          <select value={value.deliveryFormat ?? ''} onChange={(e) => set('deliveryFormat', e.target.value)} className={selectCls}>
            <option value="">{t('selectPlaceholder')}</option>
            <option value="excel">{t('crawler.formatOptions.excel')}</option>
            <option value="api">{t('crawler.formatOptions.api')}</option>
            <option value="dashboard">{t('crawler.formatOptions.dashboard')}</option>
            <option value="other">{t('crawler.formatOptions.other')}</option>
          </select>
        </Field>
        <Field label={t('crawler.volumeLabel')}>
          <select value={value.dataVolume ?? ''} onChange={(e) => set('dataVolume', e.target.value)} className={selectCls}>
            <option value="">{t('selectPlaceholder')}</option>
            <option value="<10k">{t('crawler.volumeOptions.lt10k')}</option>
            <option value="10k-100k">{t('crawler.volumeOptions.10k100k')}</option>
            <option value="100k-1m">{t('crawler.volumeOptions.100k1m')}</option>
            <option value=">1m">{t('crawler.volumeOptions.gt1m')}</option>
          </select>
        </Field>
      </div>
      <BudgetSelect value={budget} onChange={onBudget} />
    </div>
  );
}

// ─── Step 2 — 增长方案 ────────────────────────────────────────────────────────

function GrowthStep({
  value,
  onChange,
  errors,
  budget,
  onBudget,
}: {
  value: Partial<GrowthDetails>;
  onChange: (v: Partial<GrowthDetails>) => void;
  errors: Partial<Record<string, string>>;
  budget: string;
  onBudget: (v: string) => void;
}) {
  const set = (k: keyof GrowthDetails, v: string | string[]) => onChange({ ...value, [k]: v });
  const t = useTranslations('consultation.form');
  const adPlatformLabels = t.raw('adPlatforms') as string[];

  function togglePlatform(id: string) {
    const current = value.adPlatforms ?? [];
    const next = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
    set('adPlatforms', next);
  }

  return (
    <div className="space-y-4">
      <Field label={t('growth.websiteLabel')}>
        <input
          type="url"
          value={value.website ?? ''}
          onChange={(e) => set('website', e.target.value)}
          placeholder="https://example.com"
          className={inputCls}
        />
      </Field>
      <Field label={t('growth.competitorsLabel')} required error={errors.competitors}>
        <textarea
          value={value.competitors ?? ''}
          onChange={(e) => set('competitors', e.target.value)}
          placeholder={t('growth.competitorsPh')}
          rows={3}
          className={inputCls}
        />
        <p className="text-[11px] text-brand-text-muted mt-1">{t('growth.competitorsHint')}</p>
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('growth.marketLabel')}>
          <input
            type="text"
            value={value.targetMarket ?? ''}
            onChange={(e) => set('targetMarket', e.target.value)}
            placeholder={t('growth.marketPh')}
            className={inputCls}
          />
        </Field>
        <Field label={t('growth.trafficLabel')}>
          <select value={value.currentTraffic ?? ''} onChange={(e) => set('currentTraffic', e.target.value)} className={selectCls}>
            <option value="">{t('selectPlaceholder')}</option>
            <option value="unknown">{t('growth.trafficUnknown')}</option>
            <option value="<1k">&lt; 1,000</option>
            <option value="1k-10k">1,000 – 10,000</option>
            <option value=">10k">&gt; 10,000</option>
          </select>
        </Field>
        <Field label={t('growth.goalLabel')}>
          <select value={value.mainGoal ?? ''} onChange={(e) => set('mainGoal', e.target.value)} className={selectCls}>
            <option value="">{t('selectPlaceholder')}</option>
            <option value="traffic">{t('growth.goalOptions.traffic')}</option>
            <option value="ranking">{t('growth.goalOptions.ranking')}</option>
            <option value="conversion">{t('growth.goalOptions.conversion')}</option>
            <option value="brand">{t('growth.goalOptions.brand')}</option>
          </select>
        </Field>
        <BudgetSelect value={budget} onChange={onBudget} />
      </div>

      <Field label={t('growth.adPlatformsLabel')}>
        <div className="flex flex-wrap gap-2 mt-1">
          {AD_PLATFORM_IDS.map((id, i) => {
            const p = { id, label: adPlatformLabels[i] };
            const active = (value.adPlatforms ?? []).includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePlatform(p.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  active
                    ? 'bg-brand-secondary text-black border-brand-secondary'
                    : 'border-brand-border text-brand-text-secondary hover:border-brand-secondary/50 hover:bg-brand-surface-alt'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label={t('growth.adStatusLabel')}>
        <div className="flex flex-col gap-2 mt-1">
          {[
            { value: 'none', label: t('growth.adStatusOptions.none') },
            { value: 'poor_roi', label: t('growth.adStatusOptions.poor_roi') },
            { value: 'active_optimize', label: t('growth.adStatusOptions.active_optimize') },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="adStatus"
                value={opt.value}
                checked={value.adStatus === opt.value}
                onChange={() => set('adStatus', opt.value)}
                className="accent-brand-secondary w-4 h-4"
              />
              <span className="text-sm text-brand-text-secondary group-hover:text-brand-text-primary transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface FormErrors {
  serviceType?: string;
  scenario?: string;
  dataSources?: string;
  competitors?: string;
  name?: string;
  email?: string;
  [key: string]: string | undefined;
}

export function ConsultationForm() {
  const t = useTranslations('consultation.form');
  const locale = useLocale();
  const serviceCopy = t.raw('services') as { label: string; desc: string }[];
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [serviceType, setServiceType] = useState<'ai' | 'crawler' | 'growth' | ''>('');
  const [budget, setBudget] = useState('');
  const [aiDetails, setAiDetails] = useState<Partial<AIDetails>>({});
  const [crawlerDetails, setCrawlerDetails] = useState<Partial<CrawlerDetails>>({});
  const [growthDetails, setGrowthDetails] = useState<Partial<GrowthDetails>>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [wechat, setWechat] = useState('');

  function clearError(key: keyof FormErrors) {
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateStep(): boolean {
    const errs: FormErrors = {};
    if (step === 0) {
      if (!serviceType) errs.serviceType = t('errors.serviceType');
    } else if (step === 1) {
      if (serviceType === 'ai' && !aiDetails.scenario?.trim()) errs.scenario = t('errors.scenario');
      if (serviceType === 'crawler' && !crawlerDetails.dataSources?.trim()) errs.dataSources = t('errors.dataSources');
      if (serviceType === 'growth' && !growthDetails.competitors?.trim()) errs.competitors = t('errors.competitors');
    } else if (step === 2) {
      if (!name.trim()) errs.name = t('errors.name');
      if (!email.trim()) errs.email = t('errors.email');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t('errors.emailInvalid');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validateStep() || !serviceType) return;
    setSubmitting(true);

    const details =
      serviceType === 'ai'
        ? aiDetails
        : serviceType === 'crawler'
          ? crawlerDetails
          : growthDetails;

    const res = await submitConsultation({
      serviceType,
      budget,
      name,
      email,
      wechat: wechat || undefined,
      details: details as ConsultationFormData['details'],
      locale,
    });

    setSubmitting(false);
    if (res.success) {
      posthog.capture('consultation_submitted', { service_type: serviceType, budget });
      setDone(true);
    } else {
      setErrors({ email: res.message });
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-brand-secondary/10 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-brand-secondary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-display text-brand-text-primary mb-2">{t('successTitle')}</h2>
          <p className="text-brand-text-secondary max-w-sm mx-auto leading-relaxed">{t('successBody')}</p>
        </div>
        <Link
          href="/tools/geo-writer"
          className="inline-flex items-center gap-2 bg-brand-secondary text-black font-semibold px-6 py-3 rounded-lg hover:bg-brand-secondary/90 transition-colors"
        >
          {t('successCta')}
        </Link>
      </div>
    );
  }

  const step2Meta = serviceType ? (t.raw('titles') as Record<string, { title: string; sub: string }>)[serviceType] : null;

  return (
    <div className="max-w-xl mx-auto">
      <StepIndicator step={step} total={3} />

      {/* Step 0 — Service type */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold font-display text-brand-text-primary">{t('step1Title')}</h2>
            <p className="text-brand-text-secondary mt-1">{t('step1Sub')}</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {SERVICE_DEFS.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
          setServiceType(opt.id);
          clearError('serviceType');
          posthog.capture('consultation_service_selected', { service_type: opt.id });
        }}
                className={`text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                  serviceType === opt.id
                    ? 'border-brand-secondary bg-brand-secondary/5 ring-1 ring-brand-secondary'
                    : 'border-brand-border bg-brand-surface hover:border-brand-secondary/40 hover:bg-brand-surface-alt'
                }`}
              >
                <span className="text-2xl mt-0.5">{opt.icon}</span>
                <div>
                  <div className="font-semibold text-sm text-brand-text-primary">{serviceCopy[i].label}</div>
                  <div className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{serviceCopy[i].desc}</div>
                </div>
              </button>
            ))}
          </div>
          {errors.serviceType && <p className="text-xs text-brand-error">{errors.serviceType}</p>}
          <NavRow onNext={() => { if (validateStep()) setStep(1); }} />
        </div>
      )}

      {/* Step 1 — Service-specific */}
      {step === 1 && step2Meta && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold font-display text-brand-text-primary">{step2Meta.title}</h2>
            <p className="text-brand-text-secondary mt-1">{step2Meta.sub}</p>
          </div>
          {serviceType === 'ai' && (
            <AIStep value={aiDetails} onChange={setAiDetails} errors={errors} budget={budget} onBudget={setBudget} />
          )}
          {serviceType === 'crawler' && (
            <CrawlerStep value={crawlerDetails} onChange={setCrawlerDetails} errors={errors} budget={budget} onBudget={setBudget} />
          )}
          {serviceType === 'growth' && (
            <GrowthStep value={growthDetails} onChange={setGrowthDetails} errors={errors} budget={budget} onBudget={setBudget} />
          )}
          <NavRow onBack={() => setStep(0)} onNext={() => {
            if (validateStep()) {
              posthog.capture('consultation_step2_completed', { service_type: serviceType });
              setStep(2);
            }
          }} />
        </div>
      )}

      {/* Step 2 — Contact */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold font-display text-brand-text-primary">{t('step3Title')}</h2>
            <p className="text-brand-text-secondary mt-1">{t('step3Sub')}</p>
          </div>
          <div className="space-y-4">
            <Field label={t('contact.nameLabel')} required error={errors.name}>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); clearError('name'); }}
                placeholder={t('contact.namePh')}
                className={inputCls}
              />
            </Field>
            <Field label={t('contact.emailLabel')} required error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                placeholder="you@example.com"
                className={inputCls}
              />
            </Field>
            <Field label={t('contact.wechatLabel')}>
              <input
                type="text"
                value={wechat}
                onChange={(e) => setWechat(e.target.value)}
                placeholder={t('contact.wechatPh')}
                className={inputCls}
              />
            </Field>
          </div>
          <NavRow
            onBack={() => setStep(1)}
            onNext={handleSubmit}
            nextLabel={submitting ? t('submitting') : t('submit')}
            loading={submitting}
          />
        </div>
      )}
    </div>
  );
}
