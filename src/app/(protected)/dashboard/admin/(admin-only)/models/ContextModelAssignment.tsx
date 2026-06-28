"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Check, Trash2, ChevronDown, RefreshCw } from 'lucide-react';
import { saveModelConfig, deleteModelConfig, fetchProviderModels, verifyModelAccess, type ModelConfigRow, type TestResult } from './actions';

// ─── Known models for non-VPS providers (兜底来源) ────────────────────────────
// 注：这已降级为备选清单。各 Provider 现按需动态拉取真实列表；失败或无 key 时回退到此清单。
const KNOWN_MODELS: Record<string, Array<{ id: string; label: string }>> = {
  claude: [
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { id: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ],
  gemini: [
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'text-embedding-004', label: 'Text Embedding 004 (embed only)' },
  ],
  deepseek: [
    { id: 'deepseek-chat', label: 'DeepSeek Chat' },
    { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
  ],
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'o3-mini', label: 'o3-mini (reasoning)' },
  ],
};

const CONTEXTS = [
  { key: 'skill_default', label: 'Skills 默认模型', description: '无 per-skill 覆盖时的全局兜底；首选模型失败后自动尝试 vps → deepseek → claude' },
  { key: 'embedding', label: '知识库 Embedding', description: 'RAG 向量化，Gemini 专用，不参与兜底链' },
  { key: 'content_generation', label: 'GEO 文章初稿', description: 'GEO Writer 流式生成 + StellarWriter 初稿（/api/generate-stream）；首选失败自动兜底' },
  { key: 'content_refinement', label: '文章审校重写', description: 'StellarWriter 审校/Editor/RefiningStudio 段落重写；首选失败自动兜底。未配时与 content_generation 走同一兜底链，默认命中 deepseek' },
  { key: 'content_strategy', label: '内容策略生成', description: '一键生成内容计划（/strategy/generate）；首选失败自动兜底 vps → deepseek → claude' },
  { key: 'dna_extraction', label: '业务基因提取', description: '站点 DNA 提取 + 页面语义聚类（onboarding 核心流程）；首选失败自动兜底' },
  { key: 'competitor_analysis', label: '竞品分析', description: '竞品 scan、suggest 及 inferCompetitors；首选失败自动兜底' },
];

const PROVIDERS = [
  { id: 'vps', label: 'CLIProxy (VPS)' },
  { id: 'claude', label: 'Anthropic Claude' },
  { id: 'gemini', label: 'Google Gemini' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'openai', label: 'OpenAI' },
];

interface Props {
  initialConfigs: ModelConfigRow[];
}

interface RowState {
  provider: string;
  modelId: string;
}

// ─── Provider model combobox ────────────────────────────────────────────────────

interface ProviderModelInputProps {
  value: string;
  onChange: (v: string) => void;
  models: { id: string; label: string }[];
  loading: boolean;
  onRefresh: () => void;
  isFallback: boolean;
  error?: string | null;
}

