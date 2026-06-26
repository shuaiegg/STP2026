"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Check, Trash2, ChevronDown, RefreshCw } from 'lucide-react';
import { saveModelConfig, deleteModelConfig, fetchVpsModels, verifyModelAccess, type ModelConfigRow, type VpsModel, type TestResult } from './actions';

// ─── Known models for non-VPS providers ───────────────────────────────────────

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
  { key: 'skill_default', label: 'Skills 默认模型', description: '无 per-skill 覆盖时的兜底模型' },
  { key: 'consultation', label: '咨询方案生成', description: 'AI 分析用户需求并生成方案草稿' },
  { key: 'embedding', label: '知识库 Embedding', description: 'RAG 向量化（Sprint 3）' },
  { key: 'content_generation', label: 'GEO 文章生成', description: 'GEO Writer 流式内容生成（/api/generate-stream）' },
  { key: 'content_strategy', label: '内容策略生成', description: '内容资产蓝图"一键生成计划"（/strategy/generate），失败自动兜底其他模型' },
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

// ─── VPS model combobox ───────────────────────────────────────────────────────

interface VpsModelInputProps {
  value: string;
  onChange: (v: string) => void;
  vpsModels: VpsModel[];
  vpsLoading: boolean;
  onRefresh: () => void;
}

function VpsModelInput({ value, onChange, vpsModels, vpsLoading, onRefresh }: VpsModelInputProps) {
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
    ? vpsModels.filter((m) => m.id.toLowerCase().includes(query.toLowerCase()))
    : vpsModels;

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
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={vpsLoading ? '正在加载模型列表…' : '输入或选择模型 ID'}
          className="w-full text-xs bg-brand-surface-alt border border-brand-border rounded-lg px-3 py-1.5 text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
        <button
          type="button"
          onClick={onRefresh}
          title="刷新模型列表"
          className="flex-shrink-0 p-1.5 rounded-lg text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
        >
          {vpsLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        </button>
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-lg border border-brand-border bg-brand-surface shadow-lg">
          {filtered.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(m.id); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-brand-primary/10 transition-colors font-mono truncate ${
                  m.id === value ? 'text-brand-primary bg-brand-primary/5' : 'text-brand-text-primary'
                }`}
              >
                {m.id}
              </button>
            </li>
          ))}
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

  // VPS models — loaded once and shared across all rows
  const [vpsModels, setVpsModels] = useState<VpsModel[]>([]);
  const [vpsLoading, setVpsLoading] = useState(false);

  async function loadVpsModels() {
    setVpsLoading(true);
    const res = await fetchVpsModels();
    if (res.ok && res.models) setVpsModels(res.models);
    setVpsLoading(false);
  }

  // Auto-load when any row uses vps provider
  useEffect(() => {
    const hasVps = Object.values(rows).some((r) => r.provider === 'vps');
    if (hasVps && vpsModels.length === 0 && !vpsLoading) loadVpsModels();
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

              {/* Model input — VPS gets searchable combobox, others get static select */}
              {row.provider === 'vps' ? (
                <VpsModelInput
                  value={row.modelId}
                  onChange={(v) => updateRow(ctx.key, 'modelId', v)}
                  vpsModels={vpsModels}
                  vpsLoading={vpsLoading}
                  onRefresh={loadVpsModels}
                />
              ) : modelOptions.length > 0 ? (
                <div className="relative flex-1 min-w-[180px]">
                  <select
                    value={row.modelId}
                    onChange={(e) => updateRow(ctx.key, 'modelId', e.target.value)}
                    className="w-full appearance-none text-xs bg-brand-surface-alt border border-brand-border rounded-lg px-3 py-1.5 pr-7 text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="">— 选择模型 —</option>
                    {modelOptions.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="输入模型 ID"
                  value={row.modelId}
                  onChange={(e) => updateRow(ctx.key, 'modelId', e.target.value)}
                  className="flex-1 min-w-[180px] text-xs bg-brand-surface-alt border border-brand-border rounded-lg px-3 py-1.5 text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              )}

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
