"use client";

import React, { useTransition, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, AlertCircle, Loader2, Eye, EyeOff, Trash2 } from 'lucide-react';

export type IntegrationStatus = 'connected' | 'missing' | 'placeholder';

interface ApiKeyEditorProps {
  maskedValue: string | null;
  onSave: (key: string) => Promise<{ success: boolean; message: string }>;
  onDelete?: () => Promise<{ success: boolean; message: string }>;
}

interface IntegrationCardProps {
  name: string;
  description: string;
  status: IntegrationStatus;
  envVar?: string;
  testAction?: () => Promise<{ success: boolean; message: string }>;
  testLabel?: string;
  apiKeyEditor?: ApiKeyEditorProps;
  extra?: React.ReactNode;
  notes?: string;
  icon: React.ReactNode;
}

export function IntegrationCard({
  extra,
  name,
  description,
  status,
  envVar,
  testAction,
  testLabel = '测试连接',
  apiKeyEditor,
  notes,
  icon,
}: IntegrationCardProps) {
  const [testPending, startTest] = useTransition();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleTest() {
    if (!testAction) return;
    setTestResult(null);
    startTest(async () => {
      const res = await testAction();
      setTestResult(res);
    });
  }

  return (
    <Card className="p-6 border-none shadow-sm bg-brand-surface space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-brand-surface-alt flex items-center justify-center flex-shrink-0 text-brand-text-secondary">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-brand-text-primary">{name}</h3>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-brand-text-secondary leading-relaxed">{description}</p>
            {envVar && status === 'missing' && !apiKeyEditor && (
              <p className="mt-2 text-xs text-brand-warning font-mono bg-brand-warning/10 px-2 py-1 rounded inline-block">
                需要设置 {envVar}
              </p>
            )}
            {notes && (
              <p className="mt-2 text-xs text-brand-text-muted">{notes}</p>
            )}
          </div>
        </div>
        {testAction && status !== 'placeholder' && (
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testPending || status === 'missing'}
            className="flex-shrink-0 text-xs h-8 px-3 rounded-lg border-brand-border"
          >
            {testPending ? <Loader2 size={12} className="animate-spin" /> : testLabel}
          </Button>
        )}
      </div>

      {/* Test result */}
      {testResult && (
        <p className={`text-xs font-medium px-3 py-2 rounded-lg ${
          testResult.success
            ? 'text-brand-success bg-brand-success/10'
            : 'text-brand-error bg-brand-error/10'
        }`}>
          {testResult.success ? '✓' : '✗'} {testResult.message}
        </p>
      )}

      {/* API Key editor */}
      {apiKeyEditor && (
        <ApiKeyEditor
          maskedValue={apiKeyEditor.maskedValue}
          onSave={apiKeyEditor.onSave}
          onDelete={apiKeyEditor.onDelete}
        />
      )}

      {/* Extra slot — e.g. tag selector, shown after key is configured */}
      {extra}
    </Card>
  );
}

function ApiKeyEditor({ maskedValue, onSave, onDelete }: ApiKeyEditorProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [visible, setVisible] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleSave() {
    setResult(null);
    startTransition(async () => {
      const res = await onSave(inputValue);
      setResult(res);
      if (res.success) {
        setEditing(false);
        setInputValue('');
      }
    });
  }

  function handleDelete() {
    if (!onDelete) return;
    setResult(null);
    startTransition(async () => {
      const res = await onDelete();
      setResult(res);
    });
  }

  function handleCancel() {
    setEditing(false);
    setInputValue('');
    setResult(null);
  }

  return (
    <div className="border-t border-brand-border pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">API Key</span>
        <div className="flex items-center gap-2">
          {maskedValue && !editing && onDelete && (
            <button
              onClick={handleDelete}
              disabled={pending}
              className="text-xs text-brand-error hover:text-brand-error/80 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={12} />
              删除
            </button>
          )}
          {!editing && (
            <button
              onClick={() => { setEditing(true); setResult(null); }}
              className="text-xs text-brand-primary hover:underline font-medium"
            >
              {maskedValue ? '更换 Key' : '配置 Key'}
            </button>
          )}
        </div>
      </div>

      {/* Current masked value */}
      {maskedValue && !editing && (
        <div className="flex items-center gap-2 font-mono text-sm bg-brand-surface-alt px-3 py-2 rounded-lg">
          <span className="text-brand-text-secondary flex-1">{maskedValue}</span>
          <span className="text-xs text-brand-success font-sans font-semibold">● 已配置（DB）</span>
        </div>
      )}

      {/* Editor */}
      {editing && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type={visible ? 'text' : 'password'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="粘贴 systeme.io API Key..."
              className="w-full font-mono text-sm bg-brand-surface-alt border border-brand-border rounded-lg px-3 py-2 pr-10 text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text-secondary"
            >
              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={pending || !inputValue.trim()}
              className="text-xs h-8 px-4 rounded-lg"
            >
              {pending ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
              保存
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={pending}
              className="text-xs h-8 px-4 rounded-lg border-brand-border"
            >
              取消
            </Button>
            <span className="text-xs text-brand-text-muted">AES-256-GCM 加密存储</span>
          </div>
        </div>
      )}

      {/* Action result */}
      {result && (
        <p className={`text-xs font-medium ${result.success ? 'text-brand-success' : 'text-brand-error'}`}>
          {result.success ? '✓' : '✗'} {result.message}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === 'connected') {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-brand-success bg-brand-success/10 px-2 py-0.5 rounded-full">
        <CheckCircle size={10} /> 已连接
      </span>
    );
  }
  if (status === 'missing') {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-brand-error bg-brand-error/10 px-2 py-0.5 rounded-full">
        <XCircle size={10} /> 未配置
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-brand-text-muted bg-brand-surface-alt px-2 py-0.5 rounded-full">
      <AlertCircle size={10} /> 待接入
    </span>
  );
}