function ProviderModelInput({ value, onChange, models, loading, onRefresh, isFallback, error }: ProviderModelInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sync external value changes (e.g. provider switch resets modelId)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = query
    ? models.filter((m) => m.id.toLowerCase().includes(query.toLowerCase()) || m.label.toLowerCase().includes(query.toLowerCase()))
    : models;

  function handleSelect(id: string) {
    setQuery(id);
    onChange(id);
    setOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setOpen(true);
  }

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-[220px]">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            placeholder={loading ? '正在加载模型列表…' : '输入或选择模型 ID'}
            className="w-full text-xs bg-brand-surface-alt border border-brand-border rounded-lg px-3 py-1.5 text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
          <button
            type="button"
            onClick={onRefresh}
            title="刷新模型列表"
            className="flex-shrink-0 p-1.5 rounded-lg text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
        </div>
      </div>

      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-brand-border bg-brand-surface shadow-lg py-1">
          <li className="px-3 py-1.5 text-[10px] text-brand-text-muted border-b border-brand-border mb-1">
            {loading ? '加载中...' : isFallback ? `内置清单 (${error || '未拉取到实时列表'})` : `实时 · ${models.length} 个`}
          </li>
          {filtered.length > 0 ? filtered.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(m.id); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-brand-primary/10 transition-colors font-mono truncate ${
                  m.id === value ? 'text-brand-primary bg-brand-primary/5' : 'text-brand-text-primary'
                }`}
              >
                {m.label !== m.id ? `${m.label} (${m.id})` : m.id}
              </button>
            </li>
          )) : (
            <li className="px-3 py-1.5 text-xs text-brand-text-muted text-center">无匹配项，可直接回车保存手输值</li>
          )}
        </ul>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ContextModelAssignment({ initialConfigs }: Props) {
  const configMap = Object.fromEntries(initialConfigs.map((c) => [c.context, c]));

  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      CONTEXTS.map((ctx) => [
        ctx.key,
        {
          provider: configMap[ctx.key]?.provider ?? 'vps',
          modelId: configMap[ctx.key]?.modelId ?? '',
        },
      ]),
    ),
  );

  const [savedRows, setSavedRows] = useState<Record<string, RowState>>(() => ({ ...rows }));
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [verifyingKey, setVerifyingKey] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, TestResult>>({});

  // ─── Provider models cache ────────────────────────────────────────────────────
  type ProviderCache = {
    models: { id: string; label: string }[];
    loading: boolean;
    error: string | null;
    isFallback: boolean;
  };
  const [providerCache, setProviderCache] = useState<Record<string, ProviderCache>>({});

  async function loadProviderModels(provider: string, force = false) {
    if (!force && providerCache[provider]?.loading) return;
    if (!force && providerCache[provider]?.models?.length && !providerCache[provider]?.isFallback) return; // already loaded real data

    setProviderCache((prev) => ({
      ...prev,
      [provider]: { models: prev[provider]?.models || KNOWN_MODELS[provider] || [], loading: true, error: null, isFallback: prev[provider]?.isFallback ?? true },
    }));

    const res = await fetchProviderModels(provider);

    if (res.ok && res.models && res.models.length > 0) {
      setProviderCache((prev) => ({
        ...prev,
        [provider]: { models: res.models!, loading: false, error: null, isFallback: false },
      }));
    } else {
      setProviderCache((prev) => ({
        ...prev,
        [provider]: {
          models: KNOWN_MODELS[provider] || [],
          loading: false,
          error: res.error || '未获取到实时列表',
          isFallback: true,
        },
      }));
    }
  }

  // Auto-load for all providers currently in use
  useEffect(() => {
    const usedProviders = new Set(Object.values(rows).map((r) => r.provider));
    usedProviders.forEach((p) => {
      if (!providerCache[p]) {
        // Initialize with fallback to prevent UI jump before load
        setProviderCache((prev) => ({
          ...prev,
          [p]: { models: KNOWN_MODELS[p] || [], loading: false, error: null, isFallback: true },
        }));
        loadProviderModels(p);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function updateRow(ctx: string, field: keyof RowState, value: string) {
    setRows((prev) => {
      const updated = { ...prev[ctx], [field]: value };
      if (field === 'provider') updated.modelId = '';
      return { ...prev, [ctx]: updated };
    });
  }

  async function handleSave(ctx: string) {
    const row = rows[ctx];
    if (!row.provider || !row.modelId) return;
    setSavingKey(ctx);
    const res = await saveModelConfig(ctx, row.provider, row.modelId);
    setResults((prev) => ({ ...prev, [ctx]: res }));
    if (res.success) {
      setSavedRows((prev) => ({ ...prev, [ctx]: row }));
      setVerifyResults((prev) => { const next = { ...prev }; delete next[ctx]; return next; });
    }
    setSavingKey(null);
  }

  async function handleVerify(ctx: string) {
    const row = savedRows[ctx];
    if (!row.provider || !row.modelId) return;
    setVerifyingKey(ctx);
    const res = await verifyModelAccess(row.provider, row.modelId);
    setVerifyResults((prev) => ({ ...prev, [ctx]: res }));
    setVerifyingKey(null);
  }

  async function handleDelete(ctx: string) {
    setDeletingKey(ctx);
    const res = await deleteModelConfig(ctx);
    setResults((prev) => ({ ...prev, [ctx]: res }));
    if (res.success) {
      setRows((prev) => ({ ...prev, [ctx]: { provider: 'vps', modelId: '' } }));
      setSavedRows((prev) => ({ ...prev, [ctx]: { provider: 'vps', modelId: '' } }));
    }
    setDeletingKey(null);
  }

  return (
    <div className="space-y-3">
      {CONTEXTS.map((ctx) => {
        const row = rows[ctx.key];
        const saved = savedRows[ctx.key];
        const hasChanged = row.provider !== saved.provider || row.modelId !== saved.modelId;
        const canSave = row.provider && row.modelId && hasChanged;
        const isSaving = savingKey === ctx.key;
        const isDeleting = deletingKey === ctx.key;
        const isVerifying = verifyingKey === ctx.key;
        const result = results[ctx.key];
        const verifyResult = verifyResults[ctx.key];
        const modelOptions = KNOWN_MODELS[row.provider] ?? [];
        const savedConfig = configMap[ctx.key];

        return (
          <div key={ctx.key} className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-text-primary">{ctx.label}</p>
                <p className="text-[11px] text-brand-text-muted">{ctx.description}</p>
              </div>
              {savedConfig && (
                <span className="flex-shrink-0 text-[10px] font-mono bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                  {savedConfig.provider}/{savedConfig.modelId}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Provider select */}
              <div className="relative">
                <select
                  value={row.provider}
                  onChange={(e) => updateRow(ctx.key, 'provider', e.target.value)}
                  className="appearance-none text-xs bg-brand-surface-alt border border-brand-border rounded-lg px-3 py-1.5 pr-7 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
              </div>

              {/* Model input — all providers get searchable combobox */}
              <ProviderModelInput
                value={row.modelId}
                onChange={(v) => updateRow(ctx.key, 'modelId', v)}
                models={providerCache[row.provider]?.models || []}
                loading={providerCache[row.provider]?.loading ?? false}
                onRefresh={() => loadProviderModels(row.provider, true)}
                isFallback={providerCache[row.provider]?.isFallback ?? true}
                error={providerCache[row.provider]?.error}
              />

              {/* Save */}
              <button
                onClick={() => handleSave(ctx.key)}
                disabled={!canSave || isSaving}
                className="text-[11px] bg-brand-primary text-white px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-brand-primary/90 transition-colors flex items-center gap-1"
              >
                {isSaving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                {isSaving ? '保存中…' : '保存'}
              </button>

              {/* Verify */}
              {savedConfig && !hasChanged && (
                <button
                  onClick={() => handleVerify(ctx.key)}
                  disabled={isVerifying}
                  className="text-[11px] text-brand-text-secondary border border-brand-border hover:bg-brand-surface-alt px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40"
                >
                  {isVerifying ? <Loader2 size={11} className="animate-spin" /> : null}
                  {isVerifying ? '验证中…' : '验证'}
                </button>
              )}

              {/* Clear */}
              {savedConfig && (
                <button
                  onClick={() => handleDelete(ctx.key)}
                  disabled={isDeleting}
                  className="text-[11px] text-brand-error hover:bg-brand-error/10 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40"
                  aria-label="清除配置"
                >
                  {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                </button>
              )}
            </div>

            {result && (
              <p className={`text-[11px] font-medium ${result.success ? 'text-brand-success' : 'text-brand-error'}`}>
                {result.success ? '✓' : '✗'} {result.message}
              </p>
            )}
            {verifyResult && (
              <p className={`text-[11px] font-medium ${verifyResult.ok ? 'text-brand-success' : 'text-brand-error'}`}>
                {verifyResult.ok
                  ? `✓ 模型可用（${verifyResult.latencyMs}ms）`
                  : `✗ ${verifyResult.error?.slice(0, 80)}`}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
