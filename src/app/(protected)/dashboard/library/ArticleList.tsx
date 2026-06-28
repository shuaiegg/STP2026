"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Calendar, Trash2, Edit3,
    CheckCircle2, Clock, AlertCircle,
    Loader2, MousePointerClick, Eye, Trophy, Link2, ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { deleteTrackedArticle } from '@/app/actions/delete-article';
import { backfillArticleUrl } from '@/app/actions/tracked-articles';
import { toast } from 'sonner';
import Link from 'next/link';

/**
 * 验证状态徽章（诚实措辞：SERP 收录/排名，不宣称 AI 引用）
 */
function StatusBadge({ status, url, t }: { status: string; url: string | null; t: (k: string) => string }) {
    if (status === 'CITED') {
        return (
            <Badge className="bg-brand-success/10 text-brand-success border-brand-success/20 flex items-center gap-1 font-bold text-[10px]">
                <CheckCircle2 size={10} /> {t('statusCited')}
            </Badge>
        );
    }
    if (status === 'CHECKING') {
        return (
            <Badge className="bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20 flex items-center gap-1 font-bold text-[10px]">
                <Clock size={10} className="animate-spin" /> {t('statusChecking')}
            </Badge>
        );
    }
    if (status === 'NOT_CITED') {
        return (
            <Badge className="bg-brand-warning/10 text-brand-warning border-brand-warning/20 flex items-center gap-1 font-bold text-[10px]">
                <AlertCircle size={10} /> {t('statusNotCited')}
            </Badge>
        );
    }
    // PENDING — 分两种：有 URL（等待 cron 跑）vs 无 URL（待回填）
    if (url) {
        return (
            <Badge className="bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20 flex items-center gap-1 font-bold text-[10px]">
                <Clock size={10} /> {t('statusPendingVerify')}
            </Badge>
        );
    }
    return (
        <Badge className="bg-brand-surface text-brand-text-muted border-brand-border flex items-center gap-1 font-bold text-[10px]">
            <Clock size={10} /> {t('statusPending')}
        </Badge>
    );
}

/**
 * 回填 URL 的行内表单（仅 PENDING 且无 url 的文章显示）
 */
