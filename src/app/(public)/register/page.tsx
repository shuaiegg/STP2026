"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Loader2, ArrowRight, User as UserIcon, KeyRound, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { translateAuthError } from "@/lib/auth-errors";
import { toast } from "sonner";

type AuthFlow = "enter-email" | "enter-name" | "enter-otp";

export default function UnifiedAuthPage() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<AuthFlow>("enter-email");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState("");
    const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
    const router = useRouter();

    // 1. Check if user exists based on email
    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            // Validate email superficially
            if (!/^\S+@\S+\.\S+$/.test(email)) {
                throw new Error("请输入有效的邮箱地址");
            }

            const res = await fetch("/api/auth/check-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            
            if (!res.ok) throw new Error("服务器错误，请稍后再试");
            
            const data = await res.json();
            
            if (data.exists) {
                // EXISITING USER: Save their name from DB for greetings and go straight to sending OTP
                setName(data.name || "老朋友");
                setIsNewUser(false);
                await sendOtpFor("sign-in");
            } else {
                // NEW USER: Ask for their name first
                setIsNewUser(true);
                setStep("enter-name");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsPending(false);
        }
    };

    // 2. New User submitted their name
    const handleNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length < 2) {
            setError("请输入至少两个字符的称呼");
            return;
        }
        await sendOtpFor("email-verification", email.trim().toLowerCase(), name.trim());
    };

    // 3. Centralized OTP Sending Logic
    const sendOtpFor = async (type: "sign-in" | "email-verification", targetEmail: string, providedName?: string) => {
        setIsPending(true);
        setError("");
        try {
            const payload: any = { email: targetEmail, type };
            if (type === "email-verification" && providedName) {
                payload.name = providedName;
            }

            const { error: authError } = await authClient.emailOTP.sendVerificationCode(payload);

            if (authError) {
                throw new Error(authError.message);
            }
            
            toast.success("验证码已发送至您的邮箱");
            setStep("enter-otp");
        } catch (err: any) {
            setError(translateAuthError(err.message || "发送验证码失败"));
        } finally {
            setIsPending(false);
        }
    };

    // 4. Verify OTP and Authenticate
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            let authError = null;

            if (isNewUser) {
                // Registration Flow
                const res = await authClient.signUp.emailOTP({
                    email,
                    name,
                    code: otp,
                });
                authError = res.error;
            } else {
                // Login Flow
                const res = await authClient.signIn.emailOTP({
                    email,
                    code: otp,
                });
                authError = res.error;
            }

            if (authError) {
                throw new Error(authError.message);
            } else {
                toast.success(isNewUser ? "注册成功！欢迎加入 ScaletoTop" : "登录成功，欢迎回来！");
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
            <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
            
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
                        {step === "enter-email" && "进入您的工作台"}
                        {step === "enter-name" && "很高兴认识您"}
                        {step === "enter-otp" && "验证您的邮箱"}
                    </h1>
                    <p className="text-brand-text-secondary text-sm font-medium">
                        {step === "enter-email" && "输入邮箱，我们将向您发送登录或注册验证码"}
                        {step === "enter-name" && "由于您是首次登录，请告诉我们该如何称呼您"}
                        {step === "enter-otp" && `验证码已发送至 ${email}`}
                    </p>
                </div>

                <Card className="p-8 border-2 border-brand-border-heavy bg-white shadow-[8px_8px_0_0_rgba(10,10,10,1)] stagger-2 animate-slide-in-up">
                    {error && (
                        <div className="mb-6 bg-brand-accent/5 border-2 border-brand-accent/20 text-brand-accent text-xs py-3 px-4 font-bold text-center animate-in fade-in slide-in-from-top-2 duration-300">
                            {error}
                        </div>
                    )}

                    {/* STEP 1: Email Input */}
                    {step === "enter-email" && (
                        <form onSubmit={handleCheckEmail} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
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
                                disabled={isPending || !email}
                                className="w-full h-12 bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        继续以获取验证码
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    )}

                    {/* STEP 2: Name Input (Only for New Users) */}
                    {step === "enter-name" && (
                        <form onSubmit={handleNameSubmit} className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
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
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending || !name}
                                className="w-full h-12 bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        发送验证码
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                            
                            <button
                                type="button"
                                onClick={() => setStep("enter-email")}
                                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-3 h-3" /> 修改邮箱
                            </button>
                        </form>
                    )}

                    {/* STEP 3: OTP Input */}
                    {step === "enter-otp" && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">
                                    {isNewUser ? "请查收邮件并输入 6 位验证码" : `欢迎回来，${name}！请输入 6 位验证码`}
                                </label>
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
                                disabled={isPending || otp.length < 6}
                                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-brand-text-inverted border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        {isNewUser ? "完成注册并领取 10 积分" : "进入工作台"}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={() => isNewUser ? setStep("enter-name") : setStep("enter-email")}
                                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-3 h-3" /> {isNewUser ? "返回修改姓名" : "更换邮箱"}
                            </button>
                        </form>
                    )}
                </Card>

                <div className="mt-8 text-center stagger-3 animate-slide-in-up">
                    <p className="text-sm text-brand-text-secondary font-medium">
                        如果您遇到任何登录问题，请联系
                        <a href="mailto:hi@scaletotop.com" className="font-black text-brand-primary hover:underline underline-offset-4 decoration-2 ml-1">
                            技术支持
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
