"use client";

import React from 'react';
import {
    Coins,
    Zap,
    History,
    CreditCard,
    LogOut,
    Library,
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    ArrowUpRight,
    Clock,
    Plus,
    FileText,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { authClient } from "@/lib/auth-client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Settings as SettingsIcon } from 'lucide-react';

export function DashboardContent({
    user,
    metrics,
    isImpersonating = false,
    articleCount = 0,
    recentArticles = []
}: {
    user: any;
    metrics: {
        totalSites: number;
        totalSemanticDebts: number;
        totalStrengths: number;
        sitesOptions: Array<{ id: string; domain: string; hasGsc: boolean; hasGa4: boolean; }>;
    };
    isImpersonating?: boolean;
    articleCount?: number;
    recentArticles?: any[];
}) {
    const router = useRouter();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CITED':
                return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1 font-bold text-[9px]"><CheckCircle2 size={10} /> 已引用</Badge>;
            case 'CHECKING':
                return <Badge className="bg-blue-50 text-blue-600 border-blue-100 flex items-center gap-1 font-bold text-[9px]"><Clock size={10} className="animate-spin" /> 检查中</Badge>;
            default:
                return <Badge className="bg-slate-50 text-slate-500 border-slate-100 flex items-center gap-1 font-bold text-[9px]"><Clock size={10} /> 待检</Badge>;
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {isImpersonating && (
                <div className="bg-amber-50 border-2 border-amber-200 p-4 flex items-center justify-between rounded-xl">
                    <div className="flex items-center gap-3 text-amber-800 font-bold text-sm">
                        <ShieldAlert size={20} />
                        代理预览模式：正在查看用户 {user?.email} 的账户
                    </div>
                    <Link href="/admin/users">
                        <Button size="sm" variant="outline" className="border-amber-200 bg-white text-amber-700 hover:bg-amber-100 flex items-center gap-2">
                            <ArrowLeft size={14} /> 返回管理后台
                        </Button>
                    </Link>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="font-display text-4xl font-black text-brand-text-primary italic leading-none mb-4">概览中心</h1>
                    <p className="text-brand-text-secondary font-medium">欢迎回来，{user?.name || '用户'}。系统一切就绪。</p>
                </div>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sites Card */}
                <Card className="p-8 border-2 border-slate-100 bg-white relative overflow-hidden group hover:border-brand-primary/20 transition-all shadow-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Coins size={80} className="text-brand-secondary" />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Zap size={12} className="text-brand-secondary" /> 数字资产图谱 (Managed Sites)
                    </div>
                    <div className="text-5xl font-black text-brand-text-primary mb-4 font-display">
                        {metrics.totalSites}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        其中 <span className="font-black">{metrics.sitesOptions.filter(s => s.hasGsc).length}</span> 个已连接数据仓库
                    </div>
                </Card>

                {/* Debts Card */}
                <div
                    onClick={() => {
                        const firstSiteId = localStorage.getItem('siteIntelligence_firstSiteId');
                        if (firstSiteId) {
                            router.push(`/dashboard/site-intelligence/${firstSiteId}`);
                        } else {
                            router.push('/dashboard/site-intelligence');
                        }
                    }}
                    className="cursor-pointer h-full"
                >
                    <Card className="p-8 border-2 border-slate-100 bg-white relative overflow-hidden group hover:border-brand-primary/20 hover:shadow-lg transition-all shadow-sm h-full">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Library size={80} className="text-rose-500" />
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <AlertCircle size={12} className="text-rose-500" /> 全局高优语义债 (Global Semantic Debts)
                        </div>
                        <div className="text-5xl font-black text-rose-600 mb-4 font-display">
                            {metrics.totalSemanticDebts}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            跨 {metrics.sitesOptions.length} 个站点累计发现 <span className="text-brand-primary font-black">{metrics.totalSemanticDebts}</span> 个高价值缺口
                            <ArrowRight size={10} className="ml-1 text-brand-primary group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                </div>

                {/* Quick Link Card */}
                <Card className="p-8 border-none bg-brand-primary text-white shadow-xl shadow-brand-primary/20 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black italic mb-2 tracking-tight">内容生产引擎</h3>
                        <p className="text-white/70 text-xs font-medium leading-relaxed">
                            调用 GEO Writer，<br />
                            将语义痛点一键转化为高质量内容资产。
                        </p>
                    </div>
                    <Link href="/dashboard/tools">
                        <Button variant="outline" className="w-full mt-6 bg-white/10 border-white/20 hover:bg-white text-white hover:text-brand-primary font-black text-xs uppercase tracking-tighter transition-all">
                            启动写作矩阵 <ArrowRight className="ml-2" size={14} />
                        </Button>
                    </Link>
                </Card>
            </div>


            <div className="space-y-10 animate-in fade-in duration-500">
                <div className="space-y-4">
                    {recentArticles.length > 0 ? (
                        recentArticles.map((article) => (
                            <Link key={article.id} href="/dashboard/library" className="block">
                                <div className="border-2 border-slate-100 p-6 bg-white rounded-2xl flex items-center justify-between group hover:border-brand-primary/30 hover:shadow-lg hover:shadow-brand-primary/5 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors shadow-inner">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors line-clamp-1">{article.title}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                {new Date(article.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    {getStatusBadge(article.status)}
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="border-4 border-dashed border-slate-100 p-16 rounded-3xl text-center bg-white/50">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4 rotate-6">
                                <FileText size={32} />
                            </div>
                            <p className="text-slate-400 font-bold text-sm italic">尚未发现创作记录</p>
                            <Link href="/dashboard/tools">
                                <Button size="sm" className="mt-6 font-black bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white border-2 border-brand-primary/20 transition-all">
                                    点亮第一盏神灯
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Account Summary & Updates */}
            <div className="space-y-6">
                <h3 className="font-display text-2xl font-black text-brand-text-primary italic flex items-center gap-3">
                    <ShieldCheck size={24} className="text-brand-primary" />
                    系统安全与状态
                </h3>

                <Card className="p-8 bg-white border-2 border-slate-100 rounded-3xl space-y-6">
                    <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 group hover:border-emerald-200 transition-all cursor-default">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <div className="text-sm font-black text-emerald-900 leading-none mb-1">账号安全等级：高</div>
                                <div className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest">已启用动态验证保护</div>
                            </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100 group hover:border-blue-200 transition-all cursor-default">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <div className="text-sm font-black text-blue-900 leading-none mb-1">GEO 引擎状态</div>
                                <div className="text-[10px] text-blue-600/70 font-bold uppercase tracking-widest">运行状态：正常 (100%)</div>
                            </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-2xl border border-purple-100 group hover:border-purple-200 transition-all cursor-default">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white">
                                <Library size={20} />
                            </div>
                            <div>
                                <div className="text-sm font-black text-purple-900 leading-none mb-1">站群与连接健康度</div>
                                <div className="text-[10px] text-purple-600/70 font-bold uppercase tracking-widest">
                                    GSC ({metrics.sitesOptions.filter(s => s.hasGsc).length}) • GA4 ({metrics.sitesOptions.filter(s => s.hasGa4).length})
                                </div>
                            </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between px-2">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Coins size={12} /> 当前剩余能量: <span className="text-brand-primary">{user?.credits?.toLocaleString() || 0} 点</span>
                        </div>
                        <Link href="/dashboard/billing" className="text-[10px] font-black text-slate-500 hover:text-brand-primary transition-colors flex items-center gap-1">
                            能量与账单 <ArrowUpRight size={10} />
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
