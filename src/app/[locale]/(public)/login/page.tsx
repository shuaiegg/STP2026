"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Loader2, ArrowRight, User as UserIcon, KeyRound, ArrowLeft, Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { translateAuthError } from "@/lib/auth-errors";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";

type AuthFlow = "enter-email" | "enter-name" | "enter-otp" | "enter-password";

export default function UserLoginPage() {
    const t = useTranslations("auth.login");
    const locale = useLocale();
    const searchParams = useSearchParams();
    const domainFromUrl = searchParams.get("domain");
    
    // translateAuthError 是中文错误映射器，仅中文界面使用
    const localizeError = (msg: string) => (locale === "zh" ? translateAuthError(msg) : msg);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [step, setStep] = useState<AuthFlow>("enter-email");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState("");
    const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
    const router = useRouter();

    // Persist domain in sessionStorage for recovery after OAuth or refresh
    React.useEffect(() => {
        if (domainFromUrl && typeof window !== "undefined") {
            window.sessionStorage.setItem("pending_audit_domain", domainFromUrl);
        }
    }, [domainFromUrl]);

    const getTargetDomain = () => {
        if (domainFromUrl) return domainFromUrl;
        if (typeof window !== "undefined") {
            return window.sessionStorage.getItem("pending_audit_domain");
        }
        return null;
    };

    // 1. Check if user exists based on email
    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const cleanEmail = email.trim().toLowerCase();
            if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
                throw new Error(t("errInvalidEmail"));
            }

            const res = await fetch("/api/auth/check-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: cleanEmail })
            });

            if (!res.ok) throw new Error(t("errServer"));

            const data = await res.json();

            if (data.exists) {
                setName(data.name || t("oldFriend"));
                setIsNewUser(false);
                await sendOtpFor("sign-in", cleanEmail);
            } else {
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
            setError(t("errNameLen"));
            return;
        }
        // 对于新用户，不能直接发送 "sign-up" 验证码，因为 Better Auth 不支持这个 type
        // 曾尝试使用 "email-verification"，但该类型在用户不存在时不会触发验证码发送
        // 最终方案：统一使用 "sign-in" 类型，它可以触发验证码并在验证成功后自动创建账号
        await sendOtpFor("sign-in", email.trim().toLowerCase());
    };

    // 3. Centralized OTP Sending Logic (HACK to bypass SDK path bug)
    const sendOtpFor = async (type: "sign-in" | "email-verification", targetEmail: string) => {
        setIsPending(true);
        setError("");
        try {
            // MANUAL FETCH to correct endpoint /email-otp/ instead of SDK's broken /email-o-t-p/
            const response = await fetch(`/api/auth/email-otp/send-verification-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: targetEmail,
                    type: type,
                })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || data.message || t("errOtpSend"));
            }

            toast.success(t("toastOtpSent"));
            setStep("enter-otp");
        } catch (err: any) {
            setError(localizeError(err.message || t("errOtpSend")));
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
            const cleanEmail = email.trim().toLowerCase();
            const cleanOtp = otp.trim();

            if (isNewUser) {
                // 对于新用户，我们使用 signIn.emailOtp，因为它在 type="sign-in" 时能自动创建用户
                const res = await authClient.signIn.emailOtp({
                    email: cleanEmail,
                    otp: cleanOtp,
                });
                authError = res.error;

                // 如果登录成功（即账号已自动创建），则立即更新用户的姓名与语言偏好
                if (!authError && name.trim()) {
                    await authClient.updateUser({
                        name: name.trim(),
                        locale: locale,
                    });
                }
            } else {
                // For Sign In, we also use manual fetch to be safe from path issues
                const response = await fetch(`/api/auth/sign-in/email-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
                });
                const data = await response.json();
                if (!response.ok || data.error) throw new Error(data.error || data.message || t("errOtpWrong"));
            }

            if (authError) {
                throw new Error(authError.message);
            } else {
                toast.success(isNewUser ? t("toastRegistered") : t("toastSignedIn"));
                const targetDomain = getTargetDomain();
                if (targetDomain) {
                    window.location.href = `/dashboard/onboarding?domain=${encodeURIComponent(targetDomain)}`;
                } else {
                    window.location.href = "/dashboard";
                }
            }
        } catch (err: any) {
            setError(localizeError(err.message || t("errOtpCheck")));
        } finally {
            setIsPending(false);
        }
    };

    // 5. Password Login (Optional fallback)
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
                const targetDomain = getTargetDomain();
                if (targetDomain) {
                    window.location.href = `/dashboard/onboarding?domain=${encodeURIComponent(targetDomain)}`;
                } else {
                    window.location.href = "/dashboard";
                }
            }
        } catch (err: any) {
            setError(localizeError(err.message || t("errPassword")));
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
                        {step === "enter-email" && t("titleEmail")}
                        {step === "enter-name" && t("titleName")}
                        {step === "enter-otp" && t("titleOtp")}
                        {step === "enter-password" && t("titlePassword")}
                    </h1>
                    <p className="text-brand-text-secondary text-sm font-medium">
                        {step === "enter-email" && t("subEmail")}
                        {step === "enter-name" && t("subName")}
                        {step === "enter-otp" && t("subOtp", { email })}
                        {step === "enter-password" && t("subPassword")}
                    </p>
                </div>

                <Card className="p-8 border-2 border-brand-border-heavy bg-white shadow-[8px_8px_0_0_rgba(10,10,10,1)] stagger-2 animate-slide-in-up">
                    {getTargetDomain() && (
                        <div className="mb-6 p-3 bg-brand-secondary/10 border border-brand-secondary/30 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                            <Globe className="w-5 h-5 text-brand-secondary animate-pulse" />
                            <div className="text-xs font-bold text-brand-text-primary">
                                {locale === 'zh' 
                                    ? `登录后立即为 ${getTargetDomain()} 开启体检` 
                                    : `Audit ${getTargetDomain()} immediately after signing in`}
                            </div>
                        </div>
                    )}
                    
                    {error && (
                        <div className="mb-6 bg-brand-error/10 border-2 border-brand-error text-brand-error text-xs py-3 px-4 font-black text-center animate-shake">
                            {error}
                        </div>
                    )}

                    {step === "enter-email" && (
                        <form onSubmit={handleCheckEmail} className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("labelEmail")}</label>
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
                                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-brand-text-inverted border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("btnEnter")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                            </Button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-brand-border" /></div>
                                <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-3 text-brand-text-muted tracking-widest">OR</span></div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep("enter-password")}
                                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-brand-text-secondary hover:text-brand-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <Lock className="w-3 h-3" /> {t("usePassword")}
                            </button>
                        </form>
                    )}

                    {step === "enter-name" && (
                        <form onSubmit={handleNameSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("labelName")}</label>
                                <div className="relative group">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm font-medium"
                                        placeholder={t("placeholderName")}
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
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("btnGetCode")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                            </Button>
                        </form>
                    )}

                    {step === "enter-otp" && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">
                                    {isNewUser ? t("labelVerifyEmail") : t("labelWelcomeBack", { name })}
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
                                className="w-full h-12 bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("btnVerify")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                            </Button>
                        </form>
                    )}

                    {step === "enter-password" && (
                        <form onSubmit={handlePasswordLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("labelEmail")}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 px-4 text-brand-text-primary outline-none text-sm font-medium"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("labelPassword")}</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 px-4 text-brand-text-primary outline-none text-sm font-medium"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-brand-text-inverted border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("btnLogin")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                            </Button>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}
