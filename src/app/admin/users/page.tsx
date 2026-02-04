"use client";

import React, { useState, useEffect } from 'react';
import { 
    Search, 
    User as UserIcon, 
    Coins, 
    MoreVertical, 
    ExternalLink, 
    Shield, 
    Plus, 
    Minus,
    Loader2,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Undo2,
    History as HistoryIcon
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { getUsers, updateUserCredits, getUserTransactions, revertTransaction } from '@/app/actions/user';
import { authClient } from '@/lib/auth-client';

export default function UserManagementPage() {
    const { data: session } = authClient.useSession();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [total, setTotal] = useState(0);
    
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [creditAmount, setCreditAmount] = useState(100);

    const [selectedUserForHistory, setSelectedUserForHistory] = useState<string | null>(null);
    const [userTransactions, setUserTransactions] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [isReverting, setIsReverting] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers({ query: search });
            setUsers(data.users);
            setTotal(data.total);
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserHistory = async (userId: string) => {
        setLoadingHistory(true);
        try {
            const data = await getUserTransactions(userId);
            setUserTransactions(data);
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleUpdateCredits = async (userId: string, amount: number) => {
        setIsUpdating(userId);
        try {
            const reason = amount >= 0 ? "管理员手动增加积分" : "管理员手动扣除积分";
            const res = await updateUserCredits(userId, amount, reason);
            if (res.success) {
                // Optimistic UI update or just refetch
                await fetchUsers();
                if (selectedUserForHistory === userId) {
                    fetchUserHistory(userId);
                }
            } else {
                alert(res.message);
            }
        } finally {
            setIsUpdating(null);
        }
    };

    const handleRevert = async (txId: string, userId: string) => {
        if (!confirm("确定要撤销这条记录吗？这将恢复积分余额并从用户账单中完全移除此项。")) return;
        
        setIsReverting(txId);
        try {
            const res = await revertTransaction(txId);
            if (res.success) {
                await fetchUsers();
                if (selectedUserForHistory === userId) {
                    fetchUserHistory(userId);
                }
            } else {
                alert(res.message);
            }
        } finally {
            setIsReverting(null);
        }
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">用户管理</h1>
                    <p className="text-slate-500">查看、搜索、以及管理平台注册用户的积分与权限。</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="搜索用户名或邮箱..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white border-slate-200 rounded-xl py-3 pl-12 pr-6 text-sm focus:ring-2 focus:ring-brand-primary/10 border w-full md:w-80 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">用户信息</th>
                                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">角色</th>
                                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">积分余额</th>
                                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">活跃度</th>
                                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-400">
                                            <Loader2 className="animate-spin" size={32} />
                                            <span className="text-sm font-medium">正在加载用户数据...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <React.Fragment key={user.id}>
                                        <tr className={`hover:bg-slate-50/30 transition-colors group ${selectedUserForHistory === user.id ? 'bg-brand-primary/[0.02]' : ''}`}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/5 flex items-center justify-center text-brand-primary border-2 border-white shadow-sm">
                                                        {user.image ? (
                                                            <img src={user.image} alt="" className="w-full h-full object-cover rounded-2xl" />
                                                        ) : (
                                                            <UserIcon size={24} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{user.name || '未命名'}</div>
                                                        <div className="text-xs text-slate-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge variant="outline" className={`font-mono text-[10px] uppercase border-2 ${
                                                    user.role === 'ADMIN' ? 'text-purple-600 bg-purple-50 border-purple-100' : 'text-slate-500 bg-slate-50 border-slate-100'
                                                }`}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                                            <Coins size={16} />
                                                        </div>
                                                        <span className="font-mono font-bold text-slate-700">{user.credits}</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            if (selectedUserForHistory === user.id) {
                                                                setSelectedUserForHistory(null);
                                                            } else {
                                                                setSelectedUserForHistory(user.id);
                                                                fetchUserHistory(user.id);
                                                            }
                                                        }}
                                                        className={`p-1.5 rounded-lg transition-all ${selectedUserForHistory === user.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                                        title="查看记录并撤销"
                                                    >
                                                        <HistoryIcon size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-slate-500 text-xs">
                                                <div className="flex flex-col gap-1">
                                                    <span>文章使用: <strong>{user._count.executions}</strong></span>
                                                    <span>最近活动: {new Date(user.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                                        <input 
                                                            type="number" 
                                                            value={creditAmount}
                                                            onChange={(e) => setCreditAmount(parseInt(e.target.value))}
                                                            className="w-16 bg-transparent border-none text-xs font-bold text-center focus:ring-0"
                                                        />
                                                        <button 
                                                            onClick={() => handleUpdateCredits(user.id, creditAmount)}
                                                            disabled={isUpdating === user.id}
                                                            className="p-1.5 hover:bg-emerald-500 hover:text-white rounded-md transition-all text-emerald-600"
                                                            title="增加积分"
                                                        >
                                                            {isUpdating === user.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateCredits(user.id, -creditAmount)}
                                                            disabled={isUpdating === user.id}
                                                            className="p-1.5 hover:bg-red-500 hover:text-white rounded-md transition-all text-red-600"
                                                            title="扣除积分"
                                                        >
                                                            {isUpdating === user.id ? <Loader2 size={14} className="animate-spin" /> : <Minus size={14} />}
                                                        </button>
                                                    </div>
                                                    <div className="relative group/tooltip">
                                                        {user.id !== session?.user?.id ? (
                                                            <Link href={`/dashboard?impersonate=${user.id}`}>
                                                                <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 rounded-lg border border-slate-200 hover:bg-brand-primary/5 hover:text-brand-primary hover:border-brand-primary/20 transition-all">
                                                                    <ExternalLink size={14} />
                                                                    <span className="text-xs font-bold">代理登录</span>
                                                                </Button>
                                                            </Link>
                                                        ) : (
                                                            <Link href="/dashboard">
                                                                <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 cursor-default">
                                                                    <UserIcon size={14} />
                                                                    <span className="text-xs font-bold">当前账户</span>
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-xl">
                                                            {user.id !== session?.user?.id ? `以 ${user.name || '此用户'} 的身份进入控制台` : '您当前正在使用的账户'}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {selectedUserForHistory === user.id && (
                                            <tr className="bg-brand-primary/[0.02]">
                                                <td colSpan={5} className="px-8 pb-8 pt-0">
                                                    <div className="bg-white rounded-xl border border-brand-primary/10 shadow-sm p-4 animate-in slide-in-from-top-2 duration-200">
                                                        <div className="flex items-center justify-between mb-4 px-2">
                                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                <HistoryIcon size={12} />
                                                                最近积分记录
                                                            </h4>
                                                            <button onClick={() => setSelectedUserForHistory(null)} className="text-slate-300 hover:text-slate-500">
                                                                <XCircle size={16} />
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {loadingHistory ? (
                                                                <div className="py-8 flex justify-center">
                                                                    <Loader2 size={20} className="animate-spin text-brand-primary/30" />
                                                                </div>
                                                            ) : userTransactions.length > 0 ? (
                                                                userTransactions.map((tx) => (
                                                                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-100 group/tx">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-8 h-8 rounded flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                                                <Coins size={14} />
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-xs font-bold text-slate-700">{tx.description || tx.type}</div>
                                                                                <div className="text-[10px] text-slate-400 font-mono">{new Date(tx.createdAt).toLocaleString()}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <span className={`font-mono text-xs font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                                                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                                                            </span>
                                                                            {tx.type !== 'PURCHASE' && (
                                                                                <button 
                                                                                    onClick={() => handleRevert(tx.id, user.id)}
                                                                                    disabled={isReverting === tx.id}
                                                                                    className="px-2 py-1 text-[10px] font-bold text-red-500 hover:bg-red-500 hover:text-white rounded transition-all opacity-0 group-hover/tx:opacity-100 disabled:opacity-50 flex items-center gap-1"
                                                                                >
                                                                                    {isReverting === tx.id ? <Loader2 size={10} className="animate-spin" /> : <Undo2 size={10} />}
                                                                                    撤销
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="py-8 text-center text-xs text-slate-400 italic">
                                                                    暂无积分变动记录
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">
                                        没有找到符合条件的记录。
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-50/50 border-t border-slate-100 px-8 py-4 flex items-center justify-between">
                    <div className="text-xs font-medium text-slate-500">
                        共找到 <span className="font-bold text-slate-900">{total}</span> 名用户
                    </div>
                </div>
            </Card>
        </div>
    );
}
