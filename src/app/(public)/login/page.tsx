"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, Loader2, ArrowRight, Smartphone, KeyRound, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { translateAuthError } from "@/lib/auth-errors";
import { toast } from "sonner";

export default function UserLoginPage() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [step, setStep] = useState<"email" | "otp" | "password">("email");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    // 1. 发送验证码
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const { error: authError } = await authClient.emailOTP.sendVerificationCode({
                email,
                type: "sign-in", // 也可以是 "sign-up"
            });

            if (authError) {
                // 如果用户不存在，尝试作为注册发送
                if (authError.message?.includes("User not found")) {
                   const { error: signUpOtpError } = await authClient.emailOTP.sendVerificationCode({
                        email,
                        type: "sign-up",
                    });
                    if (signUpOtpError) throw new Error(signUpOtpError.message);
                } else {
                    throw new Error(authError.message);
                }
            }
            
            toast.success("验证码已发送至您的邮箱");
            setStep("otp");
        } catch (err: any) {
            setError(translateAuthError(err.message || "发送失败，请检查邮箱"));
        } finally {
            setIsPending(false);
        }
    };

    // 2. 验证并登录
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const { error: authError } = await authClient.signIn.emailOTP({
                email,
                code: otp,
            });

            if (authError) {
                throw new Error(authError.message);
            } else {
                toast.success("登录成功");
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err: any) {
            setError(translateAuthError(err.message || "验证码错误"));
        } finally {
            setIsPending(false);
        }
    };

    // 3. 密码登录 (Fallback)
    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const { error: authError } = await authClient.signIn.email({
                email,
                password,
            });

            if (authError) {
                throw new Error(authError.message);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err: any) {
            setError(translateAuthError(err.message || "登录失败，请检查密码"));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-8">
                        <div className="w-12 h-12 bg-brand-primary border-2 border-brand-border-heavy flex items-center justify-center font-display font-black text-2xl text-brand-text-inverted shadow-[4px_4px_0_0_rgba(10,10,10,1)]">
                            S
                        </div>
                    </Link>
                    <h1 className="font-display text-3xl font-black text-brand-text-primary mb-2">
                        {step === "otp" ? "输入验证码" : "欢迎回来"}
                    </h1>
                    <p className="text-brand-text-secondary">
                        {step === "otp" ? `验证码已发送至 ${email}` : "登录以访问您的数字化获客工具箱"}
                    </p>
                </div>

                <Card className="p-8 border-2 border-brand-border-heavy bg-white shadow-[8px_8px_0_0_rgba(10,10,10,1)]">
                    {error && (
                        <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-600 text-xs py-3 px-4 font-bold text-center">
                            {error}
                        </div>
                    )}

                    {step === "email" && (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">邮箱地址</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-brand-text-inverted border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>获取验证码 <ArrowRight className="w-4 h-4" /></>}
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-brand-border" /></div>
                                <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-2 text-brand-text-muted">或者</span></div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep("password")}
                                className="w-full py-3 text-xs font-bold text-brand-text-secondary hover:text-brand-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <Lock className="w-3 h-3" /> 使用密码登录
                            </button>
                        </form>
                    )}

                    {step === "otp" && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">6 位验证码</label>
                                <div className="relative group">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm font-mono tracking-[0.5em]"
                                        placeholder="000000"
                                        maxLength={6}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>验证并进入控制台 <ArrowRight className="w-4 h-4" /></>}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setStep("email")}
                                className="w-full py-2 text-xs font-bold text-brand-text-muted hover:text-brand-text-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-3 h-3" /> 返回修改邮箱
                            </button>
                        </form>
                    )}

                    {step === "password" && (
                        <form onSubmit={handlePasswordLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">邮箱地址</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 px-4 text-brand-text-primary outline-none text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">访问密码</label>
                                    <Link href="/forgot-password" size="sm" className="text-[10px] font-bold text-brand-secondary uppercase hover:underline">
                                        忘记密码?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-brand-text-inverted border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>密码登录 <ArrowRight className="w-4 h-4" /></>}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setStep("email")}
                                className="w-full py-2 text-xs font-bold text-brand-text-muted hover:text-brand-text-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-3 h-3" /> 使用验证码登录
                            </button>
                        </form>
                    )}
                </Card>

                <div className="mt-8 text-center">
                    <p className="text-sm text-brand-text-secondary">
                        还没有账号?{" "}
                        <Link href="/register" className="font-bold text-brand-primary hover:underline">
                            立即注册获取 10 积分
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
