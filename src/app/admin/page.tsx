import React from 'react';
import {
    FileText,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    TrendingUp,
    Clock
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import prisma from '@/lib/prisma';
import Link from 'next/link';

async function getStats() {
    const [totalContent, blogPosts, lastSync] = await Promise.all([
        prisma.content.count(),
        prisma.content.count({ where: { type: 'BLOG' } }),
        prisma.syncLog.findFirst({ orderBy: { startedAt: 'desc' } })
    ]);

    return { totalContent, blogPosts, lastSync };
}

export default async function AdminDashboard() {
    const stats = await getStats();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">欢迎回来！</h1>
                <p className="text-slate-500">这是您内容库的最新动态。</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 border-none shadow-sm bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <FileText size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <FileText size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-500">文章总数</div>
                            <div className="text-3xl font-bold text-slate-900">{stats.totalContent}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <TrendingUp size={14} />
                        <span>较上月增长 12%</span>
                    </div>
                </Card>

                <Card className="p-6 border-none shadow-sm bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <RefreshCw size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <RefreshCw size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-500">最近同步</div>
                            <div className="text-xl font-bold text-slate-900">
                                {stats.lastSync?.completedAt
                                    ? new Date(stats.lastSync.completedAt).toLocaleTimeString()
                                    : '尚未同步'}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <Clock size={14} />
                        <span>状态: {stats.lastSync?.status || '未知'}</span>
                    </div>
                </Card>

                <Card className="p-6 border-none shadow-sm bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-emerald-600">
                        <CheckCircle2 size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-500">系统状态</div>
                            <div className="text-xl font-bold text-slate-900 text-emerald-600">运行良好</div>
                        </div>
                    </div>
                    <div className="text-xs font-bold text-slate-400">所有服务响应正常</div>
                </Card>

                <Card className="p-6 border-none shadow-sm bg-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-amber-600">
                        <AlertCircle size={80} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-500">同步异常</div>
                            <div className="text-3xl font-bold text-slate-900">{stats.lastSync?.itemsFailed || 0}</div>
                        </div>
                    </div>
                    <div className="text-xs font-bold text-amber-600">需要关注</div>
                </Card>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-8 border-none shadow-sm bg-white">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-900">最近文章</h3>
                            <Link href="/admin/content" className="text-brand-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                                查看全部 <ArrowUpRight size={16} />
                            </Link>
                        </div>
                        <div className="space-y-4">
                            <p className="text-slate-400 italic">同步文章后，这里将显示最近的活动动态。</p>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-sm bg-white">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">快捷操作</h3>
                        <div className="flex flex-col gap-3">
                            <Link href="/admin/sync">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-brand-primary/5 hover:text-brand-primary transition-all group">
                                    <span className="font-bold text-sm">强制全量同步</span>
                                    <RefreshCw size={18} className="text-slate-300 group-hover:text-brand-primary group-hover:rotate-180 transition-all duration-500" />
                                </div>
                            </Link>
                            <Link href="/admin/content">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-brand-primary/5 hover:text-brand-primary transition-all group">
                                    <span className="font-bold text-sm">管理内容文章</span>
                                    <FileText size={18} className="text-slate-300 group-hover:text-brand-primary" />
                                </div>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
