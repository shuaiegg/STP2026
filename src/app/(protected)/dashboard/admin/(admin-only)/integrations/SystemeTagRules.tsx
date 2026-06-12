"use client";

import React, { useState, useTransition } from 'react';
import { Tag, RefreshCw, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fetchSystemeTags, saveTagRule } from './actions';
import { SYSTEME_TRIGGERS, type SystemeTriggerKey } from '@/lib/integrations/systeme-triggers';
import type { SystemeTag, TagsResult } from '@/lib/email/systeme';

interface Props {
  initialRules: Record<SystemeTriggerKey, string | null>;
}

export function SystemeTagRules({ initialRules }: Props) {
  const [tags, setTags] = useState<SystemeTag[]>([]);
  const [tagsState, setTagsState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [tagsError, setTagsError] = useState('');

  const [rules, setRules] = useState<Record<SystemeTriggerKey, string | null>>(initialRules);
  const [selected, setSelected] = useState<Record<SystemeTriggerKey, string | null>>(initialRules);
  const [savingKey, setSavingKey] = useState<SystemeTriggerKey | null>(null);
  const [saveResults, setSaveResults] = useState<Partial<Record<SystemeTriggerKey, { success: boolean; message: string }>>>({});

  function loadTags() {
    setTagsState('loading');
    setTagsError('');
    fetchSystemeTags().then((result: TagsResult) => {
      if (result.ok) {
        if (result.tags.length === 0) {
          setTagsError('账户内暂无标签，请先在 systeme.io 创建标签。');
          setTagsState('error');
        } else {
          setTags(result.tags);
          setTagsState('loaded');
        }
      } else {
        const hint =
          result.status === 401 || result.status === 403
            ? '认证失败（401/403），请检查 API Key 是否正确'
            : result.status === 0
            ? result.body
            : `API 返回 ${result.status}：${result.body.slice(0, 120)}`;
        setTagsError(hint);
        setTagsState('error');
      }
    });
  }

  async function handleSave(triggerKey: SystemeTriggerKey) {
    const tagName = selected[triggerKey];
    if (!tagName) return;
    setSavingKey(triggerKey);
    setSaveResults((prev) => ({ ...prev, [triggerKey]: undefined }));
    try {
      const res = await saveTagRule(triggerKey, tagName);
      setSaveResults((prev) => ({ ...prev, [triggerKey]: res }));
      if (res.success) {
        setRules((prev) => ({ ...prev, [triggerKey]: tagName }));
      }
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="border-t border-brand-border pt-4 space-y-4">
      {/* Header + load button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-brand-text-muted" />
          <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
            自动化标签规则
          </span>
        </div>
        <button
          onClick={loadTags}
          disabled={tagsState === 'loading'}
          className="flex items-center gap-1 text-xs text-brand-primary hover:underline disabled:opacity-50"
        >
          <RefreshCw size={11} className={tagsState === 'loading' ? 'animate-spin' : ''} />
          {tagsState === 'idle' ? '获取标签列表' : tagsState === 'loading' ? '加载中…' : '刷新'}
        </button>
      </div>

      {tagsState === 'error' && (
        <div className="text-xs text-brand-error bg-brand-error/10 px-3 py-2 rounded-lg space-y-1">
          <p className="font-medium">获取标签失败</p>
          <p className="text-brand-error/80">{tagsError}</p>
        </div>
      )}

      {/* Trigger rows */}
      <div className="space-y-3">
        {SYSTEME_TRIGGERS.map((trigger) => {
          const key = trigger.key;
          const currentTag = rules[key];
          const selectedTag = selected[key];
          const hasChanged = selectedTag !== currentTag;
          const isSaving = savingKey === key;
          const saveResult = saveResults[key];

          return (
            <div key={key} className="rounded-lg border border-brand-border bg-brand-surface-alt p-3 space-y-2">
              {/* Trigger info */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-brand-text-primary">{trigger.label}</p>
                  <p className="text-[11px] text-brand-text-muted">{trigger.description}</p>
                </div>
                {currentTag && (
                  <span className="flex-shrink-0 text-[10px] font-mono bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                    {currentTag}
                  </span>
                )}
              </div>

              {/* Tag selector — only when tags loaded */}
              {tagsState === 'loaded' && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => {
                      const isSelected = selectedTag === tag.name;
                      return (
                        <button
                          key={tag.id}
                          onClick={() => setSelected((prev) => ({ ...prev, [key]: tag.name }))}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                            isSelected
                              ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-medium'
                              : 'border-brand-border bg-brand-surface hover:border-brand-primary/50 text-brand-text-secondary'
                          }`}
                        >
                          {isSelected && <Check size={10} />}
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleSave(key)}
                      disabled={!hasChanged || !selectedTag || isSaving}
                      className="text-[11px] h-7 px-3 rounded-lg"
                    >
                      {isSaving ? (
                        <><Loader2 size={11} className="animate-spin mr-1" />保存中…</>
                      ) : (
                        `保存`
                      )}
                    </Button>
                    {saveResult && (
                      <span className={`text-[11px] font-medium ${saveResult.success ? 'text-brand-success' : 'text-brand-error'}`}>
                        {saveResult.success ? '✓' : '✗'} {saveResult.message}
                      </span>
                    )}
                    {!hasChanged && currentTag && !saveResult && (
                      <span className="text-[11px] text-brand-text-muted">已是当前设置</span>
                    )}
                  </div>
                </div>
              )}

              {tagsState === 'idle' && !currentTag && (
                <p className="text-[11px] text-brand-text-muted italic">点击「获取标签列表」后选择</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-brand-text-muted leading-relaxed">
        每个业务事件触发时，系统将在 systeme.io 中为对应用户创建或更新联系人，并自动打上所选标签。
      </p>
    </div>
  );
}
