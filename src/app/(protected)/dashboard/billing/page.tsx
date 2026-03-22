import React, { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { Wallet, History } from 'lucide-react';
import { BillingClient } from './BillingClient';
import { Card } from '@/components/ui/Card';
import { redirect } from 'next/navigation';

export default async function BillingPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session || !session.user) {
        redirect('/login');
    }

    // Fetch user credits and transactions
    const [user, transactions] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { credits: true },
        }),
        prisma.creditTransaction.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 10,
        }),
    ]);

    const getTransactionTypeLabel = (type: string) => {
        switch (type) {
            case 'PURCHASE': return { label: '购买', color: 'text-emerald-600 bg-emerald-50' };
            case 'CONSUMPTION': return { label: '使用', color: 'text-blue-600 bg-blue-50' };
            case 'BONUS': return { label: '赠送', color: 'text-purple-600 bg-purple-50' };
            case 'REFUND': return { label: '退款', color: 'text-amber-600 bg-amber-50' };
            default: return { label: type, color: 'text-slate-600 bg-slate-50' };
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-10">
            {/* Header & Balance */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 font-display italic mb-2 tracking-tight italic">积分与订阅</h1>
                    <p className="text-slate-500 text-sm font-medium">购买积分以解锁更多 AI 驱动的 SEO 深度分析工具</p>
                </div>
                
                <Card className="bg-slate-900 text-white p-6 min-w-[240px] flex items-center gap-4 shadow-xl border-0">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-brand-primary">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">当前余额</div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black">{user?.credits ?? 0}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight font-mono">Credits</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Product Grid */}
            <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-64 animate-pulse" />}>
                <BillingClient />
            </Suspense>

            {/* Transaction History */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <History size={18} className="text-slate-400" />
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">最近 10 条消费记录</h2>
                </div>

                <Card className="overflow-hidden border-slate-200">
                    {transactions.length > 0 ? (
                        <div className="divide-y divide-slate-100 font-sans">
                            {transactions.map((tx) => {
                                const type = getTransactionTypeLabel(tx.type);
                                return (
                                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${type.color}`}>
                                                {type.label}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900 tracking-tight">{tx.description}</div>
                                                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">
                                                    {new Date(tx.createdAt).toLocaleString('zh-CN', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-black font-mono ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            <p className="text-xs font-bold uppercase tracking-widest">暂无消费记录</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
