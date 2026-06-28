"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import {
    Trophy, ChevronDown, ChevronRight, ArrowRight, PenLine,
    Zap, BookOpen, AlertCircle, CheckCircle2, Loader2, Clock, Link2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ContentBlueprint, BlueprintPillar } from '@/lib/coach/home';
import { backfillArticleUrl } from '@/app/actions/tracked-articles';

const COPY = {
    panelTitle: { zh: '内容资产蓝图', en: 'Content Asset Blueprint' },
    equityLabel: { zh: '支柱', en: 'pillars' },
    equityCovered: { zh: '已覆盖', en: 'covered' },
    monthlyDelta: { zh: '本月发布', en: 'published this month' },
    expectation: {
        zh: '真实排名约需 4–8 周。在此之前，每完成一篇内容，您的"内容权益"就在涨——这是领先指标。',
        en: 'Rankings take 4–8 weeks. Until then, every piece you publish grows your Content Equity — that\'s your leading indicator.',
    },
    editDna: { zh: '基于您的业务基因 · 编辑', en: 'Based on your Business DNA · Edit' },
    crownedTitle: { zh: '最快下一步', en: 'Fastest Next Step' },
    crownedBadge: { zh: '需求高 · 未覆盖', en: 'High Demand · Uncovered' },
    writeCta: { zh: '开始写作', en: 'Start writing' },
    generatePlanCta: { zh: '一键生成计划', en: 'Generate plan' },
    generating: { zh: '生成中…', en: 'Generating…' },
    planSuccess: { zh: '内容计划已生成，前往策略板查看。', en: 'Content plan generated — view it on the strategy board.' },
    planConflict: { zh: '已有进行中的计划，继续将归档旧计划', en: 'An active plan exists — continuing will archive it' },
    planConflictConfirm: { zh: '继续生成', en: 'Continue' },
    planConflictCancel: { zh: '取消', en: 'Cancel' },
    planError: { zh: '生成失败，请稍后重试。', en: 'Generation failed, please try again.' },
    colTopic: { zh: '支柱', en: 'Pillar' },
    colCoverage: { zh: '覆盖', en: 'Coverage' },
    colProof: { zh: '证据', en: 'Proof' },
    colDemand: { zh: '需求', en: 'Demand' },
    colAction: { zh: '动作', en: 'Action' },
    covered: { zh: '已建立', en: 'Established' },
    proofGapAction: { zh: '补证据', en: 'Strengthen' },
    writeAction: { zh: '写作', en: 'Write' },
    whyTitle: { zh: '为什么重要', en: 'Why this matters' },
    subtopicsTitle: { zh: '子话题', en: 'Subtopics' },
    noGsc: { zh: '—', en: '—' },
    demandHigh: { zh: '高', en: 'High' },
    demandMed: { zh: '中', en: 'Med' },
    demandLow: { zh: '低', en: 'Low' },
    emptyTitle: { zh: '蓝图待生成', en: 'Blueprint not ready' },
    emptyDesc: {
        zh: '请先确认业务基因（运行 DNA 提取）并完成站点审计，蓝图将自动就绪。',
        en: 'Confirm your Business DNA (run DNA extraction) and complete a site audit — the blueprint will appear automatically.',
    },
    confirmDna: { zh: '去确认业务基因 →', en: 'Confirm Business DNA →' },
    logicChainsTitle: { zh: '业务逻辑链（站点级）', en: 'Business Logic Chains (site-level)' },
    problem: { zh: '问题', en: 'Problem' },
    solution: { zh: '解法', en: 'Solution' },
    proof: { zh: '证明', en: 'Proof' },
    // 三态标签
    statusDrafted: { zh: '已起草·待发布', en: 'Drafted · Pending publish' },
    statusPendingVerify: { zh: '验证中·待收录', en: 'Pending SERP verify' },
    statusVerified: { zh: '已建立', en: 'Established' },
    // 回填 CTA
    backfillCta: { zh: '去发布并回填 URL', en: 'Publish & backfill URL' },
    backfillPlaceholder: { zh: '粘贴已发布的文章 URL…', en: 'Paste the published article URL…' },
    backfillSubmit: { zh: '提交', en: 'Submit' },
    backfillCancel: { zh: '取消', en: 'Cancel' },
    backfillSuccess: { zh: 'URL 已回填，将验证 Google 搜索收录与排名。', en: 'URL saved. We\'ll verify Google search indexing & ranking.' },
    backfillError: { zh: '回填失败，请检查 URL 格式。', en: 'Backfill failed. Check URL format.' },
    backfillHint: { zh: '发布后把文章 URL 贴这里，我们会验证它在 Google 搜索的收录与排名。', en: 'After publishing, paste your article URL here — we\'ll verify its Google search indexing and ranking.' },
} as const;

