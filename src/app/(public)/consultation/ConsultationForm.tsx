'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react';
import posthog from 'posthog-js';
import {
  submitConsultation,
  type ConsultationFormData,
  type AIDetails,
  type CrawlerDetails,
  type GrowthDetails,
} from '@/app/actions/consultation';

// ─── Copy ─────────────────────────────────────────────────────────────────────

const COPY = {
  step1Title: '你需要哪方面的帮助？',
  step1Sub: '选择最符合你需求的服务方向',
  step2Next: '下一步',
  step3Title: '怎么联系你？',
  step3Sub: '我们通常在 1 个工作日内回复',
  back: '上一步',
  submit: '提交咨询',
  submitting: '提交中…',
  successTitle: '已收到你的需求！',
  successBody: '我们会在 1 个工作日内与你联系，请留意邮件。',
  successCta: '免费体验 GEO Writer →',
} as const;

const SERVICE_OPTIONS = [
  {
    id: 'ai' as const,
    icon: '🤖',
    label: 'AI 与自动化',
    desc: '业务流程自动化、AI Agent、智能对话机器人',
  },
  {
    id: 'crawler' as const,
    icon: '🕷️',
    label: '数据爬虫',
    desc: '价格监控、竞品分析、线索采集、市场数据',
  },
  {
    id: 'growth' as const,
    icon: '📈',
    label: '增长方案',
    desc: '网站建设、SEO 优化、Google / Meta / TikTok 广告',
  },
] as const;

const BUDGET_OPTIONS = [
  { value: '<5k', label: '< ¥5,000 / 月' },
  { value: '5k-20k', label: '¥5,000 – ¥20,000 / 月' },
  { value: '20k-50k', label: '¥20,000 – ¥50,000 / 月' },
  { value: '>50k', label: '> ¥50,000 / 月' },
  { value: 'project', label: '项目制（一次性）' },
];

