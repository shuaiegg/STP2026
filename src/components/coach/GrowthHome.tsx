"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTranslations, useLocale } from 'next-intl';
import {
    Target, Zap, ArrowRight, ShieldCheck, Search, Layers,
    Link2, Send, RefreshCw, FileText, X, PenLine, BarChart3, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { dismissCoachMove, startCoachMove } from '@/app/actions/coach';
import type { GrowthHomeData } from '@/lib/coach/home';

const MOVE_ICONS: Record<string, React.ReactNode> = {
    connect_gsc: <BarChart3 size={18} />,
    define_ontology: <FileText size={18} />,
    add_competitor: <Search size={18} />,
    write_gap_high_intent: <PenLine size={18} />,
    internal_link_optimization: <Link2 size={18} />,
    refresh_decay_content: <RefreshCw size={18} />,
    distribute_to_social: <Send size={18} />,
};

interface GrowthHomeProps {
    site: { id: string; domain: string };
    data: GrowthHomeData;
}

export function GrowthHome({ site, data }: GrowthHomeProps) {
    const t = useTranslations('dashboard.coach');
    const locale = useLocale() as 'zh' | 'en';
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const { stage, insight, moves, pulse } = data;
    const isFoundationStage = stage === '0' || stage === 'unmeasured';

    // Activation funnel: the coach moment is the first "what should I do" surface
    useEffect(() => {
        posthog.capture('first_coach_moment_viewed', { stage, move_count: moves.length });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stageKey = stage === '0' ? 'recon'
        : stage === 'unmeasured' ? 'unmeasured'
        : stage === '1' ? 'plan'
        : 'scale';

    const visibleMoves = moves.filter((m) => !dismissed.has(m.id));

    const handleStart = (type: string) => {
        posthog.capture('first_action_started', { move_type: type, stage });
        startTransition(() => { startCoachMove(site.id, type); });
    };

    const handleDismiss = (e: React.MouseEvent, moveId: string, type: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDismissed((prev) => new Set(prev).add(moveId));
        startTransition(() => { dismissCoachMove(site.id, type); });
    };

    return (
        <div className="space-y-10">
            {/* ── Context bar ───────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-brand-text-primary tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-sm text-brand-text-secondary mt-1">
                        {t('subtitle', { domain: site.domain })}
                    </p>
                </div>
                <Badge variant="default" className="self-start md:self-auto">
                    {t('stageLabel')} · {t(`stages.${stageKey}`)}
                </Badge>
            </div>

            {/* ── Aha insight: understands your business + an opening ── */}
            {insight && (
                <div className="flex items-start gap-3 rounded-lg border border-brand-secondary/30 bg-brand-secondary/5 p-5">
                    <span className="mt-0.5 text-brand-secondary shrink-0"><Sparkles size={20} /></span>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-secondary mb-1">
                            {t('insightLabel')}
                        </p>
                        <p className="text-base text-brand-text-primary leading-relaxed font-display">
                            {insight[locale]}
                        </p>
                    </div>
                </div>
            )}

            {/* ── This week's priorities ────────────────────────────── */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-display font-semibold text-brand-text-primary">
                        {isFoundationStage ? t('foundationFirst') : t('thisWeek')}
                    </h2>
                    {!isFoundationStage && <Badge variant="muted">{t('rankedByImpact')}</Badge>}
                </div>

                {visibleMoves.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {visibleMoves.map((move, i) => (
                            <Link
                                key={move.id}
                                href={move.deepLink.replace('[siteId]', site.id)}
                                onClick={() => handleStart(move.type)}
                                className="group block"
                            >
                                <Card className="p-5 h-full hover:shadow-md transition-shadow flex flex-col relative">
                                    {i === 0 && !isFoundationStage && (
                                        <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                                            {t('priority')}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => handleDismiss(e, move.id, move.type)}
                                        aria-label={t('dismiss')}
                                        className="absolute top-3 right-3 p-1 rounded text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>

                                    <div className="w-9 h-9 rounded-lg bg-brand-surface flex items-center justify-center text-brand-text-secondary group-hover:text-brand-secondary transition-colors mb-3">
                                        {isFoundationStage
                                            ? <span className="font-mono text-sm font-bold">{i + 1}</span>
                                            : (MOVE_ICONS[move.type] ?? <Zap size={18} />)}
                                    </div>

                                    <h3 className="text-base font-display font-semibold text-brand-text-primary leading-snug mb-1.5">
                                        {move.title[locale]}
                                    </h3>
                                    <p className="text-sm text-brand-text-secondary leading-relaxed flex-1">
                                        {move.reason[locale]}
                                    </p>

                                    <div className="flex items-center gap-1.5 text-sm font-medium text-brand-secondary mt-4 pt-3 border-t border-brand-border">
                                        <span>{move.humanCTA[locale]}</span>
                                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Card className="p-10 text-center">
                        <ShieldCheck className="mx-auto text-brand-success mb-3" size={32} />
                        <h3 className="font-display font-semibold text-brand-text-primary">{t('allCaughtUp')}</h3>
                        <p className="text-sm text-brand-text-secondary mt-1 max-w-md mx-auto">{t('allCaughtUpDesc')}</p>
                    </Card>
                )}
            </section>

            {/* ── Momentum (honest, read-only) ──────────────────────── */}
            <section className="space-y-4">
                <h2 className="text-sm font-display font-semibold text-brand-text-primary">{t('pulseTitle')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <PulseCard label={t('pulse.published')} stat={pulse.publishedThisMonth} t={t} />
                    <PulseCard label={t('pulse.gaps')} stat={pulse.gapOpportunities} t={t} />
                    <PulseCard label={t('pulse.impressions')} stat={pulse.impressions30d} t={t} />
                </div>
            </section>

            {/* ── Growth loop: diagnose → produce → measure ─────────── */}
            <section className="space-y-4">
                <h2 className="text-sm font-display font-semibold text-brand-text-primary">{t('loop.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LoopCard
                        href={`/dashboard/site-intelligence/${site.id}#audit`}
                        icon={<Search size={18} />} title={t('loop.diagnose')} desc={t('loop.diagnoseDesc')}
                    />
                    <LoopCard
                        href={`/dashboard/site-intelligence/${site.id}#strategy`}
                        icon={<Target size={18} />} title={t('loop.produce')} desc={t('loop.produceDesc')}
                    />
                    <LoopCard
                        href={`/dashboard/site-intelligence/${site.id}#performance`}
                        icon={<Layers size={18} />} title={t('loop.measure')} desc={t('loop.measureDesc')}
                    />
                </div>
            </section>
        </div>
    );
}

function PulseCard({ label, stat, t }: { label: string; stat: { value: number; available: boolean }; t: ReturnType<typeof useTranslations> }) {
    return (
        <Card className="p-5">
            <p className="text-xs text-brand-text-muted uppercase tracking-widest mb-2">{label}</p>
            {stat.available ? (
                <p className="text-2xl font-display font-bold text-brand-text-primary tabular-nums">
                    {stat.value.toLocaleString()}
                </p>
            ) : (
                <p className="text-sm text-brand-text-muted">{t('pulse.needsGsc')}</p>
            )}
        </Card>
    );
}

function LoopCard({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
    return (
        <Link href={href} className="group block">
            <Card className="p-5 h-full hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-brand-text-secondary group-hover:text-brand-secondary transition-colors">{icon}</span>
                    <h3 className="font-display font-semibold text-brand-text-primary">{title}</h3>
                </div>
                <p className="text-sm text-brand-text-secondary">{desc}</p>
            </Card>
        </Link>
    );
}