function BackfillForm({ articleId, t, onSuccess }: { articleId: string; t: (k: string) => string; onSuccess: (url: string) => void }) {
    const [url, setUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [show, setShow] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;
        setIsSubmitting(true);
        try {
            const result = await backfillArticleUrl({ articleId, url: url.trim() });
            if (result.success) {
                toast.success(t('backfillSuccess'));
                onSuccess(url.trim());
                setShow(false);
            } else {
                toast.error(result.message || t('backfillError'));
            }
        } catch {
            toast.error(t('backfillError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!show) {
        return (
            <button
                type="button"
                onClick={() => setShow(true)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-secondary border border-brand-secondary/30 px-2.5 py-1 rounded-lg hover:bg-brand-secondary/5 transition-colors"
                title={t('backfillHint')}
            >
                <Link2 size={11} /> {t('backfillCta')}
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-wrap mt-2">
            <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t('backfillPlaceholder')}
                className="text-xs px-3 py-1.5 rounded-lg border border-brand-border bg-white focus:outline-none focus:border-brand-secondary transition-colors w-72"
                required
                autoFocus
            />
            <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-secondary text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
                {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : null}
                {t('backfillSubmit')}
            </button>
            <button
                type="button"
                onClick={() => setShow(false)}
                className="px-3 py-1.5 rounded-lg border border-brand-border text-brand-text-secondary text-xs font-bold hover:bg-brand-surface transition-colors"
            >
                {t('backfillCancel')}
            </button>
        </form>
    );
}

export function ArticleList({ initialArticles }: { initialArticles: any[] }) {
    const t = useTranslations('dashboard.library');
    const [articles, setArticles] = useState(initialArticles);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm(t('confirmDelete'))) return;
        
        setIsDeleting(id);
        try {
            const res = await deleteTrackedArticle(id);
            if (res.success) {
                setArticles(articles.filter(a => a.id !== id));
                toast.success(t('deleted'));
            }
        } catch (error) {
            toast.error(t('deleteFailed'));
        } finally {
            setIsDeleting(null);
        }
    };

    const handleBackfillSuccess = (articleId: string, url: string) => {
        setArticles(articles.map(a =>
            a.id === articleId ? { ...a, url, status: 'PENDING' } : a
        ));
    };

    return (
        <div className="grid grid-cols-1 gap-4">
            {articles.map((article) => (
                <Card key={article.id} className="p-6 border-2 border-brand-border bg-white hover:border-brand-secondary/20 hover:shadow-xl hover:shadow-brand-secondary/5 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <StatusBadge status={article.status} url={article.url} t={t} />
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">
                                    <Calendar size={12} />
                                    {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                                </div>
                                {/* 已有 URL → 显示为链接 */}
                                {article.url && (
                                    <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] text-brand-secondary hover:underline"
                                    >
                                        <ExternalLink size={10} /> {article.url.replace(/^https?:\/\//, '').slice(0, 40)}
                                    </a>
                                )}
                            </div>
                            
                            <h2 className="text-xl font-black text-brand-text-primary group-hover:text-brand-secondary transition-colors leading-tight">
                                {article.title}
                            </h2>
                            
                            <div className="flex flex-wrap gap-2">
                                {article.keywords.map((kw: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 bg-brand-surface text-brand-text-muted rounded text-[9px] font-black uppercase tracking-wider border border-brand-border">
                                        #{kw}
                                    </span>
                                ))}
                            </div>

                            {/* GSC 归因数据（有 url + GSC 已连接时） */}
                            {article.attribution && (
                                <div className="flex items-center gap-4 mt-2 bg-brand-surface/50 p-2.5 rounded-xl border border-brand-border max-w-fit">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-text-muted">
                                        <MousePointerClick size={12} className="text-brand-secondary" />
                                        {t('clicks', { n: article.attribution.clicks })}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-text-muted">
                                        <Eye size={12} className="text-brand-success" />
                                        {t('impressions', { n: article.attribution.impressions })}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-text-muted">
                                        <Trophy size={12} className="text-brand-warning" />
                                        {t('avgPos', { n: article.attribution.position?.toFixed(1) || '0.0' })}
                                    </div>
                                </div>
                            )}

                            {/* 回填 URL 入口：仅 PENDING 且无 url 的文章 */}
                            {article.status === 'PENDING' && !article.url && (
                                <BackfillForm
                                    articleId={article.id}
                                    t={t}
                                    onSuccess={(url) => handleBackfillSuccess(article.id, url)}
                                />
                            )}
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                            {/* 编辑：常驻主操作（带文字，明确可编辑） */}
                            <Link href={`/dashboard/library/edit/${article.id}`}>
                                <Button
                                    variant="outline"
                                    className="border border-brand-secondary/40 rounded-lg bg-brand-secondary/10 text-brand-secondary hover:bg-brand-secondary hover:text-white font-bold text-xs h-10 px-4 flex items-center gap-1.5 transition-colors"
                                >
                                    <Edit3 size={15} aria-hidden="true" /> {t('editTitle')}
                                </Button>
                            </Link>
                            {/* 删除：次操作，图标 + aria/title 说明 */}
                            <button
                                onClick={() => handleDelete(article.id)}
                                disabled={isDeleting === article.id}
                                aria-label={t('deleteTitle')}
                                title={t('deleteTitle')}
                                className="h-10 w-10 flex items-center justify-center rounded-lg border border-brand-border text-brand-text-muted hover:border-brand-error/40 hover:text-brand-error hover:bg-brand-error/10 transition-colors shrink-0 disabled:opacity-50"
                            >
                                {isDeleting === article.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} aria-hidden="true" />}
                            </button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
