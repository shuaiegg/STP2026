'use client';

import React from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { updateContentMetadata } from '@/app/actions/content';

export function EditForm({ article }: { article: any }) {
    const router = useRouter();
    const [isPending, setIsPending] = React.useState(false);
    const [formData, setFormData] = React.useState({
        title: article.title || '',
        slug: article.slug || '',
        summary: article.summary || '',
        contentMd: article.contentMd || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        try {
            const result = await updateContentMetadata(article.id, formData);
            if (result.success) {
                router.refresh();
                alert('保存成功，已同步至 Notion');
            } else {
                alert('更新失败: ' + result.error);
            }
        } catch (error) {
            alert('发生意外错误');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Card className="p-8 border-none shadow-sm bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">文章标题</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 transition-all"
                        placeholder="输入文章标题..."
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">URL Slug</label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">/blog/</span>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 pl-[3.8rem] pr-4 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 transition-all font-mono"
                            placeholder="my-cool-article"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">文章摘要 / SEO 描述</label>
                    <textarea
                        rows={3}
                        value={formData.summary}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                        className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 transition-all min-h-[80px]"
                        placeholder="输入文章摘要..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">文章正文 (Markdown)</label>
                    <textarea
                        rows={15}
                        value={formData.contentMd}
                        onChange={(e) => setFormData({ ...formData, contentMd: e.target.value })}
                        className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 transition-all font-mono text-sm min-h-[400px]"
                        placeholder="在些输入 Markdown 正文..."
                    />
                </div>

                <div className="pt-4 flex items-center gap-4">
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 gap-2 font-bold py-4 rounded-xl shadow-lg shadow-brand-primary/20"
                    >
                        {isPending ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                        {isPending ? '正在同步至 Notion...' : '保存并反向同步'}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        className="px-8 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                    >
                        返回
                    </Button>
                </div>
            </form>
        </Card>
    );
}
