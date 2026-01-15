import React from 'react';
import {
    ArrowLeft,
    Save,
    RefreshCw,
    ExternalLink,
    Info
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditForm } from './EditForm';

async function getArticle(id: string) {
    const article = await prisma.content.findUnique({
        where: { id },
        include: {
            category: true,
        }
    });
    return article;
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const article = await getArticle(id);

    if (!article) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/content">
                        <Button variant="ghost" size="sm" className="p-2 h-auto rounded-xl hover:bg-slate-100">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-1">编辑文章</h1>
                        <div className="flex items-center gap-2">
                            <Badge variant={article.status === 'PUBLISHED' ? 'success' : 'muted'} className="px-2">
                                {article.status}
                            </Badge>
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
                                上次同步: {article.updatedAt.toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href={`/blog/${article.slug}`} target="_blank">
                        <Button variant="ghost" className="gap-2 font-bold text-xs uppercase tracking-widest bg-white shadow-sm border border-slate-200">
                            <ExternalLink size={16} />
                            预览文章
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <EditForm article={article as any} />
                </div>

                <div className="space-y-6">
                    <Card className="p-6 border-none shadow-sm bg-white">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Info size={16} className="text-brand-primary" />
                            Notion 集成
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notion 页面 ID</div>
                                <div className="text-xs font-mono text-slate-600 break-all">{article.notionPageId}</div>
                            </div>
                            <div className="flex items-center justify-between p-1">
                                <span className="text-xs font-bold text-slate-600">双向同步已启用</span>
                                <div className="w-8 h-4 bg-emerald-500 rounded-full relative">
                                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <p className="text-[10px] leading-relaxed text-slate-400 font-semibold">
                                在此处修改属性将自动同步至您的 Notion 数据库。注意：目前仅支持元数据双向同步，正文暂为单向。
                            </p>
                        </div>
                    </Card>

                    <Card className="p-6 border-none shadow-sm bg-white">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">文章元数据</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400 font-semibold">分类</span>
                                <span className="text-slate-900 font-bold">{article.category?.name || '未分类'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400 font-semibold">发布作者</span>
                                <span className="text-slate-900 font-bold">Administrator</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
