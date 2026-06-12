"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Tag, RefreshCw, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fetchSystemeTags, saveNewUserTag } from './actions';
import type { SystemeTag } from '@/lib/email/systeme';

interface Props {
  currentTag: string | null;
}

export function SystemeTagSelector({ currentTag }: Props) {
  const [tags, setTags] = useState<SystemeTag[]>([]);
  const [selected, setSelected] = useState<string>(currentTag ?? '');
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [loadError, setLoadError] = useState<string>('');
  const [savePending, startSave] = useTransition();
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  function loadTags() {
    setLoadState('loading');
    setLoadError('');
    setSaveResult(null);
    fetchSystemeTags().then((result) => {
      if (result.ok) {
        if (result.tags.length > 0) {
          setTags(result.tags);
          setLoadState('loaded');
        } else {
          setLoadError('账户内暂无标签，请先在 systeme.io 创建标签。');
          setLoadState('error');
        }
      } else {
        const hint = result.status === 401 || result.status === 403
          ? '认证失败（401/403），请检查 API Key 是否正确'
          : result.status === 0
          ? result.body
          : `API 返回 ${result.status}：${result.body.slice(0, 120)}`;
        setLoadError(hint);
        setLoadState('error');
      }
    });
  }

  function handleSave() {
    if (!selected) return;
    setSaveResult(null);
    startSave(async () => {
      const res = await saveNewUserTag(selected);
      setSaveResult(res);
    });
  }

  const hasChanged = selected !== (currentTag ?? '');
  const canSave = selected && hasChanged && !savePending;

  return (
    <div className="border-t border-brand-border pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-brand-text-muted" />
          <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
            新用户注册标签
          </span>
        </div>
        <button
          onClick={loadTags}
          disabled={loadState === 'loading'}
          className="flex items-center gap-1 text-xs text-brand-primary hover:underline disabled:opacity-50"
        >
          <RefreshCw size={11} className={loadState === 'loading' ? 'animate-spin' : ''} />
          {loadState === 'idle' ? '获取标签列表' : loadState === 'loading' ? '加载中…' : '刷新'}
        </button>
      </div>

      {/* Current saved tag */}
      {currentTag && loadState === 'idle' && (
        <div className="flex items-center gap-2 text-sm bg-brand-surface-alt px-3 py-2 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-brand-success flex-shrink-0" />
          <span className="text-brand-text-secondary">当前标签：</span>
          <span className="font-medium text-brand-text-primary">{currentTag}</span>
        </div>
      )}

      {/* Tag selector */}
      {loadState === 'loaded' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tags.map((tag) => {
              const isSelected = selected === tag.name;
              return (
                <button
                  key={tag.id}
                  onClick={() => setSelected(tag.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-medium'
                      : 'border-brand-border bg-brand-surface hover:border-brand-primary/50 text-brand-text-secondary'
                  }`}
                >
                  {isSelected && <Check size={12} className="flex-shrink-0" />}
                  <span className="truncate">{tag.name}</span>
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={handleSave}
                disabled={!canSave}
                className="text-xs h-8 px-4 rounded-lg"
              >
                {savePending
                  ? <><Loader2 size={12} className="animate-spin mr-1" />保存中…</>
                  : `保存「${selected}」`}
              </Button>
              {!hasChanged && currentTag && (
                <span className="text-xs text-brand-text-muted">已是当前设置</span>
              )}
            </div>
          )}
        </div>
      )}

      {loadState === 'error' && (
        <div className="text-xs text-brand-error bg-brand-error/10 px-3 py-2 rounded-lg space-y-1">
          <p className="font-medium">获取标签失败</p>
          <p className="text-brand-error/80">{loadError}</p>
        </div>
      )}

      {saveResult && (
        <p className={`text-xs font-medium ${saveResult.success ? 'text-brand-success' : 'text-brand-error'}`}>
          {saveResult.success ? '✓' : '✗'} {saveResult.message}
        </p>
      )}

      <p className="text-xs text-brand-text-muted leading-relaxed">
        选择一个标签后，每位新注册用户将在 systeme.io 中自动创建为联系人并打上此标签，触发对应的自动化序列。
      </p>
    </div>
  );
}
