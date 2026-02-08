"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Lock, Loader2, ArrowRight, KeyRound, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { translateAuthError } from "@/lib/auth-errors";
import { toast } from "sonner";

export default function UserLoginPage() {
    console.log("🧞‍♂️ Aladdin Auth Logic v6.2 (Unified Flow) Loaded");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [step, setStep] = useState<"email" | "register_info" | "otp" | "password">("email");
    const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    // 1. 发送验证码
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const cleanEmail = email.trim().toLowerCase();
            console.log("🚀 Auth: Routing request for", cleanEmail);
            
            // 尝试以 sign-in 模式发送
            const response = await fetch(`/api/auth/email-otp/send-verification-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: cleanEmail,
                    type: "sign-in",
                })
            });

            const data = await response.json();

            // 如果报错，且包含 "User not found" 或特定错误码
            if (!response.ok || data.error) {
                const errorMessage = data.error || "";
                const errorCode = data.code || "";
                
                // 修正：增加对 data.message 的检查，并放宽匹配条件
                const fullErrorText = (errorMessage + errorCode + (data.message || "")).toLowerCase();
                console.log("📝 Auth Error Context:", fullErrorText);

                if (fullErrorText.includes("user not found") || fullErrorText.includes("user_not_found")) {
                    console.log("📝 User not found, switching to sign-up mode...");
                    setStep("register_info"); // 切换到输入姓名步骤
                    return;
                }
                throw new Error(data.error || "发送验证码失败");
            }
            
            toast.success("验证码已发送至您的邮箱");
            setStep("otp");
            setMode("sign-in");
        } catch (err: any) {
            setError(translateAuthError(err.message || "发送失败，请检查邮箱"));
        } finally {
            setIsPending(false);
        }
    };

    // 1b. 新用户提交姓名并发送验证码
    const handleRegisterSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const cleanEmail = email.trim().toLowerCase();
            const cleanName = name.trim();
            
            const response = await fetch(`/api/auth/email-otp/send-verification-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: cleanEmail,
                    name: cleanName,
                    type: "sign-up",
                })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || "发送验证码失败");
            }
            
            toast.success("欢迎！验证码已发送至您的邮箱");
            setStep("otp");
            setMode("sign-up");
        } catch (err: any) {
            setError(translateAuthError(err.message || "发送失败"));
        } finally {
            setIsPending(false);
        }
    };

    // 2. 验证并完成 (登录或注册)
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const cleanEmail = email.trim().toLowerCase();
            const cleanOtp = otp.trim();
            
            let response;
            if (mode === "sign-up") {
                console.log("🚀 Auth: Finalizing Registration for", cleanEmail, "with name:", name);
                response = await fetch(`/api/auth/sign-up/email-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        email: cleanEmail, 
                        name: name.trim() || email.split("@")[0], // 兜底使用邮箱前缀
                        code: cleanOtp 
                    })
                });
            } else {
                console.log("🚀 Auth: Finalizing Login for", cleanEmail);
                response = await fetch(`/api/auth/sign-in/email-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
                });
            }

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || data.message || "验证码错误");
            } else {
                toast.success(mode === "sign-up" ? "欢迎加入 ScaletoTop！" : "登录成功");
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err: any) {
            setError(translateAuthError(err.message || "验证码错误"));
        } finally {
            setIsPending(false);
        }
    };

    // 3. 密码登录
    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const { error: authError } = await authClient.signIn.email({
                email: email.trim().toLowerCase(),
                password: password.trim(),
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
        <div className="min-h-screen bg-brand-surface flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
            
            {/* Dynamic Mesh Gradients for Premium Feel */}
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
                        {step === "otp" ? "验证代码" : "欢迎回来"}
                    </h1>
                    <p className="text-brand-text-secondary text-sm font-medium">
                        {step === "otp" ? `代码已发送至 ${email}` : "登录以开启您的数字化增长系统"}
                    </p>
                </div>

                <Card className="p-8 border-2 border-brand-border-heavy bg-white shadow-[8px_8px_0_0_rgba(10,10,10,1)] stagger-2 animate-slide-in-up">
                    {error && (
                        <div className="mb-6 bg-brand-accent/10 border-2 border-brand-accent text-brand-accent text-xs py-3 px-4 font-black text-center animate-in fade-in slide-in-from-top-2 duration-300">
                            {error}
                        </div>
                    )}

                    {step === "email" && (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">邮箱地址 / Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm font-medium"
                                        placeholder="请输入您的电子邮件"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-brand-text-muted mt-2 ml-1 italic font-medium">
                                    提示：未登录过的邮箱将自动创建新账户
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-brand-text-inverted border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>进入系统 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                            </Button>

                            <div className="text-center">
                                <p className="text-[10px] text-brand-text-muted">
                                    点击登录即表示您同意我们的{" "}
                                    <Link href="/terms" className="underline hover:text-brand-primary">服务条款</Link>{" "}
                                    和{" "}
                                    <Link href="/privacy" className="underline hover:text-brand-primary">隐私政策</Link>
                                </p>
                            </div>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-brand-border" /></div>
                                <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-3 text-brand-text-muted tracking-widest">OR</span></div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep("password")}
                                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-brand-text-secondary hover:text-brand-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <Lock className="w-3 h-3" /> 使用密码访问
                            </button>
                        </form>
                    )}

                    {step === "register_info" && (
                        <form onSubmit={handleRegisterSendOTP} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">欢迎新同学！请输入您的姓名 / Name</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm font-medium"
                                        placeholder="例如：Jack"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>获取验证码并领积分 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setStep("email")}
                                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-3 h-3" /> 返回修改邮箱
                            </button>
                        </form>
                    )}

                    {step === "otp" && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">6 位动态验证码 / Code</label>
                                <div className="relative group">
                                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm font-mono tracking-[0.5em] font-bold"
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
                                className="w-full h-12 bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>验证并进入系统 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setStep("email")}
                                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-3 h-3" /> 返回修改邮箱
                            </button>
                        </form>
                    )}

                    {step === "password" && (
                        <form onSubmit={handlePasswordLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">邮箱地址 / Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 px-4 text-brand-text-primary outline-none text-sm font-medium"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">访问密码 / Password</label>
                                    <Link href="/forgot-password" className="text-[10px] font-black text-brand-text-primary uppercase hover:text-brand-accent transition-colors">
                                        忘记密码?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm font-medium"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-brand-text-inverted border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>立即登录系统 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setStep("email")}
                                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-3 h-3" /> 使用验证码登录
                            </button>
                        </form>
                    )}
                </Card>

                <div className="mt-8 text-center stagger-3 animate-slide-in-up">
                    <p className="text-sm text-brand-text-secondary font-medium">
                        还没有账号?{" "}
                        <Link href="/register" className="font-black text-brand-primary hover:underline underline-offset-4 decoration-2">
                            立即加入并获取 10 积分
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
