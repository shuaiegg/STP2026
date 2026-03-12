"use client";

import React, { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Lock, Loader2, CheckCircle2, ShieldCheck, KeyRound, AlertCircle, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/auth-errors";
import Link from "next/link";

export default function SettingsPage() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [otp, setOtp] = useState("");

    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState("");

    // UI State Management
    const [hasPassword, setHasPassword] = useState<boolean | null>(null);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [userEmail, setUserEmail] = useState("");

    // Fetch user session to determine if they have a password and get email
    useEffect(() => {
        async function fetchUserStatus() {
            const { data } = await authClient.getSession();
            if (data?.user) {
                setUserEmail(data.user.email);
                // In better-auth, we might not directly know if password is set from basic session
                // We'll assume if they reach here and trigger a credential error later, they don't have one.
                // But as a robust UX, we offer setting password via OTP natively.
                // For now, we default to the "Change Password" view, and gracefully fallback to "Set Password via OTP" on specific errors.
                setHasPassword(true);
            }
        }
        fetchUserStatus();
    }, []);

    // Action: Change existing password
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
                revokeOtherSessions: true,
            });

            if (authError) {
                // Automatically switch to OTP flow if the user doesn't have a password set
                const errMsg = authError.message || "";
                if (errMsg.includes("credential") || errMsg.includes("password")) {
                    console.log("User might not have a password set, switching to OTP flow...");
                    setHasPassword(false);
                    throw new Error("检测到您尚未设置初始密码，请通过邮箱验证码进行设置。");
                }
                throw new Error(errMsg || "修改密码失败");
            }

            toast.success("密码已成功修改");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setError(translateAuthError(err.message || "修改密码失败，请检查当前密码是否正确"));
        } finally {
            setIsPending(false);
        }
    };

    // Action: Request OTP for setting initial password
    const handleRequestOtp = async () => {
        setIsPending(true);
        setError("");
        try {
            const response = await fetch(`/api/auth/email-otp/send-verification-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: userEmail,
                    type: "forget-password", // Better Auth uses this type for password resets/sets
                })
            });

            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error || "发送验证码失败");
            }

            setIsOtpSent(true);
            toast.success("验证码已发送至您的邮箱");
        } catch (err: any) {
            setError(translateAuthError(err.message || "发送验证码失败"));
        } finally {
            setIsPending(false);
        }
    };

    // Action: Set initial password using OTP
    const handleSetInitialPassword = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

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
            // MANUAL FETCH to reset-password endpoint to bypass SDK complexities/path issues
            const response = await fetch(`/api/auth/email-otp/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: userEmail,
                    otp: otp.trim(),
                    password: newPassword,
                })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || data.message || "设置密码失败，请检查验证码是否正确");
            }

            toast.success("初始密码设置成功！");
            setHasPassword(true);
            setNewPassword("");
            setConfirmPassword("");
            setOtp("");
            setIsOtpSent(false);
        } catch (err: any) {
            setError(translateAuthError(err.message || "验证码错误或已过期"));
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
                                <h2 className="text-xl font-bold text-brand-text-primary">访问安全</h2>
                                <p className="text-xs text-brand-text-muted font-medium">建议定期更换密码或设置初始密码以保障安全</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-brand-error/10 border-2 border-brand-error rounded-xl flex flex-col gap-2 text-brand-error text-xs font-bold animate-shake">
                                <div className="flex items-center gap-3">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            </div>
                        )}

                        {/* FLOW A: Standard Change Password */}
                        {hasPassword === true && (
                            <form onSubmit={handleChangePassword} className="space-y-6 animate-in fade-in duration-300">
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

                                <button
                                    type="button"
                                    onClick={() => setHasPassword(false)}
                                    className="block mt-4 text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-primary transition-colors underline underline-offset-4"
                                >
                                    我没有初始密码，通过邮件验证设置
                                </button>
                            </form>
                        )}

                        {/* FLOW B: Set Initial Password via Verification */}
                        {hasPassword === false && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="p-4 bg-brand-secondary/10 border-2 border-brand-secondary/20 rounded-xl mb-6">
                                    <p className="text-sm font-bold text-brand-text-primary mb-1">您尚未设置登录密码</p>
                                    <p className="text-xs text-brand-text-secondary">为了您的账号安全，建议您绑定一个专属的访问密码。</p>
                                </div>

                                {!isOtpSent ? (
                                    <div className="flex flex-col gap-4">
                                        <Button
                                            onClick={handleRequestOtp}
                                            disabled={isPending}
                                            className="w-full h-12 bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                                        >
                                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                <>发送验证码至 {userEmail} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                            )}
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={() => setHasPassword(true)}
                                            className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-primary transition-colors mt-2"
                                        >
                                            取消，返回修改密码
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSetInitialPassword} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">邮箱验证码</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                                <input
                                                    type="text"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    className="w-full bg-brand-surface border-2 border-brand-border rounded-xl py-3 pl-11 pr-4 text-brand-text-primary focus:border-brand-primary transition-all outline-none text-sm tracking-[0.5em] font-mono font-bold"
                                                    placeholder="000000"
                                                    maxLength={6}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">设置新密码</label>
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

                                        <div className="flex gap-4">
                                            <Button
                                                type="submit"
                                                disabled={isPending || otp.length < 6 || newPassword.length < 8}
                                                className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-white px-8 py-4 font-bold text-sm shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
                                            >
                                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>验证并设置密码</>}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsOtpSent(false)}
                                                className="px-6 border-2 border-brand-border hover:bg-brand-surface"
                                            >
                                                重发
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
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
                                首次通过邮件验证码登录的用户，可以直接通过验证码设置初始密码。
                            </li>
                            <li className="flex gap-2">
                                <span className="text-brand-primary">•</span>
                                修改密码后，系统将自动登出您在其他浏览器上的会话。
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