const AD_PLATFORMS = [
  { id: 'google', label: 'Google Ads' },
  { id: 'meta', label: 'Meta Ads（Facebook / Instagram）' },
  { id: 'tiktok', label: 'TikTok Ads' },
  { id: 'linkedin', label: 'LinkedIn Ads' },
  { id: 'xiaohongshu', label: '小红书' },
  { id: 'other', label: '其他' },
];

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
  return (
    <div className="flex items-center justify-between pt-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-brand-text-secondary hover:text-brand-text-primary transition-colors text-sm font-medium"
        >
          <ChevronLeft size={16} /> {COPY.back}
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
        {nextLabel ?? COPY.step2Next}
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
  return (
    <div className="space-y-4">
      <Field label="想自动化 / AI 化的业务场景" required error={errors.scenario}>
        <textarea
          value={value.scenario ?? ''}
          onChange={(e) => set('scenario', e.target.value)}
          placeholder="例如：每天手动整理报价单发给客户，耗时 2 小时；客服重复回答相同问题…"
          rows={4}
          className={inputCls}
        />
      </Field>
      <Field label="目前在用的工具 / 系统">
        <input
          type="text"
          value={value.tools ?? ''}
          onChange={(e) => set('tools', e.target.value)}
          placeholder="如：飞书、企微、Salesforce、Excel、自研系统…"
          className={inputCls}
        />
      </Field>
      <Field label="主要痛点">
        <textarea
          value={value.painPoints ?? ''}
          onChange={(e) => set('painPoints', e.target.value)}
          placeholder="人力成本高、容易出错、响应慢、数据分散…"
          rows={2}
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="期望交付形式">
          <select value={value.deliveryType ?? ''} onChange={(e) => set('deliveryType', e.target.value)} className={selectCls}>
            <option value="">— 请选择 —</option>
            <option value="agent">AI Agent（自主执行任务）</option>
            <option value="workflow">自动化工作流</option>
            <option value="chatbot">智能对话机器人</option>
            <option value="report">自动数据报告</option>
            <option value="other">其他</option>
          </select>
        </Field>
        <Field label="预算范围">
          <select value={budget} onChange={(e) => onBudget(e.target.value)} className={selectCls}>
            <option value="">— 请选择 —</option>
            {BUDGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
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
  return (
    <div className="space-y-4">
      <Field label="目标数据来源" required error={errors.dataSources}>
        <textarea
          value={value.dataSources ?? ''}
          onChange={(e) => set('dataSources', e.target.value)}
          placeholder="例如：Amazon 商品价格、LinkedIn 企业联系人、各大电商平台 SKU 数据…（每行一个来源）"
          rows={3}
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="数据用途">
          <select value={value.dataUse ?? ''} onChange={(e) => set('dataUse', e.target.value)} className={selectCls}>
            <option value="">— 请选择 —</option>
            <option value="price_monitor">价格监控</option>
            <option value="competitor">竞品分析</option>
            <option value="leads">线索采集</option>
            <option value="research">市场研究</option>
            <option value="other">其他</option>
          </select>
        </Field>
        <Field label="采集频率">
          <select value={value.frequency ?? ''} onChange={(e) => set('frequency', e.target.value)} className={selectCls}>
            <option value="">— 请选择 —</option>
            <option value="once">一次性</option>
            <option value="daily">每日</option>
            <option value="weekly">每周</option>
            <option value="realtime">实时 / 近实时</option>
          </select>
        </Field>
        <Field label="数据交付格式">
          <select value={value.deliveryFormat ?? ''} onChange={(e) => set('deliveryFormat', e.target.value)} className={selectCls}>
            <option value="">— 请选择 —</option>
            <option value="excel">Excel / CSV</option>
            <option value="api">API 接口</option>
            <option value="dashboard">可视化看板</option>
            <option value="other">其他</option>
          </select>
        </Field>
        <Field label="预估数据量">
          <select value={value.dataVolume ?? ''} onChange={(e) => set('dataVolume', e.target.value)} className={selectCls}>
            <option value="">— 请选择 —</option>
            <option value="<10k">&lt; 1 万条</option>
            <option value="10k-100k">1 – 10 万条</option>
            <option value="100k-1m">10 – 100 万条</option>
            <option value=">1m">&gt; 100 万条</option>
          </select>
        </Field>
      </div>
      <Field label="预算范围">
        <select value={budget} onChange={(e) => onBudget(e.target.value)} className={selectCls}>
          <option value="">— 请选择 —</option>
          {BUDGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
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

  function togglePlatform(id: string) {
    const current = value.adPlatforms ?? [];
    const next = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
    set('adPlatforms', next);
  }

  return (
    <div className="space-y-4">
      <Field label="网站地址">
        <input
          type="url"
          value={value.website ?? ''}
          onChange={(e) => set('website', e.target.value)}
          placeholder="https://example.com"
          className={inputCls}
        />
      </Field>
      <Field label="竞争对手 / 参考公司网站" required error={errors.competitors}>
        <textarea
          value={value.competitors ?? ''}
          onChange={(e) => set('competitors', e.target.value)}
          placeholder="每行填一个，例如：&#10;https://competitor-a.com&#10;https://competitor-b.com"
          rows={3}
          className={inputCls}
        />
        <p className="text-[11px] text-brand-text-muted mt-1">这是帮我们快速理解你所在市场最重要的信息</p>
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="目标市场">
          <input
            type="text"
            value={value.targetMarket ?? ''}
            onChange={(e) => set('targetMarket', e.target.value)}
            placeholder="如：美国、东南亚、英语市场…"
            className={inputCls}
          />
        </Field>
        <Field label="当前月访问量">
          <select value={value.currentTraffic ?? ''} onChange={(e) => set('currentTraffic', e.target.value)} className={selectCls}>
            <option value="">— 请选择 —</option>
            <option value="unknown">不清楚</option>
            <option value="<1k">&lt; 1,000</option>
            <option value="1k-10k">1,000 – 10,000</option>
            <option value=">10k">&gt; 10,000</option>
          </select>
        </Field>
        <Field label="主要目标">
          <select value={value.mainGoal ?? ''} onChange={(e) => set('mainGoal', e.target.value)} className={selectCls}>
            <option value="">— 请选择 —</option>
            <option value="traffic">提升自然流量</option>
            <option value="ranking">提升搜索排名</option>
            <option value="conversion">获客 / 转化</option>
            <option value="brand">品牌曝光</option>
          </select>
        </Field>
        <Field label="预算范围">
          <select value={budget} onChange={(e) => onBudget(e.target.value)} className={selectCls}>
            <option value="">— 请选择 —</option>
            {BUDGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>

      <Field label="已投放过的广告平台（可多选）">
        <div className="flex flex-wrap gap-2 mt-1">
          {AD_PLATFORMS.map((p) => {
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

      <Field label="目前广告投放状态">
        <div className="flex flex-col gap-2 mt-1">
          {[
            { value: 'none', label: '还没有投放经验，想从零开始' },
            { value: 'poor_roi', label: '有投放但 ROI 不理想' },
            { value: 'active_optimize', label: '正在投放，想优化或扩量' },
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

const SERVICE_TITLES: Record<string, { title: string; sub: string }> = {
  ai: { title: '告诉我们你想自动化什么', sub: '描述越具体，我们的方案越精准' },
  crawler: { title: '你需要什么数据？', sub: '描述越具体，我们的方案越精准' },
  growth: { title: '你的网站和竞争对手', sub: '竞品信息帮我们快速理解你的市场' },
};

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
      if (!serviceType) errs.serviceType = '请选择服务类型';
    } else if (step === 1) {
      if (serviceType === 'ai' && !aiDetails.scenario?.trim()) errs.scenario = '请描述你的业务场景';
      if (serviceType === 'crawler' && !crawlerDetails.dataSources?.trim()) errs.dataSources = '请填写目标数据来源';
      if (serviceType === 'growth' && !growthDetails.competitors?.trim()) errs.competitors = '请填写竞争对手/参考网站';
    } else if (step === 2) {
      if (!name.trim()) errs.name = '请输入姓名';
      if (!email.trim()) errs.email = '请输入邮箱';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = '请输入有效的邮箱地址';
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
          <h2 className="text-2xl font-bold font-display text-brand-text-primary mb-2">{COPY.successTitle}</h2>
          <p className="text-brand-text-secondary max-w-sm mx-auto leading-relaxed">{COPY.successBody}</p>
        </div>
        <a
          href="/tools/geo-writer"
          className="inline-flex items-center gap-2 bg-brand-secondary text-black font-semibold px-6 py-3 rounded-lg hover:bg-brand-secondary/90 transition-colors"
        >
          {COPY.successCta}
        </a>
      </div>
    );
  }

  const step2Meta = serviceType ? SERVICE_TITLES[serviceType] : null;

  return (
    <div className="max-w-xl mx-auto">
      <StepIndicator step={step} total={3} />

      {/* Step 0 — Service type */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold font-display text-brand-text-primary">{COPY.step1Title}</h2>
            <p className="text-brand-text-secondary mt-1">{COPY.step1Sub}</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {SERVICE_OPTIONS.map((opt) => (
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
                  <div className="font-semibold text-sm text-brand-text-primary">{opt.label}</div>
                  <div className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{opt.desc}</div>
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
            <h2 className="text-2xl font-bold font-display text-brand-text-primary">{COPY.step3Title}</h2>
            <p className="text-brand-text-secondary mt-1">{COPY.step3Sub}</p>
          </div>
          <div className="space-y-4">
            <Field label="姓名" required error={errors.name}>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); clearError('name'); }}
                placeholder="你的称呼"
                className={inputCls}
              />
            </Field>
            <Field label="邮箱" required error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                placeholder="you@example.com"
                className={inputCls}
              />
            </Field>
            <Field label="微信 / 手机（可选）">
              <input
                type="text"
                value={wechat}
                onChange={(e) => setWechat(e.target.value)}
                placeholder="方便的话可以留个微信"
                className={inputCls}
              />
            </Field>
          </div>
          <NavRow
            onBack={() => setStep(1)}
            onNext={handleSubmit}
            nextLabel={submitting ? COPY.submitting : COPY.submit}
            loading={submitting}
          />
        </div>
      )}
    </div>
  );
}
