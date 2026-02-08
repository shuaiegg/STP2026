"use client";

import React, { useState } from 'react';
import { 
    FileText, Calendar, Trash2, Edit3, Share2, 
    ChevronRight, CheckCircle2, Clock, AlertCircle,
    Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { deleteTrackedArticle } from '@/app/actions/delete-article';
import { toast } from 'sonner';
import Link from 'next/link';

export function ArticleList({ initialArticles }: { initialArticles: any[] }) {
    const [articles, setArticles] = useState(initialArticles);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CITED':
                return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1 font-bold text-[10px]"><CheckCircle2 size={10} /> 已引用</Badge>;
            case 'CHECKING':
                return <Badge className="bg-blue-50 text-blue-600 border-blue-100 flex items-center gap-1 font-bold text-[10px]"><Clock size={10} className="animate-spin" /> 检查中</Badge>;
            case 'NOT_CITED':
                return <Badge className="bg-orange-50 text-orange-600 border-orange-100 flex items-center gap-1 font-bold text-[10px]"><AlertCircle size={10} /> 未检测到</Badge>;
            default:
                return <Badge className="bg-slate-50 text-slate-500 border-slate-100 flex items-center gap-1 font-bold text-[10px]"><Clock size={10} /> 待检</Badge>;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("确定要删除这篇文章吗？此操作不可撤销。")) return;
        
        setIsDeleting(id);
        try {
            const res = await deleteTrackedArticle(id);
            if (res.success) {
                setArticles(articles.filter(a => a.id !== id));
                toast.success("文章已成功移除");
            }
        } catch (error) {
            toast.error("删除失败，请重试");
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-4">
            {articles.map((article) => (
                <Card key={article.id} className="p-6 border-2 border-slate-100 bg-white hover:border-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/5 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                {getStatusBadge(article.status)}
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Calendar size={12} />
                                    {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                                </div>
                            </div>
                            
                            <h2 className="text-xl font-black text-brand-text-primary group-hover:text-brand-primary transition-colors leading-tight">
                                {article.title}
                            </h2>
                            
                            <div className="flex flex-wrap gap-2">
                                {article.keywords.map((kw: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[9px] font-black uppercase tracking-wider border border-slate-100">
                                        #{kw}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center">
                            <div className="p-1 bg-slate-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 border border-slate-100">
                                <Link href={`/dashboard/library/edit/${article.id}`}>
                                    <button className="p-2 hover:bg-white hover:text-brand-primary hover:shadow-sm rounded-md transition-all text-slate-400" title="编辑文章">
                                        <Edit3 size={16} />
                                    </button>
                                </Link>
                                <button className="p-2 hover:bg-white hover:text-brand-secondary hover:shadow-sm rounded-md transition-all text-slate-400" title="分享">
                                    <Share2 size={16} />
                                </button>
                                <div className="w-px h-4 bg-slate-200 mx-1" />
                                <button 
                                    onClick={() => handleDelete(article.id)}
                                    disabled={isDeleting === article.id}
                                    className="p-2 hover:bg-white hover:text-red-500 hover:shadow-sm rounded-md transition-all text-slate-400" 
                                    title="删除"
                                >
                                    {isDeleting === article.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                </button>
                            </div>
                            
                            <Link href={`/dashboard/library/edit/${article.id}`}>
                                <Button variant="outline" className="ml-2 border-2 border-slate-100 hover:border-brand-primary hover:bg-brand-primary/5 rounded-xl group/btn h-11 w-11 p-0 flex items-center justify-center">
                                    <ChevronRight size={20} className="text-slate-300 group-hover/btn:text-brand-primary group-hover/btn:translate-x-0.5 transition-all" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