const RELEVANCE_LABEL: Record<string, { zh: string; en: string }> = {
    high: { zh: '高关联', en: 'High relevance' },
    medium: { zh: '中关联', en: 'Med relevance' },
    low: { zh: '低关联', en: 'Low relevance' },
};

interface Props {
    siteId: string;
    blueprint: ContentBlueprint;
    locale: 'zh' | 'en';
    onStrategySwitch?: () => void;
}

export function ContentAssetBlueprint({ siteId, blueprint, locale, onStrategySwitch }: Props) {
    const router = useRouter();
    const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
    const [showLogicChains, setShowLogicChains] = useState(false);
    const [generatingState, setGeneratingState] = useState<'idle' | 'generating' | 'confirm'>('idle');

    const t = (key: keyof typeof COPY) => (COPY[key] as { zh: string; en: string })[locale];

    const { pillars, coveredCount, totalCount, monthlyDelta, crownedTopic, logicChains } = blueprint;

    const crownedPillar = pillars.find((p) => p.topic === crownedTopic) ?? null;
    const remainingPillars = pillars.filter((p) => p.topic !== crownedTopic);

    const handleGeneratePlan = async (override = false) => {
        setGeneratingState('generating');
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/strategy/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ override }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(t('planError'));
                setGeneratingState('idle');
                return;
            }
            if (data.conflict && !override) {
                setGeneratingState('confirm');
                return;
            }
            toast.success(t('planSuccess'));
            if (onStrategySwitch) {
                onStrategySwitch();
            } else {
                router.push(`/dashboard/site-intelligence/${siteId}#strategy`);
            }
        } catch {
            toast.error(t('planError'));
        } finally {
            setGeneratingState((s) => s === 'generating' ? 'idle' : s);
        }
    };

    // ── Empty state ──────────────────────────────────────────────────────────
    if (pillars.length === 0) {
        return (
            <Card className="p-8 border-dashed border-brand-border text-center space-y-3">
                <BookOpen size={28} className="mx-auto text-brand-text-muted" aria-hidden="true" />
                <h3 className="font-display font-semibold text-brand-text-primary">{t('emptyTitle')}</h3>
                <p className="text-sm text-brand-text-secondary max-w-sm mx-auto">{t('emptyDesc')}</p>
                <Link
                    href={`/dashboard/site-intelligence/${siteId}#overview`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-secondary"
                >
                    {t('confirmDna')} <ArrowRight size={14} />
                </Link>
            </Card>
        );
    }

    return (
        <div className="space-y-5">
            {/* ── Leading indicator header ─────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-display font-semibold text-brand-text-primary">
                        {t('panelTitle')}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-xs font-bold">
                        <CheckCircle2 size={12} aria-hidden="true" />
                        {coveredCount}/{totalCount} {t('equityLabel')} {t('equityCovered')}
                    </span>
                    {monthlyDelta > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-success/10 text-brand-success text-xs font-bold">
                            ▲ +{monthlyDelta} {t('monthlyDelta')}
                        </span>
                    )}
                </div>

                {/* Generate plan CTA / inline conflict confirm */}
                {generatingState === 'confirm' ? (
                    <div className="flex items-center gap-2 text-xs" role="alert">
                        <span className="text-brand-text-secondary">{t('planConflict')}</span>
                        <button
                            type="button"
                            onClick={() => handleGeneratePlan(true)}
                            className="px-3 py-1.5 rounded-lg bg-brand-secondary text-white font-bold hover:opacity-90 transition-opacity"
                        >
                            {t('planConflictConfirm')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setGeneratingState('idle')}
                            className="px-3 py-1.5 rounded-lg border border-brand-border text-brand-text-secondary font-bold hover:bg-brand-surface transition-colors"
                        >
                            {t('planConflictCancel')}
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => handleGeneratePlan(false)}
                        disabled={generatingState === 'generating'}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-brand-secondary text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                        aria-label={locale === 'zh' ? '一键生成内容计划' : 'Generate content plan from blueprint gaps'}
                    >
                        {generatingState === 'generating' ? (
                            <><Loader2 size={13} className="animate-spin" aria-hidden="true" /> {t('generating')}</>
                        ) : (
                            <><Zap size={13} aria-hidden="true" /> {t('generatePlanCta')}</>
                        )}
                    </button>
                )}
            </div>

            {/* ── Expectation management + edit DNA entry ──────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-brand-text-muted leading-relaxed">{t('expectation')}</p>
                <Link
                    href={`/dashboard/site-intelligence/${siteId}#overview`}
                    className="inline-flex items-center gap-1 shrink-0 text-xs font-medium text-brand-text-secondary hover:text-brand-secondary transition-colors"
                >
                    {t('editDna')} <ArrowRight size={12} aria-hidden="true" />
                </Link>
            </div>

            {/* ── Crowned card: fastest next step ─────────────────────── */}
            {crownedPillar && (
                <Card className="p-5 border border-brand-secondary/30 bg-brand-secondary/5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-brand-secondary shrink-0">
                                <Trophy size={18} aria-hidden="true" />
                            </span>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                                    {t('crownedTitle')}
                                </p>
                                <h3 className="font-display font-semibold text-brand-text-primary text-base">
                                    {crownedPillar.topic}
                                </h3>
                                <p className="text-xs text-brand-text-secondary">
                                    {crownedPillar.relevance && RELEVANCE_LABEL[crownedPillar.relevance]
                                        ? RELEVANCE_LABEL[crownedPillar.relevance][locale]
                                        : ''}
                                    {' · '}
                                    <span className="text-brand-warning font-medium">{t('crownedBadge')}</span>
                                </p>
                            </div>
                        </div>
                        <Link
                            href={`${locale === 'zh' ? '/zh' : ''}/tools/geo-writer?keyword=${encodeURIComponent(crownedPillar.topic)}&siteId=${encodeURIComponent(siteId)}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-secondary text-white text-xs font-bold hover:opacity-90 transition-opacity shrink-0"
                            aria-label={`${t('writeCta')}: ${crownedPillar.topic}`}
                        >
                            <PenLine size={13} aria-hidden="true" /> {t('writeCta')}
                        </Link>
                    </div>
                </Card>
            )}

            {/* ── Pillar table ─────────────────────────────────────────── */}
            <Card className="overflow-hidden">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_100px_100px_80px_90px] gap-3 px-5 py-3 bg-brand-surface border-b border-brand-border text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">
                    <span>{t('colTopic')}</span>
                    <span>{t('colCoverage')}</span>
                    <span>{t('colProof')}</span>
                    <span>{t('colDemand')}</span>
                    <span>{t('colAction')}</span>
                </div>

                <div className="divide-y divide-brand-border">
                    {[...(crownedPillar ? [crownedPillar] : []), ...remainingPillars].map((pillar) => (
                        <PillarRow
                            key={pillar.topic}
                            pillar={pillar}
                            siteId={siteId}
                            locale={locale}
                            isExpanded={expandedTopic === pillar.topic}
                            isCrewned={pillar.topic === crownedTopic}
                            onToggle={() => setExpandedTopic(expandedTopic === pillar.topic ? null : pillar.topic)}
                            t={t}
                        />
                    ))}
                </div>
            </Card>

            {/* ── Logic chains (site-level, optional) ─────────────────── */}
            {logicChains.length > 0 && (
                <div className="space-y-2">
                    <button
                        type="button"
                        className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-brand-text-secondary transition-colors font-medium"
                        onClick={() => setShowLogicChains((v) => !v)}
                        aria-expanded={showLogicChains}
                    >
                        {showLogicChains ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}
                        {t('logicChainsTitle')}
                    </button>
                    {showLogicChains && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {logicChains.slice(0, 4).map((chain, i) => (
                                <Card key={i} className="p-4 bg-brand-surface text-xs space-y-1.5">
                                    <p><span className="font-bold text-brand-text-muted uppercase tracking-wide text-[10px]">{t('problem')}</span> {chain.problem}</p>
                                    <p><span className="font-bold text-brand-text-muted uppercase tracking-wide text-[10px]">{t('solution')}</span> {chain.solution}</p>
                                    <p><span className="font-bold text-brand-text-muted uppercase tracking-wide text-[10px]">{t('proof')}</span> {chain.proof}</p>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Pillar row ────────────────────────────────────────────────────────────────

interface PillarRowProps {
    pillar: BlueprintPillar;
    siteId: string;
    locale: 'zh' | 'en';
    isExpanded: boolean;
    isCrewned: boolean;
    onToggle: () => void;
    t: (key: keyof typeof COPY) => string;
}

function PillarRow({ pillar, siteId, locale, isExpanded, isCrewned, onToggle, t }: PillarRowProps) {
    const { topic, subtopics, relevance, coverageScore, proofDensity, gscImpressions, isCovered, hasProofGap, pillarStatus, draftArticleId } = pillar;
    const [showBackfill, setShowBackfill] = useState(false);
    const [backfillUrl, setBackfillUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const demandLabel = gscImpressions === null
        ? t('noGsc')
        : gscImpressions > 1000 ? t('demandHigh')
        : gscImpressions > 200 ? t('demandMed')
        : t('demandLow');

    const demandColor = gscImpressions === null ? 'text-brand-text-muted'
        : gscImpressions > 1000 ? 'text-brand-success'
        : gscImpressions > 200 ? 'text-brand-warning'
        : 'text-brand-text-muted';

    const handleBackfill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!draftArticleId || !backfillUrl.trim()) return;
        setIsSubmitting(true);
        try {
            const result = await backfillArticleUrl({ articleId: draftArticleId, url: backfillUrl.trim() });
            if (result.success) {
                toast.success(t('backfillSuccess'));
                setShowBackfill(false);
                setBackfillUrl('');
            } else {
                toast.error(result.message || t('backfillError'));
            }
        } catch {
            toast.error(t('backfillError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    /** 渲染状态图标（Topic 列左侧）*/
    const StatusIcon = () => {
        switch (pillarStatus) {
            case 'verified':
                return <CheckCircle2 size={14} className="text-brand-success shrink-0" aria-label={locale === 'zh' ? '已建立' : 'Verified'} />;
            case 'drafted':
                return <PenLine size={14} className="text-brand-warning shrink-0" aria-label={locale === 'zh' ? '已起草' : 'Drafted'} />;
            case 'pending_verify':
                return <Clock size={14} className="text-brand-secondary shrink-0" aria-label={locale === 'zh' ? '验证中' : 'Pending verify'} />;
            default:
                return <AlertCircle size={14} className="text-brand-text-muted shrink-0" aria-label={locale === 'zh' ? '未覆盖' : 'Uncovered'} />;
        }
    };

    /** 渲染 Action 列 */
    const ActionCell = ({ isMobile = false }: { isMobile?: boolean }) => {
        const cls = isMobile
            ? 'text-[10px] font-bold border px-2 py-0.5 rounded-lg transition-colors'
            : 'text-[10px] font-bold border px-2 py-1 rounded-lg transition-colors whitespace-nowrap';

        if (pillarStatus === 'verified' && !hasProofGap) {
            return <span className="text-[10px] font-bold text-brand-success">{t('statusVerified')}</span>;
        }
        if (hasProofGap) {
            return (
                <Link
                    href={`${locale === 'zh' ? '/zh' : ''}/tools/geo-writer?keyword=${encodeURIComponent(topic)}&siteId=${encodeURIComponent(siteId)}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`${cls} text-brand-warning border-brand-warning/30 hover:bg-brand-warning/10`}
                    aria-label={`${t('proofGapAction')}: ${topic}`}
                >
                    {t('proofGapAction')}
                </Link>
            );
        }
        if (pillarStatus === 'drafted') {
            return (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowBackfill(true); }}
                    className={`${cls} text-brand-warning border-brand-warning/30 hover:bg-brand-warning/10`}
                    aria-label={`${t('backfillCta')}: ${topic}`}
                >
                    <Link2 size={10} className="inline mr-1" aria-hidden="true" />{t('backfillCta')}
                </button>
            );
        }
        if (pillarStatus === 'pending_verify') {
            return <span className="text-[10px] font-bold text-brand-secondary">{t('statusPendingVerify')}</span>;
        }
        // uncovered → write
        return (
            <Link
                href={`${locale === 'zh' ? '/zh' : ''}/tools/geo-writer?keyword=${encodeURIComponent(topic)}&siteId=${encodeURIComponent(siteId)}`}
                onClick={(e) => e.stopPropagation()}
                className={`${cls} text-brand-secondary border-brand-secondary/30 hover:bg-brand-secondary/10`}
                aria-label={`${t('writeAction')}: ${topic}`}
            >
                {t('writeAction')}
            </Link>
        );
    };

    return (
        <>
            <button
                type="button"
                className={`w-full text-left px-5 py-4 hover:bg-brand-surface/60 transition-colors ${isCrewned ? 'bg-brand-secondary/3' : ''}`}
                onClick={onToggle}
                aria-expanded={isExpanded}
                aria-label={`${topic} — ${isExpanded ? (locale === 'zh' ? '收起' : 'collapse') : (locale === 'zh' ? '展开' : 'expand')}`}
            >
                {/* Mobile layout */}
                <div className="sm:hidden space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <StatusIcon />
                            <span className="text-sm font-medium text-brand-text-primary truncate">{topic}</span>
                        </div>
                        <ChevronDown size={14} className={`text-brand-text-muted shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <DualBar coverageScore={coverageScore} proofDensity={proofDensity} locale={locale} />
                        <ActionCell isMobile />
                    </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden sm:grid grid-cols-[1fr_100px_100px_80px_110px] gap-3 items-center">
                    {/* Topic */}
                    <div className="flex items-center gap-2 min-w-0">
                        <StatusIcon />
                        <span className="text-sm font-medium text-brand-text-primary truncate">{topic}</span>
                        <ChevronDown size={13} className={`text-brand-text-muted shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </div>

                    {/* Coverage bar */}
                    <AxisBar value={coverageScore} color="bg-brand-secondary" label={locale === 'zh' ? '覆盖度' : 'Coverage'} />

                    {/* Proof bar */}
                    <AxisBar value={proofDensity} color="bg-brand-success" label={locale === 'zh' ? '证据密度' : 'Proof density'} />

                    {/* Demand */}
                    <span className={`text-xs font-bold ${demandColor}`} aria-label={`${locale === 'zh' ? '需求' : 'Demand'}: ${demandLabel}`}>
                        {demandLabel}
                    </span>

                    {/* Action */}
                    <ActionCell />
                </div>
            </button>

            {/* Backfill URL inline form — shown when drafted pillar "去发布并回填URL" clicked */}
            {showBackfill && (
                <div className="px-5 py-3 bg-brand-warning/5 border-t border-brand-warning/20" role="form" aria-label={locale === 'zh' ? 'URL 回填' : 'URL backfill'}>
                    <p className="text-xs text-brand-text-secondary mb-2">{t('backfillHint')}</p>
                    <form onSubmit={handleBackfill} className="flex items-center gap-2">
                        <input
                            type="url"
                            value={backfillUrl}
                            onChange={(e) => setBackfillUrl(e.target.value)}
                            placeholder={t('backfillPlaceholder')}
                            className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface focus:outline-none focus:border-brand-secondary transition-colors"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-secondary text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : null}
                            {t('backfillSubmit')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowBackfill(false)}
                            className="px-3 py-1.5 rounded-lg border border-brand-border text-brand-text-secondary text-xs font-bold hover:bg-brand-surface transition-colors"
                        >
                            {t('backfillCancel')}
                        </button>
                    </form>
                </div>
            )}


            {/* Expanded detail */}
            {isExpanded && (
                <div className="px-5 py-4 bg-brand-surface border-t border-brand-border space-y-3 animate-scale-in">
                    {/* Why this matters */}
                    {relevance && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">{t('whyTitle')}</p>
                            <p className="text-sm text-brand-text-secondary leading-relaxed">
                                <span className={`inline-block mr-1.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                                    relevance === 'high' ? 'bg-brand-success/10 text-brand-success'
                                    : relevance === 'medium' ? 'bg-brand-warning/10 text-brand-warning'
                                    : 'bg-brand-surface text-brand-text-muted'
                                }`}>
                                    {RELEVANCE_LABEL[relevance]?.[locale] ?? relevance}
                                </span>
                                {locale === 'zh'
                                    ? `「${topic}」对您的业务而言是${RELEVANCE_LABEL[relevance]?.[locale] ?? relevance}的内容支柱。覆盖它有助于建立话题权威、提升 AI 被引概率。`
                                    : `"${topic}" is a ${RELEVANCE_LABEL[relevance]?.[locale] ?? relevance} content pillar for your business. Covering it builds topical authority and improves AI citation probability.`
                                }
                            </p>
                        </div>
                    )}

                    {/* Subtopics */}
                    {subtopics.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">{t('subtopicsTitle')}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {subtopics.map((sub, i) => (
                                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-brand-surface border border-brand-border text-brand-text-secondary">
                                        {sub}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

// ─── Dual bar (mobile compact) ────────────────────────────────────────────────

function DualBar({ coverageScore, proofDensity, locale }: { coverageScore: number | null; proofDensity: number | null; locale: 'zh' | 'en' }) {
    return (
        <div className="flex items-center gap-2 text-[10px] text-brand-text-muted">
            <span>{locale === 'zh' ? '覆盖' : 'Cov'} {coverageScore ?? 0}%</span>
            <span aria-hidden="true">·</span>
            <span>{locale === 'zh' ? '证据' : 'Proof'} {proofDensity ?? 0}%</span>
        </div>
    );
}

// ─── Single axis bar ──────────────────────────────────────────────────────────

function AxisBar({ value, color, label }: { value: number | null; color: string; label: string }) {
    const pct = value ?? 0;
    return (
        <div className="space-y-1" aria-label={`${label}: ${pct}%`}>
            <div className="h-1.5 rounded-full bg-brand-border overflow-hidden w-full" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-brand-text-muted tabular-nums">{pct}%</span>
        </div>
    );
}
