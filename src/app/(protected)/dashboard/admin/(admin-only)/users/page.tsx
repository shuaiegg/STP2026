"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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

    const [openKebabUserId, setOpenKebabUserId] = useState<string | null>(null);
    const [adjustingCreditsUserId, setAdjustingCreditsUserId] = useState<string | null>(null);
    const kebabRef = useRef<HTMLDivElement>(null);

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

    // Close kebab on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (kebabRef.current && !kebabRef.current.contains(event.target as Node)) {
                setOpenKebabUserId(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                setAdjustingCreditsUserId(null);
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
                    <h1 className="text-3xl font-bold text-brand-text-primary mb-2 font-display">用户管理</h1>
                    <p className="text-brand-text-secondary">查看、搜索、以及管理平台注册用户的积分与权限。</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="搜索用户名或邮箱..."
                            aria-label="搜索用户名或邮箱"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-brand-surface border-brand-border rounded-lg py-3 pl-12 pr-6 text-sm focus:ring-2 focus:ring-brand-primary/10 border w-full md:w-80 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-brand-surface overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-brand-surface-alt/50 border-b border-brand-border">
                                <th scope="col" className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">用户信息</th>
                                <th scope="col" className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">角色</th>
                                <th scope="col" className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">积分余额</th>
                                <th scope="col" className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">活跃度</th>
                                <th scope="col" className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-brand-text-muted">
                                            <Loader2 className="animate-spin" size={32} />
                                            <span className="text-sm font-medium">正在加载用户数据...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <React.Fragment key={user.id}>
                                        <tr className={`hover:bg-brand-surface-alt/30 transition-colors group ${selectedUserForHistory === user.id ? 'bg-brand-primary/[0.02]' : ''}`}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary border-2 border-white shadow-sm relative overflow-hidden">
                                                        {user.image ? (
                                                            <Image src={user.image} alt={user.name || ''} width={48} height={48} className="object-cover" />
                                                        ) : (
                                                            <UserIcon size={24} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-brand-text-primary">{user.name || '未命名'}</div>
                                                        <div className="text-xs text-brand-text-secondary">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <Badge variant="outline" className={`font-mono text-[10px] uppercase border-2 ${
                                                    user.role === 'ADMIN' ? 'text-brand-admin bg-brand-admin-muted border-brand-admin-border' : 'text-brand-text-secondary bg-brand-surface-alt border-brand-border'
                                                }`}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-brand-accent-muted flex items-center justify-center text-brand-accent">
                                                            <Coins size={16} />
                                                        </div>
                                                        <span className="font-mono font-bold text-brand-text-primary">{user.credits}</span>
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
                                                        className={`p-1.5 rounded-lg transition-all ${selectedUserForHistory === user.id ? 'bg-brand-text-primary text-brand-text-inverted' : 'text-brand-text-muted hover:bg-brand-surface-alt hover:text-brand-text-secondary'}`}
                                                        aria-label="查看积分记录"
                                                    >
                                                        <HistoryIcon size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-brand-text-secondary text-xs">
                                                <div className="flex flex-col gap-1">
                                                    <span>文章使用: <strong>{user._count.executions}</strong></span>
                                                    <span>最近活动: {new Date(user.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center justify-end gap-3 relative" ref={openKebabUserId === user.id ? kebabRef : null}>
                                                    {adjustingCreditsUserId === user.id ? (
                                                        <div className="flex items-center bg-brand-surface-alt rounded-lg p-1 animate-in fade-in zoom-in-95 duration-200">
                                                            <input 
                                                                type="number" 
                                                                value={creditAmount}
                                                                onChange={(e) => setCreditAmount(parseInt(e.target.value))}
                                                                className="w-16 bg-transparent border-none text-xs font-bold text-center focus:ring-0"
                                                            />
                                                            <button 
                                                                onClick={() => handleUpdateCredits(user.id, creditAmount)}
                                                                disabled={isUpdating === user.id}
                                                                className="p-1.5 hover:bg-brand-success hover:text-brand-text-inverted rounded-md transition-all text-brand-success"
                                                                aria-label={`增加积分 for ${user.name || user.email}`}
                                                            >
                                                                {isUpdating === user.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                                            </button>
                                                            <button 
                                                                onClick={() => handleUpdateCredits(user.id, -creditAmount)}
                                                                disabled={isUpdating === user.id}
                                                                className="p-1.5 hover:bg-brand-error hover:text-brand-text-inverted rounded-md transition-all text-brand-error"
                                                                aria-label={`扣除积分 for ${user.name || user.email}`}
                                                            >
                                                                {isUpdating === user.id ? <Loader2 size={14} className="animate-spin" /> : <Minus size={14} />}
                                                            </button>
                                                            <button 
                                                                onClick={() => setAdjustingCreditsUserId(null)}
                                                                className="ml-1 p-1.5 text-brand-text-muted hover:text-brand-text-secondary"
                                                            >
                                                                <XCircle size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <button 
                                                                onClick={() => setOpenKebabUserId(openKebabUserId === user.id ? null : user.id)}
                                                                className="p-2 rounded-lg hover:bg-brand-surface-alt text-brand-text-muted transition-colors"
                                                                aria-label="更多操作"
                                                            >
                                                                <MoreVertical size={18} />
                                                            </button>

                                                            {openKebabUserId === user.id && (
                                                                <div className="absolute right-0 top-full mt-1 w-36 bg-brand-surface border border-brand-border rounded-lg shadow-lg py-1 z-20 animate-in fade-in slide-in-from-top-1 duration-200">
                                                                    <button 
                                                                        onClick={() => {
                                                                            setAdjustingCreditsUserId(user.id);
                                                                            setOpenKebabUserId(null);
                                                                        }}
                                                                        className="w-full text-left px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-surface-alt transition-colors"
                                                                    >
                                                                        调整积分
                                                                    </button>
                                                                    {user.id !== session?.user?.id && (
                                                                        <Link 
                                                                            href={`/dashboard?impersonate=${user.id}`}
                                                                            className="block w-full text-left px-4 py-2 text-sm text-brand-text-secondary hover:bg-brand-surface-alt transition-colors"
                                                                        >
                                                                            代理登录
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {selectedUserForHistory === user.id && (
                                            <tr className="bg-brand-primary/[0.02]">
                                                <td colSpan={5} className="px-8 pb-8 pt-0">
                                                    <div className="bg-brand-surface rounded-lg border border-brand-primary/10 shadow-sm p-4 animate-in slide-in-from-top-2 duration-200">
                                                        <div className="flex items-center justify-between mb-4 px-2">
                                                            <h4 className="text-xs font-bold text-brand-text-secondary uppercase tracking-widest flex items-center gap-2">
                                                                <HistoryIcon size={12} />
                                                                最近积分记录
                                                            </h4>
                                                            <button onClick={() => setSelectedUserForHistory(null)} className="text-brand-text-muted hover:text-brand-text-secondary" aria-label="关闭积分记录">
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
                                                                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-brand-surface-alt/50 border border-brand-border group/tx">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-8 h-8 rounded flex items-center justify-center ${tx.amount > 0 ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-error/10 text-brand-error'}`}>
                                                                                <Coins size={14} />
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-xs font-bold text-brand-text-primary">{tx.description || tx.type}</div>
                                                                                <div className="text-[10px] text-brand-text-muted font-mono">{new Date(tx.createdAt).toLocaleString()}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <span className={`font-mono text-xs font-bold ${tx.amount > 0 ? 'text-brand-success' : 'text-brand-text-primary'}`}>
                                                                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                                                            </span>
                                                                            {tx.type !== 'PURCHASE' && (
                                                                                <button 
                                                                                    onClick={() => handleRevert(tx.id, user.id)}
                                                                                    disabled={isReverting === tx.id}
                                                                                    className="px-2 py-1 text-[10px] font-bold text-brand-error hover:bg-brand-error hover:text-brand-text-inverted rounded transition-all opacity-0 group-hover/tx:opacity-100 disabled:opacity-50 flex items-center gap-1"
                                                                                >
                                                                                    {isReverting === tx.id ? <Loader2 size={10} className="animate-spin" /> : <Undo2 size={10} />}
                                                                                    撤销
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="py-8 text-center text-xs text-brand-text-muted italic">
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
                                    <td colSpan={5} className="px-8 py-20 text-center text-brand-text-muted italic">
                                        没有找到符合条件的记录。
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-brand-surface-alt/50 border-t border-brand-border px-8 py-4 flex items-center justify-between">
                    <div className="text-xs font-medium text-brand-text-secondary">
                        共找到 <span className="font-bold text-brand-text-primary">{total}</span> 名用户
                    </div>
                </div>
            </Card>
        </div>
    );
}
