import React from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function NewArticlePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || (session.user as any).role !== 'ADMIN') {
        redirect('/login');
    }

    async function createDraft(formData: FormData) {
        'use server';
        
        const title = formData.get('title') as string;
        const locale = formData.get('locale') as string;

        if (!title) return;

        // Generate a basic slug
        const baseSlug = title.toLowerCase().trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '') || 'untitled';
            
        const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

        const article = await prisma.content.create({
            data: {
                title,
                slug,
                locale,
                contentMd: '',
                status: 'DRAFT',
                visibility: 'PRIVATE',
                source: 'MANUAL',
            }
        });

        redirect(`/dashboard/admin/content/${article.id}`);
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-12">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/admin/content">
                    <Button variant="ghost" size="sm" className="p-2 h-auto rounded-xl hover:bg-slate-100">
                        <ArrowLeft size={20} />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">新建文章</h1>
            </div>

            <Card className="p-8 border-none shadow-sm bg-white">
                <form action={createDraft} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">文章标题</label>
                        <input
                            name="title"
                            type="text"
                            className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 transition-all"
                            placeholder="输入文章标题..."
                            required
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">文章语言 (Locale)</label>
                        <select
                            name="locale"
                            className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 transition-all"
                            defaultValue="zh"
                        >
                            <option value="zh">🇨🇳 中文 (ZH)</option>
                            <option value="en">🇺🇸 English (EN)</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full gap-2 font-bold py-4 rounded-xl shadow-lg shadow-brand-primary/20"
                        >
                            <Plus size={18} />
                            开始编写
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
