import React from 'react';
import {
    Plus,
    Filter
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import ContentTable from './ContentTable';
import { Content, Category } from '@prisma/client';

async function getContent(): Promise<(Content & { category: Category | null })[]> {
    return await prisma.content.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            category: true,
        }
    });
}

async function getCategories(): Promise<Category[]> {
    return await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
    });
}

interface PageProps {
    searchParams: Promise<{ locale?: string }>;
}

export default async function ContentManagement({ searchParams }: PageProps) {
    const { locale = 'all' } = await searchParams;
    const [allContents, allCategories] = await Promise.all([
        getContent(),
        getCategories()
    ]);

    // Filter contentList by selected locale for the initial server render
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
                    <Button variant="ghost" disabled title="高级筛选功能规划中" className="gap-2 font-bold text-xs uppercase tracking-widest bg-brand-surface shadow-sm border border-brand-border opacity-50 cursor-not-allowed">
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

                <ContentTable contents={contentList} categories={allCategories} />

                {/* Footer - Note: No real pagination this phase */}
                <div className="p-6 border-t border-brand-border bg-brand-surface-alt/30 flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-text-muted uppercase tracking-widest">
                        全量加载 (无分页)
                    </span>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" disabled className="text-xs font-bold uppercase tracking-widest opacity-50 cursor-not-allowed italic">本期暂不支持分页</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
