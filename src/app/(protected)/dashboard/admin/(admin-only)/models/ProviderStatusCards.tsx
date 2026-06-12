"use client";

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Server, Cpu, Sparkles, Zap, Loader2, Eye, EyeOff, Pencil, Check, X } from 'lucide-react';
import type { ProviderStatus, TestResult } from './actions';
import { saveProviderKey, testProviderConnection } from './actions';

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  vps: <Server size={16} />,
  claude: <Cpu size={16} />,
  gemini: <Sparkles size={16} />,
  deepseek: <Zap size={16} />,
};

interface CardProps {
  status: ProviderStatus;
}

function ProviderCard({ status: initial }: CardProps) {
  const [status, setStatus] = useState(initial);
  const [editingKey, setEditingKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const isVps = status.name === 'vps';

  async function handleSaveKey() {
    if (!keyInput.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    const res = await saveProviderKey(status.name, keyInput);
    setSaveMsg(res.message);
    if (res.success) {
      setStatus((prev) => ({
        ...prev,
        configured: true,
        source: 'db',
        keyMask: `••••••••${keyInput.slice(-4)}`,
      }));
      setEditingKey(false);
      setKeyInput('');
    }
    setSaving(false);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const res = await testProviderConnection(status.name);
    setTestResult(res);
    setTesting(false);
  }

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${
      status.configured
        ? 'border-brand-success/20 bg-brand-success/5'
        : 'border-brand-border bg-brand-surface-alt/50'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${status.configured ? 'text-brand-success bg-brand-success/10' : 'text-brand-text-muted bg-brand-surface-alt'}`}>
            {PROVIDER_ICONS[status.name] ?? <Cpu size={16} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-text-primary leading-none">{status.label}</p>
            <p className="text-[10px] text-brand-text-muted mt-0.5">
              {status.configured ? `已配置（${status.source}）` : '未配置'}
            </p>
          </div>
        </div>
        {status.configured
          ? <CheckCircle2 size={14} className="text-brand-success flex-shrink-0" />
          : <XCircle size={14} className="text-brand-text-muted flex-shrink-0" />}
      </div>

      {/* VPS note */}
      {isVps && status.note && (
        <p className="text-[10px] font-mono text-brand-text-muted truncate" title={status.note}>{status.note}</p>
      )}

      {/* API Key management (non-VPS) */}
      {!isVps && (
        <div className="space-y-2">
          {!editingKey ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-brand-text-muted">
                {status.keyMask ?? (status.source === 'env' ? '使用 env var' : '未设置')}
              </span>
              <button
                onClick={() => { setEditingKey(true); setSaveMsg(null); setTestResult(null); }}
                className="flex items-center gap-1 text-[10px] text-brand-text-muted hover:text-brand-primary transition-colors"
              >
                <Pencil size={10} />
                {status.keyMask ? '修改' : '设置 Key'}
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                    placeholder="粘贴 API Key…"
                    autoFocus
                    className="w-full text-xs bg-brand-surface border border-brand-border rounded-lg px-2.5 py-1.5 pr-7 font-mono text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text-primary"
                  >
                    {showKey ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                </div>
                <button
                  onClick={handleSaveKey}
                  disabled={saving || !keyInput.trim()}
                  className="p-1.5 rounded-lg bg-brand-primary text-white disabled:opacity-40 hover:bg-brand-primary/90 transition-colors"
                >
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                </button>
                <button
                  onClick={() => { setEditingKey(false); setKeyInput(''); setSaveMsg(null); }}
                  className="p-1.5 rounded-lg text-brand-text-muted hover:bg-brand-error/10 hover:text-brand-error transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
              {saveMsg && (
                <p className={`text-[10px] ${saving ? 'text-brand-text-muted' : saveMsg.includes('已') ? 'text-brand-success' : 'text-brand-error'}`}>
                  {saveMsg}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Test connection */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleTest}
          disabled={testing || !status.configured}
          className="text-[10px] font-medium px-2.5 py-1 rounded-lg border border-brand-border bg-brand-surface hover:bg-brand-surface-alt disabled:opacity-40 transition-colors flex items-center gap-1 text-brand-text-secondary"
        >
          {testing ? <Loader2 size={10} className="animate-spin" /> : null}
          {testing ? '测试中…' : '测试连接'}
        </button>
        {testResult && (
          <span className={`text-[10px] font-medium ${testResult.ok ? 'text-brand-success' : 'text-brand-error'}`}>
            {testResult.ok
              ? `✓ ${testResult.latencyMs}ms`
              : `✗ ${testResult.error?.slice(0, 50)}`}
          </span>
        )}
      </div>
    </div>
  );
}

interface Props {
  statuses: ProviderStatus[];
}

export function ProviderStatusCards({ statuses }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statuses.map((p) => (
        <ProviderCard key={p.name} status={p} />
      ))}
    </div>
  );
}
