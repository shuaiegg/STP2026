import React from 'react';
import {
    FileText,
    RefreshCw,
    Users,
    Coins,
    Zap,
    TrendingUp,
    ArrowUpRight,
    ShieldCheck,
    CreditCard,
    Settings
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function getStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
        totalContent, 
        totalUsers, 
        activeUsersCount,
        lastSync, 
        totalCreditsPurchased,
        totalExecutions,
        successExecutions
    ] = await Promise.all([
        prisma.content.count(),
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.user.count({
            where: {
                role: 'USER',
                skillExecution: {
                    some: {
                        createdAt: { gte: thirtyDaysAgo }
                    }
                }
            }
        }),
        prisma.syncLog.findFirst({ orderBy: { startedAt: 'desc' } }),
        prisma.creditTransaction.aggregate({
            _sum: { amount: true },
            where: { amount: { gt: 0 }, type: 'PURCHASE' }
        }),
        prisma.skillExecution.count(),
        prisma.skillExecution.count({ where: { status: 'success' } })
    ]);

    const activityRate = totalUsers > 0 ? (activeUsersCount / totalUsers) * 100 : 0;
    const successRate = totalExecutions > 0 ? (successExecutions / totalExecutions) * 100 : 0;

    return { 
        totalContent, 
        totalUsers, 
        activityRate,
        successRate,
        lastSync, 
        revenueCredits: totalCreditsPurchased._sum.amount || 0,
        totalExecutions
    };
}

export default async function AdminDashboard() {
    // 1. Mandatory Security Check
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || (session.user as any).role !== 'ADMIN') {
        redirect("/login");
    }

    const stats = await getStats();

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-text-primary mb-2 font-display">系统管理概览</h1>
                    <p className="text-brand-text-secondary">实时监控 STP 平台的增长指标、财务状况与工具运行效率。</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-brand-success bg-brand-success/10 px-3 py-1.5 rounded-full border border-brand-success/20">
                    <ShieldCheck size={14} />
                    <span>系统运行中 • 无异常</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue/Credits Stat */}
                <Card className="p-6 border-none shadow-sm bg-brand-surface overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-brand-accent">
                        <CreditCard size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-brand-accent-muted flex items-center justify-center text-brand-accent">
                            <Coins size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-brand-text-secondary">累计充值积分</div>
                            <div className="text-3xl font-bold text-brand-text-primary font-mono">{stats.revenueCredits}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-text-muted uppercase tracking-widest">
                        预估营收: <span className="text-brand-text-primary">${(stats.revenueCredits / 100).toFixed(2)}</span>
                    </div>
                </Card>

                {/* Users Stat */}
                <Card className="p-6 border-none shadow-sm bg-brand-surface overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-brand-info">
                        <Users size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-brand-info-muted flex items-center justify-center text-brand-info">
                            <Users size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-brand-text-secondary">注册客户数</div>
                            <div className="text-3xl font-bold text-brand-text-primary font-mono">{stats.totalUsers}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-success">
                        <TrendingUp size={14} />
                        <span>活跃度 {stats.activityRate.toFixed(1)}%</span>
                    </div>
                </Card>

                {/* Tool Usage Stat */}
                <Card className="p-6 border-none shadow-sm bg-brand-surface overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-brand-admin">
                        <Zap size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-brand-admin-muted flex items-center justify-center text-brand-admin">
                            <Zap size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-brand-text-secondary">工具调用总次数</div>
                            <div className="text-3xl font-bold text-brand-text-primary font-mono">{stats.totalExecutions}</div>
                        </div>
                    </div>
                    <div className="text-xs font-bold text-brand-text-muted uppercase tracking-widest">
                        平均成功率: <span className="text-brand-success">{stats.successRate.toFixed(1)}%</span>
                    </div>
                </Card>

                {/* Content Stat */}
                <Card className="p-6 border-none shadow-sm bg-brand-surface overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-brand-text-secondary">
                        <FileText size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-brand-surface-alt flex items-center justify-center text-brand-text-secondary">
                            <FileText size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-brand-text-secondary">库内文章总数</div>
                            <div className="text-3xl font-bold text-brand-text-primary font-mono">{stats.totalContent}</div>
                        </div>
                    </div>
                    <Link href="/dashboard/admin/sync" className="flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline">
                        <RefreshCw size={12} />
                        <span>最近同步: {stats.lastSync?.completedAt ? new Date(stats.lastSync.completedAt).toLocaleTimeString() : '暂无记录'}</span>
                    </Link>
                </Card>
            </div>

            {/* Middle Section: Recent Activity & Management */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-8 border-none shadow-sm bg-brand-surface min-h-[400px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-brand-text-primary">平台增长趋势</h3>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-brand-primary"></span>
                                <span className="text-xs text-brand-text-secondary font-medium">注册用户</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center h-64 text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-brand-surface-alt flex items-center justify-center text-brand-text-muted mb-4">
                                <TrendingUp size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-brand-text-primary mb-2">暂无增长数据</h4>
                            <p className="text-sm text-brand-text-secondary max-w-xs mb-6">
                                连接 GA4 后查看平台增长趋势。集成 Google Analytics 可以实时监控用户转化与留存。
                            </p>
                            <Link href="/dashboard/admin/settings">
                                <Button variant="outline" className="gap-2 border-brand-border hover:bg-brand-surface-alt rounded-lg">
                                    <Settings size={16} />
                                    前往设置
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-sm bg-brand-primary text-brand-text-inverted">
                        <h3 className="text-xl font-bold mb-4">快速管理</h3>
                        <div className="flex flex-col gap-3">
                            <Link href="/dashboard/admin/users">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-brand-text-inverted/10 hover:bg-brand-text-inverted/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Users size={18} />
                                        <span className="font-bold text-sm">用户与积分管理</span>
                                    </div>
                                    <ArrowUpRight size={18} className="opacity-50 group-hover:opacity-100" />
                                </div>
                            </Link>
                            <Link href="/dashboard/admin/content">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-brand-text-inverted/10 hover:bg-brand-text-inverted/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <FileText size={18} />
                                        <span className="font-bold text-sm">Notion 内容同步</span>
                                    </div>
                                    <ArrowUpRight size={18} className="opacity-50 group-hover:opacity-100" />
                                </div>
                            </Link>
                        </div>
                    </Card>

                    <Card className="p-8 border-none shadow-sm bg-brand-surface">
                        <h3 className="text-xl font-bold text-brand-text-primary mb-6">系统状态</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-brand-text-secondary">Notion API</span>
                                <span className="text-brand-success font-bold">已连接</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-brand-text-secondary">Supabase 数据库</span>
                                <span className="text-brand-success font-bold">正常</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-brand-text-secondary">DeepSeek AI 引擎</span>
                                <span className="text-brand-success font-bold">在线</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
