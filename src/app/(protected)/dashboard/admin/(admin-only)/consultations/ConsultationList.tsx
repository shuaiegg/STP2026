'use client';

import React, { useState } from 'react';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { updateConsultationStatus, type ConsultationStatus } from './actions';

// ─── Label maps ───────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  ai: '🤖 AI 与自动化',
  crawler: '🕷️ 数据爬虫',
  growth: '📈 增长方案',
};

const BUDGET_LABELS: Record<string, string> = {
  '<5k': '< ¥5k/月',
  '5k-20k': '¥5k–20k/月',
  '20k-50k': '¥20k–50k/月',
  '>50k': '> ¥50k/月',
  'project': '项目制',
};

const AD_PLATFORM_LABELS: Record<string, string> = {
  google: 'Google Ads', meta: 'Meta Ads', tiktok: 'TikTok Ads',
  linkedin: 'LinkedIn Ads', xiaohongshu: '小红书', other: '其他',
};

const AD_STATUS_LABELS: Record<string, string> = {
  none: '未有投放经验',
  poor_roi: 'ROI 不理想',
  active_optimize: '正在投放，想优化',
};

const STATUS_OPTIONS: { value: ConsultationStatus; label: string; cls: string }[] = [
  { value: 'PENDING', label: '待处理', cls: 'bg-yellow-100 text-yellow-800' },
  { value: 'REVIEWED', label: '已查看', cls: 'bg-blue-100 text-blue-800' },
  { value: 'CONTACTED', label: '已联系', cls: 'bg-green-100 text-green-800' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConsultationRow {
  id: string;
  createdAt: Date;
  serviceType: string;
  description: string;
  website: string | null;
  targetMarket: string | null;
  budget: string | null;
  name: string;
  email: string;
  wechat: string | null;
  status: string;
  adminNote: string | null;
  details: unknown;
}

// ─── Detail renderers ─────────────────────────────────────────────────────────

function DetailField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] text-brand-text-muted mb-0.5">{label}</p>
      <p className="text-xs text-brand-text-primary whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function AIDetailPanel({ description, d }: { description: string; d: Record<string, any> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <DetailField label="业务场景" value={description} />
      </div>
      <DetailField label="在用工具" value={d.tools} />
      <DetailField label="期望交付形式" value={d.deliveryType} />
      <div className="sm:col-span-2">
        <DetailField label="主要痛点" value={d.painPoints} />
      </div>
    </div>
  );
}

function CrawlerDetailPanel({ description, d }: { description: string; d: Record<string, any> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <DetailField label="目标数据来源" value={description} />
      </div>
      <DetailField label="数据用途" value={d.dataUse} />
      <DetailField label="采集频率" value={d.frequency} />
      <DetailField label="交付格式" value={d.deliveryFormat} />
      <DetailField label="数据量级" value={d.dataVolume} />
    </div>
  );
}

function GrowthDetailPanel({ description, d }: { description: string; d: Record<string, any> }) {
  const platforms = Array.isArray(d.adPlatforms) && d.adPlatforms.length > 0
    ? d.adPlatforms.map((p: string) => AD_PLATFORM_LABELS[p] ?? p).join('、')
    : null;
  const adStatus = d.adStatus ? (AD_STATUS_LABELS[d.adStatus] ?? d.adStatus) : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <DetailField label="网站" value={d.website} />
      <DetailField label="目标市场" value={d.targetMarket} />
      <div className="sm:col-span-2">
        <p className="text-[11px] text-brand-text-muted mb-0.5">竞争对手 / 参考网站</p>
        <p className="text-xs text-brand-text-primary whitespace-pre-wrap">{description}</p>
      </div>
      <DetailField label="当前月访问量" value={d.currentTraffic} />
      <DetailField label="主要目标" value={d.mainGoal} />
      <DetailField label="已投放平台" value={platforms} />
      <DetailField label="投放状态" value={adStatus} />
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${opt.cls}`}>
      {opt.label}
    </span>
  );
}

function ConsultationCard({ item }: { item: ConsultationRow }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(item.status as ConsultationStatus);
  const [note, setNote] = useState(item.adminNote ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const d = (item.details as Record<string, any>) ?? {};

  async function handleStatusChange(newStatus: ConsultationStatus) {
    setStatus(newStatus);
    setSaving(true);
    await updateConsultationStatus(item.id, newStatus);
    setSaving(false);
  }

  async function handleSaveNote() {
    setSaving(true);
    await updateConsultationStatus(item.id, status, note);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="border border-brand-border rounded-xl bg-brand-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-brand-text-primary">{item.name}</span>
            <span className="text-xs text-brand-text-muted">{item.email}</span>
            {item.wechat && <span className="text-xs text-brand-text-muted">· {item.wechat}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[11px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-medium">
              {SERVICE_LABELS[item.serviceType] ?? item.serviceType}
            </span>
            {item.budget && (
              <span className="text-[11px] text-brand-text-muted">{BUDGET_LABELS[item.budget] ?? item.budget}</span>
            )}
            <span className="text-[11px] text-brand-text-muted">
              {new Date(item.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={status} />
          {saving && <Loader2 size={12} className="animate-spin text-brand-text-muted" />}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1 text-brand-text-muted hover:text-brand-text-primary transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-brand-border px-4 py-4 space-y-4 bg-brand-surface-alt">
          {/* Service-specific details */}
          {item.serviceType === 'ai' && <AIDetailPanel description={item.description} d={d} />}
          {item.serviceType === 'crawler' && <CrawlerDetailPanel description={item.description} d={d} />}
          {item.serviceType === 'growth' && <GrowthDetailPanel description={item.description} d={d} />}

          {/* Status management */}
          <div className="space-y-2 pt-2 border-t border-brand-border">
            <p className="text-[11px] font-semibold text-brand-text-muted uppercase tracking-wide">状态管理</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleStatusChange(opt.value)}
                  className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                    status === opt.value
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'border-brand-border text-brand-text-secondary hover:bg-brand-surface'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="备注（仅内部可见）"
                rows={2}
                className="flex-1 text-xs bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary placeholder:text-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none"
              />
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={saving}
                className="self-end text-xs bg-brand-surface border border-brand-border hover:bg-brand-surface-alt px-3 py-2 rounded-lg transition-colors disabled:opacity-40"
              >
                {saved ? '✓ 已保存' : '保存备注'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function ConsultationList({ items }: { items: ConsultationRow[] }) {
  const [filter, setFilter] = useState<ConsultationStatus | 'ALL'>('ALL');

  const filtered = filter === 'ALL' ? items : items.filter((i) => i.status === filter);

  const tabs = [
    { value: 'ALL' as const, label: `全部 (${items.length})` },
    ...STATUS_OPTIONS.map((o) => ({
      value: o.value,
      label: `${o.label} (${items.filter((i) => i.status === o.value).length})`,
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filter === tab.value
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'border-brand-border text-brand-text-secondary hover:bg-brand-surface-alt'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-brand-text-muted text-sm">暂无咨询记录</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <ConsultationCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
