"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, User as UserIcon, CreditCard, AlertCircle, CheckCircle2, Loader2, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers } from '@/app/actions/user';

interface UserData {
    id: string;
    email: string;
    name: string | null;
    credits: number;
}

export default function CreditRefundPage() {
    const [searchEmail, setSearchEmail] = useState('');
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(false);
    
    const [amount, setAmount] = useState<number>(0);
    const [type, setType] = useState<'REFUND' | 'CONSUMPTION' | 'BONUS'>('REFUND');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSearch = async () => {
        if (!searchEmail.trim()) return;
        setLoading(true);
        setUser(null);
        try {
            const result = await getUsers({ query: searchEmail, limit: 1 });
            if (result.users && result.users.length > 0) {
                const found = result.users[0];
                setUser({
                    id: found.id,
                    email: found.email,
                    name: found.name,
                    credits: found.credits
                });
                toast.success('找到用户');
            } else {
                toast.error('未找到该用户');
            }
        } catch (e: any) {
            toast.error(e.message || '搜索失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!user || !note.trim()) {
            toast.error('请确保已选中用户并填写备注');
            return;
        }

        if (amount === 0) {
            toast.error('调整金额不能为 0');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/credit-adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    amount,
                    type,
                    note
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`成功调整积分。新余额: ${data.newBalance}`);
                setUser({ ...user, credits: data.newBalance });
                setAmount(0);
                setNote('');
            } else {
                toast.error(data.error || '提交失败');
            }
        } catch (e) {
            toast.error('网络请求失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-slate-900 italic mb-2">积分调整与退款管理</h1>
                <p className="text-slate-500 text-sm font-medium">管理员专用：手动为用户增加或扣除积分，并记录流水。</p>
            </div>

            {/* Search Card */}
            <Card className="p-8 border-2 border-slate-100 bg-white shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="输入完整用户邮箱进行精确搜索..."
                            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-brand-primary/10 outline-none transition-all font-medium"
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button 
                        onClick={handleSearch}
                        disabled={loading || !searchEmail.trim()}
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-10 font-bold h-[52px]"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "搜索用户"}
                    </Button>
                </div>
            </Card>

            {user && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                    {/* User Info Card */}
                    <Card className="p-8 border-2 border-brand-primary/10 bg-white shadow-lg md:col-span-1 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-3xl bg-brand-primary/5 flex items-center justify-center text-brand-primary mb-6">
                            <UserIcon size={40} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">{user.name || '匿名用户'}</h3>
                        <p className="text-xs text-slate-400 font-mono mb-6 truncate w-full">{user.email}</p>
                        
                        <div className="w-full pt-6 border-t border-slate-50">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">当前可用积分</div>
                            <div className="flex items-center justify-center gap-2">
                                <Coins className="text-amber-500" size={20} />
                                <span className="text-3xl font-black text-slate-900">{user.credits}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Adjustment Form Card */}
                    <Card className="p-8 border-2 border-slate-100 bg-white shadow-sm md:col-span-2 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">调整类型</label>
                                <select 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-brand-primary outline-none transition-all"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                >
                                    <option value="REFUND">REFUND (退款/加回)</option>
                                    <option value="BONUS">BONUS (赠送)</option>
                                    <option value="CONSUMPTION">CONSUMPTION (扣减)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">积分数 (正/负)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 text-sm font-bold focus:border-brand-primary outline-none transition-all"
                                    value={amount}
                                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">操作备注 (必填)</label>
                            <textarea 
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-4 px-4 text-sm font-medium focus:border-brand-primary outline-none transition-all h-24 resize-none"
                                placeholder="例：系统故障补偿 / 人工退款申请 #12345"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>

                        <div className="pt-4">
                            <Button 
                                onClick={handleSubmit}
                                disabled={submitting || !note.trim() || amount === 0}
                                className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-7 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/20"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : "确认执行调整"}
                            </Button>
                        </div>

                        <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={14} />
                            <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                                注意：执行此操作将直接修改数据库中的用户余额，并产生不可撤销的流水记录。请务必核对邮箱与金额。
                            </p>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
