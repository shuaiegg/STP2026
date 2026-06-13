'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    FileText,
    Edit,
    Eye,
    MoreHorizontal,
    Search,
    Trash2,
    Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertDialog } from '@/components/ui/AlertDialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteContent, updateContentMetadata } from '@/app/actions/content';
import { toast } from 'sonner';
import { ContentStatus } from '@prisma/client';

interface ContentItem {
    id: string;
    title: string;
    slug: string;
    status: ContentStatus;
    locale: string;
    translationGroupId: string | null;
    categoryId: string | null;
    updatedAt: Date;
    readingTime: number | null;
    category: {
        id: string;
        name: string;
        slug: string;
    } | null;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    locale: string;
}

interface ContentTableProps {
    contents: ContentItem[];
    categories: Category[];
}

export default function ContentTable({ contents, categories }: ContentTableProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [contentToDelete, setContentToDelete] = useState<ContentItem | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    // pendingId prevents double-triggering status/category actions
    const [pendingId, setPendingId] = useState<string | null>(null);

    // P1 fix: Reset search when locale tab changes (contents prop changes)
    useEffect(() => {
        setSearchTerm('');
    }, [contents]);

    // Bug 2 fix: Use data-attribute based click-outside instead of a single ref
    // that can only point to the last rendered menu node.
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Element;
            if (!target.closest('[data-content-menu]')) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Group contents by translationGroupId to find pairs
    const translationGroups = useMemo(() => {
        return contents.reduce((acc, item) => {
            if (item.translationGroupId) {
                if (!acc[item.translationGroupId]) {
                    acc[item.translationGroupId] = [];
                }
                acc[item.translationGroupId].push(item);
            }
            return acc;
        }, {} as Record<string, ContentItem[]>);
    }, [contents]);

    const filteredContents = useMemo(() => {
        if (!searchTerm) return contents;
        const lowSearch = searchTerm.toLowerCase();
        return contents.filter(item =>
            item.title.toLowerCase().includes(lowSearch) ||
            item.slug.toLowerCase().includes(lowSearch)
        );
    }, [contents, searchTerm]);

    const handleDelete = async () => {
        if (!contentToDelete) return;
        setIsDeleting(true);
        try {
            const res = await deleteContent(contentToDelete.id);
            if (res.success) {
                toast.success('文章已删除');
                router.refresh();
            } else {
                toast.error(`删除失败: ${res.error}`);
            }
        } catch {
            toast.error('操作失败');
        } finally {
            setIsDeleting(false);
            setContentToDelete(null);
        }
    };

    const handleStatusChange = async (id: string, status: ContentStatus) => {
        if (pendingId) return; // Prevent double-trigger
        setPendingId(id);
        setOpenMenuId(null);
        try {
            const res = await updateContentMetadata(id, { status });
            if (res.success) {
                toast.success('状态已更新');
                router.refresh();
            } else {
                toast.error(`更新失败: ${res.error}`);
            }
        } catch {
            toast.error('操作失败');
        } finally {
            setPendingId(null);
        }
    };

    const handleCategoryChange = async (id: string, categoryId: string | null) => {
        if (pendingId) return; // Prevent double-trigger
        setPendingId(id);
        setOpenMenuId(null);
        try {
            const res = await updateContentMetadata(id, { categoryId });
            if (res.success) {
                toast.success('分类已更新');
                router.refresh();
            } else {
                toast.error(`更新失败: ${res.error}`);
            }
        } catch {
            toast.error('操作失败');
        } finally {
            setPendingId(null);
        }
    };

    return (
        <>
            {/* Table Header / Search */}
            <div className="p-6 border-b border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="搜索文章、Slug..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-brand-surface-alt border-brand-border rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
                    />
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                </div>
                <div className="text-sm text-brand-text-secondary font-semibold">
                    当前共 <span className="text-brand-text-primary">{filteredContents.length}</span> 篇文章
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
                        {filteredContents.map((item) => {
                            const pairs = item.translationGroupId
                                ? translationGroups[item.translationGroupId]?.filter(x => x.id !== item.id) || []
                                : [];
                            
                            const filteredCategories = categories.filter(c => c.locale === item.locale);

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
                                            {item.readingTime || '?'} 分钟
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
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 relative">
                                            <Link href={item.locale === 'en' ? `/blog/${item.slug}` : `/zh/blog/${item.slug}`} target="_blank">
                                                <Button variant="ghost" size="sm" className="p-2 h-auto rounded-lg text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary/5">
                                                    <Eye size={18} />
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/admin/content/${item.id}`}>
                                                <Button variant="ghost" size="sm" className="p-2 h-auto rounded-lg text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary/5">
                                                    <Edit size={18} />
                                                </Button>
                                            </Link>
                                            
                                            {/* Action Menu — data-content-menu attr used for click-outside detection */}
                                            <div className="relative" data-content-menu>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className={`p-2 h-auto rounded-lg text-brand-text-muted hover:bg-brand-surface-alt ${openMenuId === item.id ? 'bg-brand-surface-alt text-brand-primary' : ''} ${pendingId === item.id ? 'opacity-50' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === item.id ? null : item.id);
                                                    }}
                                                    disabled={pendingId === item.id}
                                                >
                                                    <MoreHorizontal size={18} />
                                                </Button>

                                                {openMenuId === item.id && (
                                                    <div 
                                                        className="absolute right-0 top-full mt-2 w-48 bg-brand-surface border border-brand-border rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200"
                                                    >
                                                        <div className="px-3 py-1.5 text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">快速状态</div>
                                                        <button 
                                                            onClick={() => handleStatusChange(item.id, 'PUBLISHED')}
                                                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-surface-alt transition-colors disabled:opacity-50"
                                                        >
                                                            <span>发布 (PUBLISHED)</span>
                                                            {item.status === 'PUBLISHED' && <Check size={14} className="text-brand-success" />}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleStatusChange(item.id, 'DRAFT')}
                                                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-surface-alt transition-colors disabled:opacity-50"
                                                        >
                                                            <span>草稿 (DRAFT)</span>
                                                            {item.status === 'DRAFT' && <Check size={14} className="text-brand-success" />}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleStatusChange(item.id, 'ARCHIVED')}
                                                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-surface-alt transition-colors disabled:opacity-50"
                                                        >
                                                            <span>归档 (ARCHIVED)</span>
                                                            {item.status === 'ARCHIVED' && <Check size={14} className="text-brand-success" />}
                                                        </button>

                                                        <div className="h-px bg-brand-border my-1" />
                                                        <div className="px-3 py-1.5 text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">更改分类</div>
                                                        <div className="max-h-40 overflow-y-auto">
                                                            {filteredCategories.map(cat => (
                                                                <button 
                                                                    key={cat.id}
                                                                    onClick={() => handleCategoryChange(item.id, cat.id)}
                                                                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-surface-alt transition-colors"
                                                                >
                                                                    <span className="truncate">{cat.name}</span>
                                                                    {item.categoryId === cat.id && <Check size={14} className="text-brand-primary" />}
                                                                </button>
                                                            ))}
                                                            <button 
                                                                onClick={() => handleCategoryChange(item.id, null)}
                                                                className="w-full flex items-center justify-between px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-surface-alt transition-colors"
                                                            >
                                                                <span>未分类</span>
                                                                {!item.categoryId && <Check size={14} className="text-brand-primary" />}
                                                            </button>
                                                        </div>

                                                        <div className="h-px bg-brand-border my-1" />
                                                        <button 
                                                            onClick={() => { setOpenMenuId(null); setContentToDelete(item); }}
                                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-brand-error hover:bg-brand-error/10 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                            <span>删除文章</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Deletion Dialog */}
            <AlertDialog 
                isOpen={!!contentToDelete} 
                onCancel={() => !isDeleting && setContentToDelete(null)}
                onConfirm={handleDelete}
                title="确认删除文章？"
                description={`您正在删除 「${contentToDelete?.title}」。此操作不可逆，将同步清理关联的 SEO 元数据、预览 Token 以及追踪数据。如果文章已发布，前台路径将失效。`}
                confirmLabel={isDeleting ? "删除中..." : "确认删除"}
                isDestructive={true}
                isConfirmDisabled={isDeleting}
            />
        </>
    );
}
