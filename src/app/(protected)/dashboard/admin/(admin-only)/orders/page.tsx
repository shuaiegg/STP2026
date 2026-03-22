"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
    Search, 
    ShoppingBag, 
    ExternalLink, 
    Copy, 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    ChevronLeft, 
    ChevronRight,
    User as UserIcon,
    History
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
    id: string;
    userId: string;
    userEmail: string;
    userName: string | null;
    amount: number;
    createdAt: string;
    externalId: string | null;
    description: string | null;
    isRefunded: boolean;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function OrdersPage() {
    const [email, setEmail] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);

    const fetchOrders = useCallback(async (p: number, searchEmail?: string) => {
        setLoading(true);
        try {
            const url = new URL('/api/admin/orders', window.location.origin);
            url.searchParams.set('page', p.toString());
            if (searchEmail) url.searchParams.set('email', searchEmail);
            
            const res = await fetch(url.toString());
            const data = await res.json();
            
            if (data.orders) {
                setOrders(data.orders);
                setPagination(data.pagination);
            } else {
                toast.error(data.error || 'Failed to fetch orders');
            }
        } catch (e) {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders(page, email);
    }, [page, fetchOrders]);

    const handleSearch = () => {
        setPage(1);
        fetchOrders(1, email);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('ID copied to clipboard');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 italic mb-2">订单与充值管理</h1>
                    <p className="text-slate-500 text-sm font-medium">管理员专用：查看用户购买记录，获取 Creem Checkout ID 以便在 Creem Dashboard 发起退款。</p>
                </div>
            </div>

            {/* Search Card */}
            <Card className="p-6 border-2 border-slate-100 bg-white shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="输入用户邮箱进行过滤 (可选)..."
                            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all font-medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button 
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-10 font-bold h-[52px]"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : " 搜索订单"}
                    </Button>
                </div>
            </Card>

            {/* Orders Table Card */}
            <Card className="border-2 border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b-2 border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">用户信息</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">积分数</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creem Checkout ID</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">下单时间</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">状态</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="animate-spin text-brand-primary" size={40} />
                                            <p className="text-slate-400 font-bold italic">正在加载订单记录...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-300">
                                            <ShoppingBag size={64} strokeWidth={1} />
                                            <p className="text-slate-400 font-bold italic">暂无相关订单记录</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <UserIcon size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-900">{order.userEmail}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">{order.userName || 'Unknown'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-slate-900">+{order.amount}</span>
                                                <span className="text-[10px] font-black text-slate-400">CREDITS</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {order.externalId ? (
                                                <div className="flex items-center gap-2 group">
                                                    <code className="text-[11px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold tracking-tight">
                                                        {order.externalId}
                                                    </code>
                                                    <button 
                                                        onClick={() => copyToClipboard(order.externalId!)}
                                                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                                                        title="复制 Checkout ID"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <History size={14} />
                                                    <span className="text-[10px] font-bold italic">历史订单 (无 ID)</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-[11px] font-bold text-slate-600">
                                                {new Date(order.createdAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {order.isRefunded ? (
                                                <Badge className="bg-rose-50 text-rose-600 border-rose-100 flex items-center gap-1 w-fit">
                                                    <XCircle size={10} />
                                                    已退款
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1 w-fit">
                                                    <CheckCircle2 size={10} />
                                                    正常
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="h-8 px-4 rounded-lg border-2"
                            >
                                <ChevronLeft size={14} className="mr-1" /> Prev
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                disabled={page === pagination.totalPages}
                                onClick={() => setPage(page + 1)}
                                className="h-8 px-4 rounded-lg border-2"
                            >
                                Next <ChevronRight size={14} className="ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            <div className="p-6 bg-amber-50 rounded-3xl border-2 border-amber-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <ExternalLink size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-black text-amber-900 italic mb-1 uppercase tracking-tight">如何发起退款？</h4>
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        由于安全策略限制，退款必须由管理员登录 <a href="https://creem.io" target="_blank" rel="noreferrer" className="underline font-bold decoration-2 underline-offset-2">Creem Dashboard</a> 手动发起。
                        复制对应的 <span className="font-bold">Checkout ID</span> 到 Creem 的搜索框中定位订单，执行退款操作。
                        Creem 处理成功后会发送 webhook 通知本系统，用户的积分将会在 1 分钟内被自动扣回。
                    </p>
                </div>
            </div>
        </div>
    );
}
