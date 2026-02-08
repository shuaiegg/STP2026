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
import { ShieldAlert, ArrowLeft, Settings } from 'lucide-react';

export function DashboardContent({ 
    user, 
    transactions, 
    executions,
    isImpersonating = false,
    articleCount = 0,
    recentArticles = []
}: { 
    user: any; 
    transactions: any[]; 
    executions: any[]; 
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
                    <p className="text-brand-text-secondary font-medium">欢迎回来，{user?.name || '杰克'}。系统一切就绪。</p>
                </div>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Credits Card */}
                <Card className="p-8 border-2 border-slate-100 bg-white relative overflow-hidden group hover:border-brand-primary/20 transition-all shadow-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Coins size={80} className="text-brand-secondary" />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Zap size={12} className="text-brand-secondary" /> 能量储备 (Credits)
                    </div>
                    <div className="text-5xl font-black text-brand-text-primary mb-4 font-display">
                        {user?.credits?.toLocaleString() || 0}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        足够执行约 <span className="font-black">{(user?.credits || 0) / 35 | 0}</span> 次深度智作优化
                    </div>
                </Card>

                {/* Article Card */}
                <Card className="p-8 border-2 border-slate-100 bg-white relative overflow-hidden group hover:border-brand-primary/20 transition-all shadow-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Library size={80} className="text-brand-primary" />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Library size={12} className="text-brand-primary" /> 已存资产 (Assets)
                    </div>
                    <div className="text-5xl font-black text-brand-text-primary mb-4 font-display">
                        {articleCount}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">
                        本周新增 <span className="text-brand-primary font-black">+1</span> 篇
                    </div>
                </Card>

                {/* Quick Link Card */}
                <Card className="p-8 border-none bg-brand-primary text-white shadow-xl shadow-brand-primary/20 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black italic mb-2 tracking-tight">快速工具箱</h3>
                        <p className="text-white/70 text-xs font-medium leading-relaxed">
                            访问专业营销工具箱，<br />
                            获取全网竞争数据并执行内容 GEO 增益。
                        </p>
                    </div>
                    <Link href="/dashboard/tools">
                        <Button variant="outline" className="w-full mt-6 bg-white/10 border-white/20 hover:bg-white text-white hover:text-brand-primary font-black text-xs uppercase tracking-tighter transition-all">
                            立即访问 <ArrowRight className="ml-2" size={14} />
                        </Button>
                    </Link>
                </Card>
            </div>

            {/* Bottom Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Recent Articles Stream */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display text-2xl font-black text-brand-text-primary italic flex items-center gap-3">
                            <History size={24} className="text-brand-secondary" />
                            最近智作轨迹
                        </h3>
                        <Link href="/dashboard/library" className="text-xs font-black text-brand-primary hover:underline uppercase tracking-tighter">
                            查看内容库
                        </Link>
                    </div>

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
                                    <div className="text-sm font-black text-emerald-900 leading-none mb-1">身份加固已激活</div>
                                    <div className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest">Better Auth Standard</div>
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
                                    <div className="text-sm font-black text-blue-900 leading-none mb-1">GEO 引擎稳定性</div>
                                    <div className="text-[10px] text-blue-600/70 font-bold uppercase tracking-widest">Status: Operational (100%)</div>
                                </div>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between px-2">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                下次流量审计预计: <span className="text-brand-primary">明天 09:00</span>
                            </div>
                            <Link href="/dashboard/settings" className="text-[10px] font-black text-slate-500 hover:text-brand-primary transition-colors flex items-center gap-1">
                                安全设置 <ArrowUpRight size={10} />
                            </Link>
                        </div>
                    </Card>

                    <Card className="p-8 bg-gradient-to-br from-slate-900 to-black text-white rounded-3xl relative overflow-hidden">
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-primary/20 rounded-full blur-[60px]" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-brand-secondary mb-3">阿拉丁的备忘录</h4>
                        <p className="text-sm font-medium leading-relaxed text-slate-300">
                            “杰克，周一开盘前我会为你扫描工程机械板块的雷达信号。同时，目前的 STP 已经非常稳健了，可以尝试大规模录入内容了！”
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
