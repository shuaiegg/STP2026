"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Lock, Loader2, CheckCircle2, ShieldCheck, KeyRound, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/auth-errors";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState("");

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setError("两次输入的密码不一致");
            return;
        }

        if (newPassword.length < 8) {
            setError("新密码长度至少需要 8 位");
            return;
        }

        setIsPending(true);
        setError("");

        try {
            const { error: authError } = await authClient.changePassword({
                newPassword: newPassword,
                currentPassword: currentPassword,
                revokeOtherSessions: true, // 安全起见，修改密码后注销其他设备
            });

            if (authError) {
                throw new Error(authError.message);
            }

            toast.success("密码已成功修改");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            console.error("Change password error:", err);
            setError(translateAuthError(err.message || "修改密码失败，请检查当前密码是否正确"));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-10">
                <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-brand-text-muted hover:text-brand-primary transition-colors gap-2 mb-6">
                    <ArrowLeft size={16} /> 返回控制台
                </Link>
                <h1 className="font-display text-4xl font-black text-brand-text-primary mb-2">账号设置</h1>
                <p className="text-brand-text-secondary">管理您的个人资料与账号安全。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left: Security Section */}
                <div className="md:col-span-8 space-y-8">
                    <Card className="p-8 border-2 border-brand-border-heavy bg-white">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-brand-text-primary">修改访问密码</h2>
                                <p className="text-xs text-brand-text-muted font-medium">建议定期更换密码以保障您的积分安全</p>
                            </div>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border-2 border-red-100 rounded-xl flex flex-col gap-2 text-red-600 text-xs font-bold animate-shake">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                    {error.includes("credential") && (
                                        <div className="mt-2 p-3 bg-white/50 rounded-lg border border-red-100">
                                            <p className="mb-2 text-[10px] text-red-500">提示：如果您之前是使用验证码直接登录的，可能尚未设置初始密码。</p>
                                            <Link href="/forgot-password">
                                                <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase tracking-widest text-brand-primary bg-white shadow-sm border border-brand-primary/20">
                                                    通过邮箱设置初始密码
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">当前密码</label>
                                <div className="relative group">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-xl py-3 pl-11 pr-4 text-brand-text-primary focus:border-brand-primary transition-all outline-none text-sm"
                                        placeholder="请输入您当前的登录密码"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">新密码</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-brand-surface border-2 border-brand-border rounded-xl py-3 pl-11 pr-4 text-brand-text-primary focus:border-brand-primary transition-all outline-none text-sm"
                                            placeholder="至少 8 位字符"
                                            minLength={8}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">确认新密码</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-brand-surface border-2 border-brand-border rounded-xl py-3 pl-11 pr-4 text-brand-text-primary focus:border-brand-primary transition-all outline-none text-sm"
                                            placeholder="请再次输入新密码"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8 py-4 font-bold text-sm shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>保存新密码</>}
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Right: Info Section */}
                <div className="md:col-span-4 space-y-6">
                    <Card className="p-6 bg-slate-50 border-2 border-dashed border-slate-200">
                        <h3 className="font-bold text-brand-text-primary mb-4 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                            安全贴士
                        </h3>
                        <ul className="space-y-3 text-xs text-brand-text-secondary leading-relaxed">
                            <li className="flex gap-2">
                                <span className="text-brand-primary">•</span>
                                使用包含字母、数字和特殊字符的复杂密码。
                            </li>
                            <li className="flex gap-2">
                                <span className="text-brand-primary">•</span>
                                修改密码后，系统将自动登出您在其他浏览器上的会话。
                            </li>
                            <li className="flex gap-2">
                                <span className="text-brand-primary">•</span>
                                如果您是通过邮件验证码登录的，首次设置密码请使用“忘记密码”流程。
                            </li>
                        </ul>
                    </Card>

                    <Card className="p-6 bg-brand-primary/5 border-2 border-brand-primary/10">
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-2">需要帮助?</p>
                        <p className="text-xs text-brand-text-secondary leading-relaxed mb-4">如果您无法修改密码或账号遇到异常，请联系我们的技术支持。</p>
                        <a href="mailto:jack@scaletotop.com" className="text-xs font-bold text-brand-primary underline">jack@scaletotop.com</a>
                    </Card>
                </div>
            </div>
        </div>
    );
}
