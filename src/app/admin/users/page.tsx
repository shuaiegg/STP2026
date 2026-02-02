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
    XCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getUsers, updateUserCredits } from '@/app/actions/user';

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [total, setTotal] = useState(0);
    
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [creditAmount, setCreditAmount] = useState(100);

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

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleUpdateCredits = async (userId: string, amount: number) => {
        setIsUpdating(userId);
        try {
            const res = await updateUserCredits(userId, amount, "Admin Manual Adjustment");
            if (res.success) {
                // Optimistic UI update or just refetch
                await fetchUsers();
            } else {
                alert(res.message);
            }
        } finally {
            setIsUpdating(null);
        }
    };

    return (
        <div className="space-y-8">
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
                                    <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
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
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                                    <Coins size={16} />
                                                </div>
                                                <span className="font-mono font-bold text-slate-700">{user.credits}</span>
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
                                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg border border-slate-200" title="代理登录">
                                                    <ExternalLink size={16} className="text-slate-400" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
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
