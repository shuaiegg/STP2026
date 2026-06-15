"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Loader2, ArrowRight, User as UserIcon, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { translateAuthError } from "@/lib/auth-errors";
import { toast } from "sonner";
import posthog from "posthog-js";
import { useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";
import { setInitialPassword } from "@/app/actions/auth";

type AuthFlow = "initial" | "enter-name" | "enter-otp" | "set-password";

export default function UserLoginPage() {
    const t = useTranslations("auth.login");
    const locale = useLocale();
    const searchParams = useSearchParams();
    const domainFromUrl = searchParams.get("domain");
    
    const localizeError = (msg: string) => (locale === "zh" ? translateAuthError(msg) : msg);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [activeTab, setActiveTab] = useState<"otp" | "password">("otp");
    const [step, setStep] = useState<AuthFlow>("initial");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState("");
    const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
    const router = useRouter();

    // Persist domain in sessionStorage
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

    const handleRedirect = () => {
        const targetDomain = getTargetDomain();
        if (targetDomain) {
            window.location.href = `/dashboard/onboarding?domain=${encodeURIComponent(targetDomain)}`;
        } else {
            window.location.href = "/dashboard";
        }
    };

    // 1. Initial Step: OTP flow check email
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

    // 2. Name submission for new users
    const handleNameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length < 2) {
            setError(t("errNameLen"));
            return;
        }
        await sendOtpFor("sign-in", email.trim().toLowerCase());
    };

    // 3. Centralized OTP Sending
    const sendOtpFor = async (type: "sign-in" | "email-verification", targetEmail: string) => {
        setIsPending(true);
        setError("");
        try {
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

    // 4. OTP Verification
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const cleanEmail = email.trim().toLowerCase();
            const cleanOtp = otp.trim();

            if (isNewUser) {
                const res = await authClient.signIn.emailOtp({
                    email: cleanEmail,
                    otp: cleanOtp,
                });
                if (res.error) throw new Error(res.error.message);

                if (name.trim()) {
                    await authClient.updateUser({
                        name: name.trim(),
                        locale: locale,
                    });
                }
                
                const targetDomain = getTargetDomain();
                posthog.capture('registered', {
                    method: 'email',
                    source: targetDomain ? 'homepage_hero' : 'direct'
                });

                toast.success(t("toastRegistered"));
                setStep("set-password");
            } else {
                const response = await fetch(`/api/auth/sign-in/email-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
                });
                const data = await response.json();
                if (!response.ok || data.error) throw new Error(data.error || data.message || t("errOtpWrong"));
                
                toast.success(t("toastSignedIn"));
                setStep("set-password");
            }
        } catch (err: any) {
            setError(localizeError(err.message || t("errOtpCheck")));
        } finally {
            setIsPending(false);
        }
    };

    // 5. Password Login
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
                toast.success(t("toastSignedIn"));
                handleRedirect();
            }
        } catch (err: any) {
            setError(localizeError(err.message || t("errPassword")));
        } finally {
            setIsPending(false);
        }
    };

    // 6. Optional Set Password Step
    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError(locale === 'zh' ? "密码不匹配" : "Passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            setError(locale === 'zh' ? "密码至少需要 8 位" : "Password must be at least 8 characters");
            return;
        }

        setIsPending(true);
        setError("");

        try {
            const res = await setInitialPassword(newPassword);
            if (!res.success) {
                throw new Error(res.error);
            } else {
                toast.success(t("toastPasswordSet"));
                handleRedirect();
            }
        } catch (err: any) {
            setError(localizeError(err.message));
        } finally {
            setIsPending(false);
        }
    };

    // 7. Google Login
    const handleGoogleLogin = async () => {
        const targetDomain = getTargetDomain();
        const callbackURL = targetDomain 
            ? `/dashboard/onboarding?domain=${encodeURIComponent(targetDomain)}`
            : "/dashboard";
        
        await authClient.signIn.social({
            provider: "google",
            callbackURL: callbackURL
        });
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
                        {step === "initial" && t("titleEmail")}
                        {step === "enter-name" && t("titleName")}
                        {step === "enter-otp" && t("titleOtp")}
                        {step === "set-password" && t("titleSetPassword")}
                    </h1>
                    <p className="text-brand-text-secondary text-sm font-medium">
                        {step === "initial" && t("subEmail")}
                        {step === "enter-name" && t("subName")}
                        {step === "enter-otp" && t("subOtp", { email })}
                        {step === "set-password" && t("subSetPassword")}
                    </p>
                </div>

                <Card className="border-2 border-brand-border-heavy bg-white shadow-[8px_8px_0_0_rgba(10,10,10,1)] stagger-2 animate-slide-in-up overflow-hidden">
                    {/* TABS (Only on initial step) */}
                    {step === "initial" && (
                        <div className="flex border-b-2 border-brand-border-heavy bg-brand-surface">
                            <button
                                onClick={() => setActiveTab("otp")}
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "otp" ? "bg-white text-brand-text-primary" : "text-brand-text-muted hover:text-brand-text-primary"}`}
                            >
                                {t("tabOtp")}
                            </button>
                            <button
                                onClick={() => setActiveTab("password")}
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "password" ? "bg-white text-brand-text-primary" : "text-brand-text-muted hover:text-brand-text-primary"}`}
                            >
                                {t("tabPassword")}
                            </button>
                        </div>
                    )}

                    <div className="p-8">
                        {getTargetDomain() && step !== "set-password" && (
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

                        {/* FLOW A: OTP Login */}
                        {step === "initial" && activeTab === "otp" && (
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
                            </form>
                        )}

                        {/* FLOW B: Password Login */}
                        {step === "initial" && activeTab === "password" && (
                            <form onSubmit={handlePasswordLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("labelEmail")}</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("labelPassword")}</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary outline-none text-sm font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-brand-text-inverted border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("btnLogin")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                                </Button>

                                <div className="text-center pt-2">
                                    <Link href="/forgot-password" className="text-[10px] font-bold text-brand-text-muted hover:text-brand-primary transition-colors uppercase tracking-widest">
                                        {locale === 'zh' ? '忘记密码？' : 'Forgot Password?'}
                                    </Link>
                                </div>
                            </form>
                        )}

                        {/* SOCIAL LOGIN (Only on initial step) */}
                        {step === "initial" && (
                            <div className="mt-6 pt-6 border-t-2 border-brand-border">
                                <Button
                                    onClick={handleGoogleLogin}
                                    variant="outline"
                                    className="w-full h-12 border-2 border-brand-border-heavy hover:bg-brand-surface transition-all font-bold text-sm flex items-center justify-center gap-3 group"
                                >
                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                        />
                                    </svg>
                                    {t("btnGoogle")}
                                </Button>
                            </div>
                        )}

                        {/* STEP: Enter Name (New User) */}
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

                        {/* STEP: Enter OTP */}
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

                        {/* STEP: Optional Set Password */}
                        {step === "set-password" && (
                            <form onSubmit={handleSetPassword} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("labelNewPassword")}</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary outline-none text-sm font-medium"
                                                placeholder="At least 8 chars"
                                                minLength={8}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("labelConfirmPassword")}</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary outline-none text-sm font-medium"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Button
                                        type="submit"
                                        disabled={isPending}
                                        className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-brand-text-inverted border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                                    >
                                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("btnSavePassword")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                                    </Button>
                                    
                                    <button
                                        type="button"
                                        onClick={handleRedirect}
                                        className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-primary transition-colors"
                                    >
                                        {t("btnSkip")}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </Card>

                {step !== "set-password" && (
                    <div className="mt-8 text-center stagger-3 animate-slide-in-up">
                        <p className="text-sm text-brand-text-secondary font-medium">
                            {activeTab === "otp" ? (
                                locale === 'zh' ? "已有密码？" : "Already have a password?"
                            ) : (
                                locale === 'zh' ? "没有设置过密码？" : "No password set yet?"
                            )}
                            <button 
                                onClick={() => setActiveTab(activeTab === "otp" ? "password" : "otp")}
                                className="font-black text-brand-primary hover:underline underline-offset-4 decoration-2 ml-1 uppercase text-xs tracking-wider"
                            >
                                {activeTab === "otp" ? t("tabPassword") : t("tabOtp")}
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
