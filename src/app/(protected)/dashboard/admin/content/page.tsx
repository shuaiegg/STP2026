import React from 'react';
import {
    FileText,
    Plus,
    RefreshCw,
    ExternalLink,
    Edit,
    Eye,
    MoreHorizontal,
    ChevronRight,
    Search,
    Filter
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import prisma from '@/lib/prisma';
import Link from 'next/link';

async function getContent() {
    return await prisma.content.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            category: true,
        }
    });
}

interface PageProps {
    searchParams: Promise<{ locale?: string }>;
}

export default async function ContentManagement({ searchParams }: PageProps) {
    const { locale = 'all' } = await searchParams;
    const allContents = await getContent();

    // Group contents by translationGroupId to find pairs
    const translationGroups = allContents.reduce((acc, item) => {
        if (item.translationGroupId) {
            if (!acc[item.translationGroupId]) {
                acc[item.translationGroupId] = [];
            }
            acc[item.translationGroupId].push(item);
        }
        return acc;
    }, {} as Record<string, typeof allContents>);

    // Filter contentList by selected locale
    const contentList = locale === 'all'
        ? allContents
        : allContents.filter(item => item.locale === locale);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-text-primary mb-2">内容管理</h1>
                    <p className="text-brand-text-secondary">管理全平台博客文章、页面与课程。</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" className="gap-2 font-bold text-xs uppercase tracking-widest bg-brand-surface shadow-sm border border-brand-border">
                        <Filter size={16} />
                        筛选
                    </Button>
                    <Link href="/dashboard/admin/content/new">
                        <Button variant="gradient" className="gap-2 font-bold text-xs uppercase tracking-widest">
                            <Plus size={16} />
                            新建文章
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-brand-surface overflow-hidden">
                {/* Locale Filter Tabs */}
                <div className="flex border-b border-brand-border px-6 pt-4 bg-brand-surface-alt/10">
                    <Link
                        href="/dashboard/admin/content?locale=all"
                        className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                            locale === 'all'
                                ? 'border-brand-primary text-brand-primary font-black'
                                : 'border-transparent text-brand-text-muted hover:text-brand-text-primary'
                        }`}
                    >
                        全部 (ALL)
                    </Link>
                    <Link
                        href="/dashboard/admin/content?locale=en"
                        className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                            locale === 'en'
                                ? 'border-brand-primary text-brand-primary font-black'
                                : 'border-transparent text-brand-text-muted hover:text-brand-text-primary'
                        }`}
                    >
                        英文 (EN)
                    </Link>
                    <Link
                        href="/dashboard/admin/content?locale=zh"
                        className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                            locale === 'zh'
                                ? 'border-brand-primary text-brand-primary font-black'
                                : 'border-transparent text-brand-text-muted hover:text-brand-text-primary'
                        }`}
                    >
                        中文 (ZH)
                    </Link>
                </div>

                {/* Table Header / Search */}
                <div className="p-6 border-b border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="搜索文章、Slug..."
                            aria-label="搜索文章或 Slug"
                            className="w-full bg-brand-surface-alt border-brand-border rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all"
                        />
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                    </div>
                    <div className="text-sm text-brand-text-secondary font-semibold">
                        当前共 <span className="text-brand-text-primary">{contentList.length}</span> 篇文章
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-brand-surface-alt/50 border-b border-brand-border">
                                <th scope="col" className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">文章</th>
                                <th scope="col" className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">分类</th>
                                <th scope="col" className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">阅读时间</th>
                                <th scope="col" className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">翻译配对</th>
                                <th scope="col" className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">状态</th>
                                <th scope="col" className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-surface-alt">
                            {contentList.map((item) => {
                                const pairs = item.translationGroupId
                                    ? translationGroups[item.translationGroupId]?.filter(x => x.id !== item.id) || []
                                    : [];

                                return (
                                    <tr key={item.id} className="hover:bg-brand-surface-alt/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-brand-surface-alt flex items-center justify-center text-brand-text-muted group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-brand-text-primary group-hover:text-brand-primary transition-colors flex items-center gap-2">
                                                        <span>{item.title}</span>
                                                        <Badge variant={item.locale === 'en' ? 'outline' : 'default'} className="text-[9px] px-1 py-0 select-none">
                                                            {item.locale?.toUpperCase() || 'ZH'}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-brand-text-muted font-semibold flex items-center gap-1 mt-1 font-mono">
                                                        {item.slug}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {item.category ? (
                                                <div className="text-sm font-semibold text-brand-text-secondary">{item.category.name}</div>
                                            ) : (
                                                <div className="text-sm text-brand-text-muted">未分类</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-bold text-brand-text-secondary tracking-tight">
                                                {(item as any).readingTime || '?'} 分钟
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                {pairs.length > 0 ? (
                                                    pairs.map(p => (
                                                        <Link
                                                            key={p.id}
                                                            href={`/dashboard/admin/content/${p.id}`}
                                                            className="text-xs text-brand-secondary font-bold hover:underline flex items-center gap-1"
                                                        >
                                                            <span>{p.locale === 'en' ? '🇺🇸 英文' : '🇨🇳 中文'}</span>
                                                            <span className="text-[9px] text-brand-text-muted font-normal max-w-[120px] truncate">({p.slug})</span>
                                                        </Link>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-brand-text-muted/60 font-medium italic">未关联翻译</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge variant={item.status === 'PUBLISHED' ? 'success' : 'muted'} className="font-bold text-[10px] tracking-widest px-2.5 py-1">
                                                {item.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/blog/${item.slug}`} target="_blank">
                                                    <Button variant="ghost" size="sm" className="p-2 h-auto rounded-lg text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary/5">
                                                        <ExternalLink size={18} />
                                                    </Button>
                                                </Link>
                                                <Link href={`/dashboard/admin/content/${item.id}`}>
                                                    <Button variant="ghost" size="sm" className="p-2 h-auto rounded-lg text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary/5">
                                                        <Edit size={18} />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" size="sm" className="p-2 h-auto rounded-lg text-brand-text-muted hover:bg-brand-surface-alt">
                                                    <MoreHorizontal size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-brand-border bg-brand-surface-alt/30 flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-text-muted uppercase tracking-widest">第 1 页</span>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" disabled className="text-xs font-bold uppercase tracking-widest opacity-50 cursor-not-allowed">上一页</Button>
                        <Button variant="ghost" size="sm" disabled className="text-xs font-bold uppercase tracking-widest opacity-50 cursor-not-allowed">下一页</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
