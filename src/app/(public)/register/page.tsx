"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, Loader2, ArrowRight, User as UserIcon, KeyRound, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { translateAuthError } from "@/lib/auth-errors";
import { toast } from "sonner";

export default function UserRegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"info" | "otp">("info");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    // 1. 提交初始信息并发送验证码
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const { error: authError } = await authClient.emailOTP.sendVerificationCode({
                email,
                type: "sign-up",
                name: name
            });

            if (authError) {
                throw new Error(authError.message);
            }
            
            toast.success("验证码已发送至您的邮箱");
            setStep("otp");
        } catch (err: any) {
            setError(translateAuthError(err.message || "发送验证码失败"));
        } finally {
            setIsPending(false);
        }
    };

    // 2. 验证 OTP 并完成注册
    const handleVerifyAndRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const { error: authError } = await authClient.signUp.emailOTP({
                email,
                name,
                code: otp,
            });

            if (authError) {
                throw new Error(authError.message);
            } else {
                toast.success("注册成功！欢迎加入 ScaletoTop");
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err: any) {
            setError(translateAuthError(err.message || "验证码错误，请检查"));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
            
            {/* Dynamic Mesh Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-secondary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10 stagger-1 animate-slide-in-up">
                    <Link href="/" className="inline-block mb-8 group">
                        <div className="w-12 h-12 bg-brand-primary border-2 border-brand-border-heavy flex items-center justify-center font-display font-black text-2xl text-brand-text-inverted shadow-[4px_4px_0_0_rgba(10,10,10,1)] group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none transition-all duration-200">
                            S
                        </div>
                    </Link>
                    <h1 className="font-display text-3xl font-black text-brand-text-primary mb-2 tracking-tight">
                        {step === "otp" ? "验证您的邮箱" : "加入 ScaletoTop"}
                    </h1>
                    <p className="text-brand-text-secondary text-sm font-medium">
                        {step === "otp" ? `我们向 ${email} 发送了一个 6 位代码` : "开启您的海外数字化自动化获客之旅"}
                    </p>
                </div>

                <Card className="p-8 border-2 border-brand-border-heavy bg-white shadow-[8px_8px_0_0_rgba(10,10,10,1)] stagger-2 animate-slide-in-up">
                    {error && (
                        <div className="mb-6 bg-brand-accent/5 border-2 border-brand-accent/20 text-brand-accent text-xs py-3 px-4 font-bold text-center animate-in fade-in slide-in-from-top-2 duration-300">
                            {error}
                        </div>
                    )}

                    {step === "info" && (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">您的姓名 / Name</label>
                                <div className="relative group">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm font-medium"
                                        placeholder="输入您的姓名或昵称"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">邮箱地址 / Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm font-medium"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        下一步：获取验证码
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {step === "otp" && (
                        <form onSubmit={handleVerifyAndRegister} className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">6 位动态验证码 / Code</label>
                                <div className="relative group">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary focus:border-brand-primary transition-all outline-none text-sm font-mono tracking-[0.5em] font-bold"
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
                                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-brand-text-inverted border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        完成注册并领取 10 积分
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setStep("info")}
                                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-3 h-3" /> 返回修改信息
                            </button>
                        </form>
                    )}
                </Card>

                <div className="mt-8 text-center stagger-3 animate-slide-in-up">
                    <p className="text-sm text-brand-text-secondary font-medium">
                        已有账号?{" "}
                        <Link href="/login" className="font-black text-brand-primary hover:underline underline-offset-4 decoration-2">
                            立即登录
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
