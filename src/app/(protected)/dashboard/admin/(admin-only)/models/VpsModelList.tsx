"use client";

import React, { useState } from 'react';
import { RefreshCw, Loader2, Server, Copy, Check } from 'lucide-react';
import { fetchVpsModels, type VpsModel } from './actions';

export function VpsModelList() {
  const [models, setModels] = useState<VpsModel[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    setState('loading');
    setError('');
    const result = await fetchVpsModels();
    if (result.ok && result.models) {
      setModels(result.models);
      setState('loaded');
    } else {
      setError(result.error ?? '未知错误');
      setState('error');
    }
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server size={14} className="text-brand-text-muted" />
          <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
            CLIProxy 可用模型
          </span>
          {state === 'loaded' && (
            <span className="text-[10px] bg-brand-surface-alt px-2 py-0.5 rounded-full text-brand-text-muted">
              {models.length} 个
            </span>
          )}
        </div>
        <button
          onClick={load}
          disabled={state === 'loading'}
          className="flex items-center gap-1 text-xs text-brand-primary hover:underline disabled:opacity-50"
        >
          <RefreshCw size={11} className={state === 'loading' ? 'animate-spin' : ''} />
          {state === 'idle' ? '获取模型列表' : state === 'loading' ? '加载中…' : '刷新'}
        </button>
      </div>

      {state === 'idle' && (
        <p className="text-xs text-brand-text-muted italic">点击「获取模型列表」查看 VPS 当前可用模型</p>
      )}

      {state === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-brand-text-muted py-4">
          <Loader2 size={13} className="animate-spin" /> 正在连接 CLIProxy…
        </div>
      )}

      {state === 'error' && (
        <div className="text-xs text-brand-error bg-brand-error/10 px-3 py-2 rounded-lg">
          获取失败：{error}
        </div>
      )}

      {state === 'loaded' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
          {models.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-brand-surface-alt border border-brand-border group"
            >
              <span className="text-xs font-mono text-brand-text-primary truncate pr-2">{m.id}</span>
              <button
                onClick={() => copyId(m.id)}
                className="flex-shrink-0 p-1 text-brand-text-muted hover:text-brand-primary opacity-0 group-hover:opacity-100 transition-all"
                aria-label="复制模型 ID"
              >
                {copied === m.id ? <Check size={12} className="text-brand-success" /> : <Copy size={12} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
