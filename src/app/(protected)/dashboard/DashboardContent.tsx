"use client";

import React, { useCallback, useMemo } from 'react';
import {
    Coins,
    Zap,
    Library,
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    ArrowUpRight,
    Plus,
    FileText,
    CheckCircle2,
    AlertCircle,
    X,
    ShieldAlert,
    ArrowLeft,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { authClient } from "@/lib/auth-client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const COPY = {
    empty: {
        title: "欢迎开启出海获客之旅",
        subtitle: "ScaletoTop 是专为 B2B 企业打造的自动化获客与内容管理系统。请先添加你的第一个站点，即可查收深度优化的策略建议。",
        ctaPrimary: "添加第一个站点",
        ctaSecondary: "免费即时审计"
    },
    checklist: {
        title: "配置指南",
        steps: [
            { id: 'site', label: '添加站点' },
            { id: 'audit', label: '运行审计' },
            { id: 'gsc', label: '连接 GSC', optional: true },
            { id: 'strategy', label: '查看战略看板' }
        ]
    }
};

export function DashboardContent({
    user,
    metrics,
    isImpersonating = false,
    articleCount = 0,
    recentArticles = [],
    auditCount = 0
}: {
    user: any;
    metrics: {
        totalSites: number;
        totalHighPriorityDebts: number;
        totalPlannedArticles: number;
        sitesOptions: Array<{ 
            id: string; 
            domain: string; 
            hasGsc: boolean; 
            hasGa4: boolean; 
            topDebt: string | null;
            minCoverage: number | null;
        }>;
    };
    isImpersonating?: boolean;
    articleCount?: number;
    recentArticles?: any[];
    auditCount?: number;
}) {
    const router = useRouter();

    const gscCount = useMemo(
        () => metrics.sitesOptions.filter(s => s.hasGsc).length,
        [metrics.sitesOptions]
    );
    const ga4Count = useMemo(
        () => metrics.sitesOptions.filter(s => s.hasGa4).length,
        [metrics.sitesOptions]
    );

    const handleNavigateToSiteIntelligence = useCallback((siteId?: string) => {
        if (siteId) {
            router.push(`/dashboard/site-intelligence/${siteId}`);
            return;
        }
        const firstSiteId = localStorage.getItem('siteIntelligence_firstSiteId');
        if (firstSiteId) {
            router.push(`/dashboard/site-intelligence/${firstSiteId}`);
        } else if (metrics.sitesOptions.length > 0) {
            router.push(`/dashboard/site-intelligence/${metrics.sitesOptions[0].id}`);
        } else {
            router.push('/dashboard/site-intelligence');
        }
    }, [router, metrics.sitesOptions]);

    const [checklistDismissed, setChecklistDismissed] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            const dismissed = localStorage.getItem('stp_checklist_dismissed');
            if (dismissed === 'true') {
                setChecklistDismissed(true);
            }
        }
    }, []);

    const isNewUser = metrics.totalSites === 0;

    const checklistAutoHidden = metrics.totalSites > 0 && auditCount > 0 && metrics.totalPlannedArticles > 0;
    const isSetupState = metrics.totalSites > 0 && !checklistDismissed;
    const showChecklist = mounted && isSetupState && !checklistAutoHidden;

    const checklistSteps = COPY.checklist.steps.map(step => {
        let isCompleted = false;
        let href = '';
        let onClick: (() => void) | undefined = undefined;
        if (step.id === 'site') {
            isCompleted = metrics.totalSites > 0;
            href = '/dashboard/site-intelligence';
        } else if (step.id === 'audit') {
            isCompleted = auditCount > 0;
            href = '/dashboard/site-intelligence';
        } else if (step.id === 'gsc') {
            isCompleted = gscCount > 0;
            href = '/dashboard/site-intelligence';
        } else if (step.id === 'strategy') {
            isCompleted = metrics.totalPlannedArticles > 0;
            onClick = () => handleNavigateToSiteIntelligence();
        }
        return { ...step, isCompleted, href, onClick };
    });
    const completedSteps = checklistSteps.filter(s => s.isCompleted).length;

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {isImpersonating && (
                <div className="bg-amber-50 border-2 border-amber-200 p-4 flex items-center justify-between rounded-xl">
                    <div className="flex items-center gap-3 text-amber-800 font-bold text-sm">
                        <ShieldAlert size={20} />
                        代理预览模式：正在查看用户 {user?.email} 的账户
                    </div>
                    <Link href="/dashboard/admin/users">
                        <Button size="sm" variant="outline" className="border-amber-200 bg-white text-amber-700 hover:bg-amber-100 flex items-center gap-2">
                            <ArrowLeft size={14} /> 返回管理后台
                        </Button>
                    </Link>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="font-display text-4xl font-black text-brand-text-primary italic leading-none mb-4">概览中心</h1>
                    <p className="text-brand-text-secondary font-medium">欢迎回来，{user?.name || '用户'}。系统已为你聚合全局情报。</p>
                </div>
            </div>

            {isNewUser ? (
                <div className="py-8">
                    <Card className="p-12 border-2 border-brand-secondary/20 bg-brand-secondary-muted rounded-lg text-center flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm text-brand-secondary">
                            <Plus size={32} />
                        </div>
                        <h2 className="font-display text-3xl font-black text-brand-text-primary mb-4">{COPY.empty.title}</h2>
                        <p className="text-brand-text-secondary max-w-lg mx-auto mb-10 leading-relaxed">
                            {COPY.empty.subtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/dashboard/site-intelligence">
                                <Button as="span" className="bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary font-bold border-none rounded-lg px-8 shadow-sm">
                                    {COPY.empty.ctaPrimary}
                                </Button>
                            </Link>
                            <Link href="/dashboard/site-intelligence/instant-audit">
                                <Button as="span" variant="outline" className="font-bold rounded-lg px-8 border-brand-secondary/30 text-brand-text-primary hover:bg-brand-secondary/10">
                                    {COPY.empty.ctaSecondary}
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            ) : (
                <>
                    {/* Checklist Banner */}
                    {showChecklist && (
                        <div className="border border-brand-secondary/20 bg-brand-secondary-muted rounded-lg p-6 relative">
                            <button 
                                onClick={() => {
                                    localStorage.setItem('stp_checklist_dismissed', 'true');
                                    setChecklistDismissed(true);
                                }}
                                className="absolute top-4 right-4 text-brand-text-muted hover:text-brand-text-primary transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="mb-4">
                                <h4 className="font-bold text-brand-text-primary text-lg flex items-center gap-2">
                                    <ShieldCheck size={20} className="text-brand-secondary" />
                                    {COPY.checklist.title}
                                </h4>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="text-sm font-medium text-brand-text-secondary">{completedSteps}/{checklistSteps.length} 完成</div>
                                    <div className="flex-1 max-w-xs h-2 bg-white rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-secondary transition-all" style={{ width: `${(completedSteps / checklistSteps.length) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                {checklistSteps.map((step) => (
                                    <div key={step.id} className="flex items-start gap-3">
                                        <div className={`shrink-0 mt-0.5 ${step.isCompleted ? 'text-brand-secondary' : 'text-slate-300'}`}>
                                            {step.isCompleted ? <CheckCircle2 size={18} /> : <div className="w-[18px] h-[18px] border-2 border-current rounded-full" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 group">
                                                {step.href ? (
                                                    <Link href={step.href} className={`text-sm font-bold hover:text-brand-secondary transition-colors ${step.isCompleted ? 'text-brand-text-secondary line-through opacity-70' : 'text-brand-text-primary'}`}>
                                                        {step.label} {step.optional && <span className="text-[10px] font-normal text-brand-text-muted ml-1 no-underline">(可选)</span>}
                                                    </Link>
                                                ) : (
                                                    <button onClick={step.onClick} className={`text-sm font-bold hover:text-brand-secondary transition-colors ${step.isCompleted ? 'text-brand-text-secondary line-through opacity-70' : 'text-brand-text-primary'}`}>
                                                        {step.label} {step.optional && <span className="text-[10px] font-normal text-brand-text-muted ml-1 no-underline">(可选)</span>}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

            {/* Core Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Assets Card */}
                <Card className="p-8 border-2 border-slate-100 bg-white relative overflow-hidden group hover:border-brand-primary/20 transition-all shadow-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Library size={80} className="text-brand-primary" />
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <FileText size={12} className="text-brand-primary" /> 全球内容资产 (Planned Assets)
                    </div>
                    <div className="text-5xl font-black text-brand-text-primary mb-4 font-display">
                        {metrics.totalPlannedArticles}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                        跨 <span className="font-black text-slate-800">{metrics.totalSites}</span> 个站点正在运作的内容节点
                    </div>
                </Card>

                {/* Debts Card */}
                <div
                    onClick={() => handleNavigateToSiteIntelligence()}
                    className="cursor-pointer h-full"
                >
                    <Card className="p-8 border-2 border-slate-100 bg-white relative overflow-hidden group hover:border-brand-primary/20 hover:shadow-lg transition-all shadow-sm h-full">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <Zap size={80} className="text-rose-500" />
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <AlertCircle size={12} className="text-rose-500" /> 高优语义债 (High Priority Debts)
                        </div>
                        <div className="text-5xl font-black text-rose-600 mb-4 font-display">
                            {metrics.totalHighPriorityDebts}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            识别到 <span className="text-rose-600 font-black">{metrics.totalHighPriorityDebts}</span> 个必须立即抢占的流量缺口
                            <ArrowRight size={10} className="ml-1 text-brand-primary group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Card>
                </div>

                {/* Quick Action Card */}
                <Card className="p-8 border-none bg-brand-primary text-white shadow-xl shadow-brand-primary/20 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black italic mb-2 tracking-tight">智能战略自愈</h3>
                        <p className="text-white/70 text-xs font-medium leading-relaxed">
                            系统检测到流量异常下跌，<br />
                            自动标记需重构的内容节点。
                        </p>
                    </div>
                    <Button 
                        onClick={() => handleNavigateToSiteIntelligence()}
                        variant="outline" 
                        className="w-full mt-6 bg-white/10 border-white/20 hover:bg-white text-white hover:text-brand-primary font-black text-xs uppercase tracking-tighter transition-all"
                    >
                        进入战略枢纽 <ArrowRight className="ml-2" size={14} />
                    </Button>
                </Card>
            </div>


            <div className="space-y-6">
                <h3 className="font-display text-2xl font-black text-brand-text-primary italic flex items-center gap-3">
                    <TrendingUp size={24} className="text-brand-primary" />
                    各站点战略情报 (Site Insights)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {metrics.sitesOptions.map((site) => (
                        <Card 
                            key={site.id} 
                            onClick={() => handleNavigateToSiteIntelligence(site.id)}
                            className="p-6 border-2 border-slate-100 bg-white hover:border-brand-primary/30 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-black text-slate-800 tracking-tight truncate max-w-[180px]">
                                    {site.domain}
                                </h4>
                                <div className="flex gap-1">
                                    {site.hasGsc && <Badge className="bg-blue-50 text-blue-600 border-none text-[9px]">GSC</Badge>}
                                    {site.hasGa4 && <Badge className="bg-orange-50 text-orange-600 border-none text-[9px]">GA4</Badge>}
                                </div>
                            </div>
                            
                            {site.topDebt ? (
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">急需补齐的话题 (Lowest Coverage)</div>
                                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                        <div className="text-sm font-bold text-rose-900 line-clamp-1">{site.topDebt}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex-1 bg-rose-200 h-1 rounded-full overflow-hidden">
                                                <div className="bg-rose-500 h-full" style={{ width: `${site.minCoverage}%` }} />
                                            </div>
                                            <span className="text-[10px] font-mono font-bold text-rose-600">{site.minCoverage}%</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 text-center text-slate-400 text-xs italic font-medium">
                                    尚未进行语义分析
                                </div>
                            )}
                            
                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-black text-brand-primary uppercase">查看星图 &rarr;</span>
                            </div>
                        </Card>
                    ))}
                    
                    <Link href="/dashboard/site-intelligence">
                        <Card className="h-full border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-brand-primary/30 transition-all flex flex-col items-center justify-center p-6 text-center space-y-2">
                            <Plus className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-500">添加新站点</span>
                        </Card>
                    </Link>
                </div>
            </div>
            </>
            )}

            {/* Account Summary & Updates */}
            <div className="space-y-6">
                <h3 className="font-display text-2xl font-black text-brand-text-primary italic flex items-center gap-3">
                    <ShieldCheck size={24} className="text-brand-primary" />
                    系统安全与状态
                </h3>
...

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
                                    GSC ({gscCount}) • GA4 ({ga4Count})
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
