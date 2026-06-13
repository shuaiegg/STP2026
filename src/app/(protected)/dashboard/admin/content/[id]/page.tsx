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
            seo: true,
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

    const otherArticles = await prisma.content.findMany({
        where: { id: { not: id } },
        select: { id: true, title: true, locale: true, slug: true, translationGroupId: true },
        orderBy: { updatedAt: 'desc' }
    });

    const [authors, categories] = await Promise.all([
        prisma.author.findMany({ orderBy: { name: 'asc' } }),
        prisma.category.findMany({ 
            where: { locale: article.locale },
            orderBy: { name: 'asc' }
        }),
    ]);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/content">
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
                                上次更新: {article.updatedAt.toLocaleDateString()}
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
                    <EditForm 
                        article={article as any} 
                        otherArticles={otherArticles as any} 
                        authors={authors as any}
                        categories={categories as any}
                    />
                </div>

                <div className="space-y-6">
                    {/* Sidebar components can go here if needed */}
                </div>
            </div>
        </div>
    );
}
