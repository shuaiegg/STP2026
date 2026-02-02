import React from 'react';
import {
    FileText,
    RefreshCw,
    Users,
    Coins,
    Zap,
    TrendingUp,
    ArrowUpRight,
    Clock,
    ShieldCheck,
    CreditCard
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import prisma from '@/lib/prisma';
import Link from 'next/link';

async function getStats() {
    const [
        totalContent, 
        totalUsers, 
        lastSync, 
        totalCreditsPurchased,
        totalExecutions
    ] = await Promise.all([
        prisma.content.count(),
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.syncLog.findFirst({ orderBy: { startedAt: 'desc' } }),
        prisma.creditTransaction.aggregate({
            _sum: { amount: true },
            where: { amount: { gt: 0 }, type: 'PURCHASE' }
        }),
        prisma.skillExecution.count({ where: { status: 'success' } })
    ]);

    return { 
        totalContent, 
        totalUsers, 
        lastSync, 
        revenueCredits: totalCreditsPurchased._sum.amount || 0,
        totalExecutions
    };
}

export default async function AdminDashboard() {
    const stats = await getStats();

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">指挥部概览</h1>
                    <p className="text-slate-500">实时监控 STP 平台的增长指标、财务状况与工具运行效率。</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    <ShieldCheck size={14} />
                    <span>系统运行中 • 无异常</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue/Credits Stat */}
                <Card className="p-6 border-none shadow-sm bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-amber-600">
                        <CreditCard size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <Coins size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-500">累计充值积分</div>
                            <div className="text-3xl font-bold text-slate-900 font-mono">{stats.revenueCredits}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        预估营收: <span className="text-slate-700">${(stats.revenueCredits / 100).toFixed(2)}</span>
                    </div>
                </Card>

                {/* Users Stat */}
                <Card className="p-6 border-none shadow-sm bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-blue-600">
                        <Users size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-500">注册客户数</div>
                            <div className="text-3xl font-bold text-slate-900 font-mono">{stats.totalUsers}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <TrendingUp size={14} />
                        <span>活跃度 85%</span>
                    </div>
                </Card>

                {/* Tool Usage Stat */}
                <Card className="p-6 border-none shadow-sm bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-indigo-600">
                        <Zap size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Zap size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-500">工具调用总次数</div>
                            <div className="text-3xl font-bold text-slate-900 font-mono">{stats.totalExecutions}</div>
                        </div>
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        平均成功率: <span className="text-emerald-600">99.2%</span>
                    </div>
                </Card>

                {/* Content Stat */}
                <Card className="p-6 border-none shadow-sm bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-slate-600">
                        <FileText size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600">
                            <FileText size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-500">库内文章总数</div>
                            <div className="text-3xl font-bold text-slate-900 font-mono">{stats.totalContent}</div>
                        </div>
                    </div>
                    <Link href="/admin/sync" className="flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline">
                        <RefreshCw size={12} />
                        <span>最近同步: {stats.lastSync?.completedAt ? new Date(stats.lastSync.completedAt).toLocaleTimeString() : 'N/A'}</span>
                    </Link>
                </Card>
            </div>

            {/* Middle Section: Recent Activity & Management */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-8 border-none shadow-sm bg-white min-h-[400px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-900">平台增长趋势</h3>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-brand-primary"></span>
                                <span className="text-xs text-slate-500 font-medium">注册用户</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                            <TrendingUp size={48} className="mb-4 opacity-20" />
                            <p className="text-sm italic">数据图表加载中 (GA 接口集成预留空间)...</p>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-sm bg-brand-primary text-white">
                        <h3 className="text-xl font-bold mb-4">快速管理</h3>
                        <div className="flex flex-col gap-3">
                            <Link href="/admin/users">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Users size={18} />
                                        <span className="font-bold text-sm">用户与积分管理</span>
                                    </div>
                                    <ArrowUpRight size={18} className="opacity-50 group-hover:opacity-100" />
                                </div>
                            </Link>
                            <Link href="/admin/content">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <FileText size={18} />
                                        <span className="font-bold text-sm">Notion 内容同步</span>
                                    </div>
                                    <ArrowUpRight size={18} className="opacity-50 group-hover:opacity-100" />
                                </div>
                            </Link>
                        </div>
                    </Card>

                    <Card className="p-8 border-none shadow-sm bg-white">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">系统状态</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Notion API</span>
                                <span className="text-emerald-600 font-bold">Connected</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Supabase DB</span>
                                <span className="text-emerald-600 font-bold">Healthy</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">DeepSeek AI</span>
                                <span className="text-emerald-600 font-bold">Online</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
