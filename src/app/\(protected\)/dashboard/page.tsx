import React from 'react';
import { 
    Coins, 
    Zap, 
    History, 
    CreditCard, 
    ArrowUpRight, 
    LayoutDashboard,
    Settings,
    LogOut
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

async function getUserData(userId: string) {
    const [user, transactions, executions] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true, name: true, email: true }
        }),
        prisma.creditTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5
        }),
        prisma.skillExecution.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5
        })
    ]);

    return { user, transactions, executions };
}

export default async function UserDashboard() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/login');
    }

    const { user, transactions, executions } = await getUserData(session.user.id);

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="font-display text-4xl font-black text-brand-text-primary mb-2">
                        你好, {user?.name || '用户'}!
                    </h1>
                    <p className="text-brand-text-secondary">欢迎回到 ScaletoTop 数字化作战室。</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/tools">
                        <Button variant="outline" className="border-2 border-brand-border-heavy">
                            去使用工具
                        </Button>
                    </Link>
                    <Link href="/pricing">
                        <Button className="bg-brand-secondary text-brand-text-primary border-2 border-brand-border-heavy font-bold shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                            充值积分
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <Card className="p-8 border-2 border-brand-border-heavy bg-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Coins size={80} />
                    </div>
                    <div className="font-mono text-xs text-brand-secondary font-bold mb-4 uppercase tracking-widest">
                        可用积分余额
                    </div>
                    <div className="text-5xl font-black text-brand-text-primary mb-4">
                        {user?.credits || 0}
                    </div>
                    <div className="text-sm text-brand-text-muted">
                        足够运行约 <span className="font-bold text-brand-text-primary">{(user?.credits || 0) / 10}</span> 次 SEO 优化
                    </div>
                </Card>

                <Card className="p-8 border-2 border-brand-border-heavy bg-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Zap size={80} />
                    </div>
                    <div className="font-mono text-xs text-brand-secondary font-bold mb-4 uppercase tracking-widest">
                        已完成工具调用
                    </div>
                    <div className="text-5xl font-black text-brand-text-primary mb-4">
                        {executions.length > 0 ? '5+' : '0'}
                    </div>
                    <div className="text-sm text-brand-text-muted">
                        本月已为你节省约 <span className="font-bold text-brand-text-primary">2.5</span> 小时人工
                    </div>
                </Card>

                <Card className="p-8 border-2 border-brand-border-heavy bg-brand-primary/5 relative overflow-hidden group">
                    <div className="font-mono text-xs text-brand-primary font-bold mb-4 uppercase tracking-widest">
                        会员等级
                    </div>
                    <div className="text-4xl font-black text-brand-text-primary mb-4">
                        Free Plan
                    </div>
                    <div className="text-sm text-brand-text-muted mb-6">
                        升级 Pro 获取更低积分消耗率
                    </div>
                    <Button variant="outline" size="sm" className="w-full border-2 border-brand-border-heavy text-xs font-bold uppercase tracking-tighter">
                        查看升级计划
                    </Button>
                </Card>
            </div>

            {/* Activity Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Recent Executions */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-display text-2xl font-bold text-brand-text-primary flex items-center gap-3">
                            <History size={24} className="text-brand-secondary" />
                            最近工具使用
                        </h3>
                        <Link href="/dashboard/history" className="text-sm font-bold text-brand-text-muted hover:text-brand-primary transition-colors">
                            查看全部
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {executions.length > 0 ? (
                            executions.map((exe) => (
                                <div key={exe.id} className="border-2 border-brand-border p-5 bg-white flex items-center justify-between group hover:border-brand-border-heavy transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-brand-surface border border-brand-border flex items-center justify-center">
                                            <Zap size={20} className="text-brand-primary" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-brand-text-primary">{exe.skillName}</div>
                                            <div className="text-xs text-brand-text-muted font-mono">
                                                {new Date(exe.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                        {exe.status}
                                    </Badge>
                                </div>
                            ))
                        ) : (
                            <div className="border-2 border-dashed border-brand-border p-12 text-center bg-brand-surface">
                                <p className="text-brand-text-muted italic">暂无工具使用记录</p>
                                <Link href="/tools" className="inline-block mt-4 text-brand-primary font-bold underline">
                                    去试试第一个工具
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-display text-2xl font-bold text-brand-text-primary flex items-center gap-3">
                            <CreditCard size={24} className="text-brand-secondary" />
                            积分收支明细
                        </h3>
                        <Link href="/dashboard/billing" className="text-sm font-bold text-brand-text-muted hover:text-brand-primary transition-colors">
                            查看账单
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <div key={tx.id} className="border-2 border-brand-border p-5 bg-white flex items-center justify-between group hover:border-brand-border-heavy transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 border border-brand-border flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                            <Coins size={20} className={tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-brand-text-primary">{tx.description || tx.type}</div>
                                            <div className="text-xs text-brand-text-muted font-mono">
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-mono font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-brand-text-primary'}`}>
                                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="border-2 border-dashed border-brand-border p-12 text-center bg-brand-surface">
                                <p className="text-brand-text-muted italic">暂无交易记录</p>
                                <Link href="/pricing" className="inline-block mt-4 text-brand-primary font-bold underline">
                                    充值获取积分
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
