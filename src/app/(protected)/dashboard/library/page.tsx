import React from 'react';
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { 
    FileText, Search, Filter, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ArticleList } from './ArticleList';

export default async function ArticleLibraryPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login?callbackUrl=/dashboard/library");
    }

    // Fetch user's saved articles
    const articles = await prisma.trackedArticle.findMany({
        where: {
            userId: session.user.id,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-brand-text-primary font-display italic leading-none mb-4">内容资产库</h1>
                    <p className="text-brand-text-secondary font-medium">
                        您已成功智作并存入库中 <span className="text-brand-primary font-bold">{articles.length}</span> 篇高权重文章。
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={16} />
                        <input 
                            placeholder="搜索标题或关键词..." 
                            className="bg-white border-2 border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-brand-primary/50 transition-all w-full md:w-64 shadow-sm"
                        />
                    </div>
                    <Button variant="outline" className="border-2 border-slate-100 rounded-xl px-4 bg-white hover:bg-slate-50">
                        <Filter size={18} className="text-slate-500" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            {articles.length > 0 ? (
                <ArticleList initialArticles={articles} />
            ) : (
                <div className="py-24 text-center border-4 border-dashed border-slate-100 rounded-3xl flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-6 rotate-3">
                        <FileText size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-brand-text-muted mb-2 font-display">您的内容库目前空空如也</h3>
                    <p className="text-slate-400 max-w-sm mb-8 font-medium">
                        立即启动 StellarWriter 智作优化器，让您的第一篇高权重文章在此“安家”。
                    </p>
                    <Link href="/tools/geo-writer">
                        <Button className="font-black px-10 py-7 bg-brand-primary text-white border-2 border-black shadow-[6px_6px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                            立刻去智作 <ExternalLink className="ml-2" size={18} />
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
