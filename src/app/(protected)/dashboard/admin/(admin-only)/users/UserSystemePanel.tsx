"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, XCircle, Tag, RefreshCw } from 'lucide-react';
import { fetchUserContact, createUserContact, addUserTag, removeUserTag, fetchAvailableTags } from './systeme-actions';
import type { SystemeContact, SystemeTag } from '@/lib/email/systeme';

interface Props {
  userId: string;
  email: string;
  name: string;
  onClose: () => void;
}

type LoadState = 'loading' | 'loaded' | 'error' | 'not-found';
type TagLoadState = 'idle' | 'loading' | 'loaded' | 'error';

export function UserSystemePanel({ email, name, onClose }: Props) {
  const [contact, setContact] = useState<SystemeContact | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadError, setLoadError] = useState('');

  const [availableTags, setAvailableTags] = useState<SystemeTag[]>([]);
  const [tagLoadState, setTagLoadState] = useState<TagLoadState>('idle');
  const [tagLoadError, setTagLoadError] = useState('');

  const [addingTag, setAddingTag] = useState(false);
  const [selectedNewTag, setSelectedNewTag] = useState<SystemeTag | null>(null);
  const [isSavingTag, setIsSavingTag] = useState(false);

  const [removingTagId, setRemovingTagId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function loadContact() {
    setLoadState('loading');
    setLoadError('');
    setActionMsg(null);
    const result = await fetchUserContact(email, name);
    if (result.ok) {
      setContact(result.contact);
      setLoadState('loaded');
    } else if (result.notFound) {
      setContact(null);
      setLoadState('not-found');
    } else {
      setLoadError(result.body.slice(0, 120));
      setLoadState('error');
    }
  }

  async function loadAvailableTags() {
    setTagLoadState('loading');
    setTagLoadError('');
    const result = await fetchAvailableTags();
    if (result.ok) {
      setAvailableTags(result.tags);
      setTagLoadState('loaded');
    } else {
      const hint =
        result.status === 401 || result.status === 403
          ? '认证失败，请检查 API Key'
          : result.status === 0
          ? result.body
          : `API 返回 ${result.status}`;
      setTagLoadError(hint);
      setTagLoadState('error');
    }
  }

  useEffect(() => { loadContact(); }, [email]);

  function openAddTag() {
    setAddingTag(true);
    setSelectedNewTag(null);
    setActionMsg(null);
    if (tagLoadState === 'idle') loadAvailableTags();
  }

  async function handleAddTag() {
    if (!selectedNewTag) return;
    setIsSavingTag(true);
    setActionMsg(null);
    const res = await addUserTag(email, name, selectedNewTag.id, selectedNewTag.name);
    setActionMsg({ ok: res.success, text: res.message });
    if (res.success) {
      setAddingTag(false);
      setSelectedNewTag(null);
      await loadContact();
    }
    setIsSavingTag(false);
  }

  async function handleRemoveTag(contactId: number, tagId: number, tagName: string) {
    setRemovingTagId(tagId);
    setActionMsg(null);
    const res = await removeUserTag(contactId, tagId, tagName);
    setActionMsg({ ok: res.success, text: res.message });
    if (res.success) await loadContact();
    setRemovingTagId(null);
  }

  async function handleCreateContact() {
    setLoadState('loading');
    await createUserContact(email, name);
    await loadContact();
  }

  const currentTagNames = new Set(contact?.tags.map((t) => t.name) ?? []);
  const addableTags = availableTags.filter((t) => !currentTagNames.has(t.name));

  return (
    <div className="bg-brand-surface rounded-lg border border-brand-primary/10 shadow-sm p-4 animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-xs font-bold text-brand-text-secondary uppercase tracking-widest flex items-center gap-2">
          <Tag size={12} />
          systeme.io 标签 — {email}
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={loadContact}
            disabled={loadState === 'loading'}
            className="p-1 text-brand-text-muted hover:text-brand-text-secondary disabled:opacity-40"
            aria-label="刷新"
          >
            <RefreshCw size={13} className={loadState === 'loading' ? 'animate-spin' : ''} />
          </button>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-text-secondary" aria-label="关闭">
            <XCircle size={16} />
          </button>
        </div>
      </div>

      {/* Loading contact */}
      {loadState === 'loading' && (
        <div className="py-6 flex justify-center">
          <Loader2 size={18} className="animate-spin text-brand-primary/40" />
        </div>
      )}

      {/* Error loading contact */}
      {loadState === 'error' && (
        <div className="py-3 text-xs text-brand-error bg-brand-error/10 px-3 rounded-lg">
          获取联系人失败：{loadError}
        </div>
      )}

      {/* Contact not found */}
      {loadState === 'not-found' && (
        <div className="py-4 text-center space-y-3">
          <p className="text-xs text-brand-text-muted">该用户尚未在 systeme.io 中创建联系人</p>
          <button
            onClick={handleCreateContact}
            className="text-xs text-brand-primary hover:underline font-medium flex items-center gap-1 mx-auto"
          >
            <Plus size={12} />
            创建联系人
          </button>
        </div>
      )}

      {/* Contact loaded */}
      {loadState === 'loaded' && contact && (
        <div className="space-y-3">
          {/* Current tags */}
          {contact.tags.length === 0 ? (
            <p className="text-xs text-brand-text-muted italic">暂无标签</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="flex items-center gap-1 px-2.5 py-1 bg-brand-primary/10 text-brand-primary text-[11px] font-medium rounded-full border border-brand-primary/20"
                >
                  {tag.name}
                  <button
                    onClick={() => handleRemoveTag(contact.id, tag.id, tag.name)}
                    disabled={removingTagId === tag.id}
                    className="hover:text-brand-error transition-colors ml-0.5"
                    aria-label={`移除标签 ${tag.name}`}
                  >
                    {removingTagId === tag.id
                      ? <Loader2 size={10} className="animate-spin" />
                      : <X size={10} />}
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add tag section */}
          {addingTag ? (
            <div className="space-y-2 border-t border-brand-border pt-2">
              {/* Tags loading */}
              {tagLoadState === 'loading' && (
                <div className="flex items-center gap-2 text-xs text-brand-text-muted">
                  <Loader2 size={12} className="animate-spin" />
                  加载标签列表…
                </div>
              )}

              {/* Tags error */}
              {tagLoadState === 'error' && (
                <div className="space-y-1">
                  <p className="text-xs text-brand-error">{tagLoadError}</p>
                  <button onClick={loadAvailableTags} className="text-xs text-brand-primary hover:underline flex items-center gap-1">
                    <RefreshCw size={11} /> 重试
                  </button>
                </div>
              )}

              {/* Tags loaded */}
              {tagLoadState === 'loaded' && (
                addableTags.length === 0 ? (
                  <p className="text-xs text-brand-text-muted italic">
                    {availableTags.length === 0 ? 'systeme.io 账户内暂无标签' : '所有标签已全部添加'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {addableTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => setSelectedNewTag(tag)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                          selectedNewTag?.id === tag.id
                            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-medium'
                            : 'border-brand-border bg-brand-surface hover:border-brand-primary/50 text-brand-text-secondary'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddTag}
                  disabled={!selectedNewTag?.id || isSavingTag}
                  className="text-[11px] bg-brand-primary text-white px-3 py-1 rounded-lg disabled:opacity-40 hover:bg-brand-primary/90 transition-colors flex items-center gap-1"
                >
                  {isSavingTag && <Loader2 size={10} className="animate-spin" />}
                  {isSavingTag ? '添加中…' : '确认添加'}
                </button>
                <button
                  onClick={() => { setAddingTag(false); setSelectedNewTag(null); }}
                  className="text-[11px] text-brand-text-muted hover:text-brand-text-secondary"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={openAddTag}
              className="flex items-center gap-1 text-[11px] text-brand-primary hover:underline font-medium"
            >
              <Plus size={12} /> 添加标签
            </button>
          )}
        </div>
      )}

      {/* Action feedback */}
      {actionMsg && (
        <p className={`mt-2 text-[11px] font-medium break-all ${actionMsg.ok ? 'text-brand-success' : 'text-brand-error'}`}>
          {actionMsg.ok ? '✓' : '✗'} {actionMsg.text}
        </p>
      )}
    </div>
  );
}
