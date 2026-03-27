import React from 'react';
import {
    FileText,
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

export default async function ContentManagement() {
    const contentList = await getContent();

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-text-primary mb-2">内容管理</h1>
                    <p className="text-brand-text-secondary">管理从 Notion 同步的文章和页面。</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" className="gap-2 font-bold text-xs uppercase tracking-widest bg-brand-surface shadow-sm border border-brand-border">
                        <Filter size={16} />
                        筛选
                    </Button>
                    <Link href="/dashboard/admin/sync">
                        <Button variant="gradient" className="gap-2 font-bold text-xs uppercase tracking-widest">
                            <RefreshCw size={16} />
                            同步 Notion
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-brand-surface overflow-hidden">
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
                                <th scope="col" className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">状态</th>
                                <th scope="col" className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-surface-alt">
                            {contentList.map((item) => (
                                <tr key={item.id} className="hover:bg-brand-surface-alt/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-brand-surface-alt flex items-center justify-center text-brand-text-muted group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-brand-text-primary group-hover:text-brand-primary transition-colors line-clamp-1">{item.title}</div>
                                                <div className="text-xs text-brand-text-muted font-semibold flex items-center gap-1">
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
                            ))}
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
