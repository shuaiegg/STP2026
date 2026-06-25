"use client";

import React, { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Lock, Loader2, CheckCircle2, ShieldCheck, KeyRound, AlertCircle, Mail, ArrowRight, ArrowLeft, Globe } from "lucide-react";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/auth-errors";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function SettingsPage() {
    const router = useRouter();
    const t = useTranslations("dashboard.settings");
    const locale = useLocale();
    const localizeError = (m: string) => (locale === "zh" ? translateAuthError(m) : m);
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
    const [localePreference, setLocalePreference] = useState<string>("zh");

    // Fetch user session to determine if they have a password and get email
    useEffect(() => {
        async function fetchUserStatus() {
            const { data } = await authClient.getSession();
            if (data?.user) {
                setUserEmail(data.user.email);
                const user = data.user as any;
                if (user.locale) {
                    setLocalePreference(user.locale);
                }
                setHasPassword(true);
            }
        }
        fetchUserStatus();
    }, []);

    const handleUpdateLocale = async (newLocale: string) => {
        if (newLocale === localePreference) return;
        
        setIsPending(true);
        try {
            const { error: authError } = await authClient.updateUser({
                locale: newLocale
            });

            if (authError) throw new Error(authError.message || "Failed to update language preference");

            setLocalePreference(newLocale);
            toast.success(t("general.success"));
            
            // Full refresh to ensure all i18n providers catch the new locale
            router.refresh();
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (err: any) {
            toast.error(err.message || "Operation failed");
        } finally {
            setIsPending(false);
        }
    };

    // Action: Change existing password
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError(t("security.errorMismatch"));
            return;
        }

        if (newPassword.length < 8) {
            setError(t("security.errorLength"));
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
                    setHasPassword(false);
                    setError(translateAuthError(errMsg));
                    return;
                }
                throw new Error(errMsg || t("errChangePwd"));
            }

            toast.success(t("security.success"));
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setError(localizeError(err.message || t("errChangePwdCheck")));
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
                throw new Error(data.error || t("errSendCode"));
            }

            setIsOtpSent(true);
            toast.success(t("security.otpSent"));
        } catch (err: any) {
            setError(localizeError(err.message || t("errSendCode")));
        } finally {
            setIsPending(false);
        }
    };

    // Action: Set initial password using OTP
    const handleSetInitialPassword = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError(t("security.errorMismatch"));
            return;
        }

        if (newPassword.length < 8) {
            setError(t("security.errorLength"));
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
                throw new Error(data.error || data.message || t("errSetPwd"));
            }

            toast.success(t("security.success"));
            setHasPassword(true);
            setNewPassword("");
            setConfirmPassword("");
            setOtp("");
            setIsOtpSent(false);
        } catch (err: any) {
            setError(localizeError(err.message || t("errCodeExpired")));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-10">
                <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-brand-text-muted hover:text-brand-primary transition-colors gap-2 mb-6">
                    <ArrowLeft size={16} /> {t("back")}
                </Link>
                <h1 className="font-display text-4xl font-black text-brand-text-primary mb-2">{t("title")}</h1>
                <p className="text-brand-text-secondary">{t("subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
                {/* Left: Settings Forms */}
                <div className="md:col-span-8 space-y-8">
                    {/* General Settings: Language */}
                    <Card className="p-8 border-2 border-brand-border shadow-[8px_8px_0_0_rgba(10,10,10,0.05)] overflow-hidden relative">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-brand-text-primary">{t("general.title")}</h2>
                                <p className="text-xs text-brand-text-secondary mt-1">{t("general.desc")}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => handleUpdateLocale("zh")}
                                disabled={isPending}
                                className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                                    localePreference === "zh"
                                        ? "border-brand-primary bg-brand-primary/5 ring-4 ring-brand-primary/5"
                                        : "border-brand-border hover:border-brand-primary/40 bg-brand-surface"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🇨🇳</span>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-brand-text-primary">{t("general.zh")}</p>
                                        <p className="text-[10px] text-brand-text-secondary">Chinese (Simplified)</p>
                                    </div>
                                </div>
                                {localePreference === "zh" && (
                                    <CheckCircle2 size={20} className="text-brand-primary animate-in zoom-in duration-300" />
                                )}
                            </button>

                            <button
                                onClick={() => handleUpdateLocale("en")}
                                disabled={isPending}
                                className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                                    localePreference === "en"
                                        ? "border-brand-primary bg-brand-primary/5 ring-4 ring-brand-primary/5"
                                        : "border-brand-border hover:border-brand-primary/40 bg-brand-surface"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🇺🇸</span>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-brand-text-primary">{t("general.en")}</p>
                                        <p className="text-[10px] text-brand-text-secondary">English (US)</p>
                                    </div>
                                </div>
                                {localePreference === "en" && (
                                    <CheckCircle2 size={20} className="text-brand-primary animate-in zoom-in duration-300" />
                                )}
                            </button>
                        </div>
                    </Card>

                    {/* Security Section */}
                    <Card className="p-8 border-2 border-brand-border shadow-[8px_8px_0_0_rgba(10,10,10,0.05)] overflow-hidden relative">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-brand-text-primary">{t("security.title")}</h2>
                                <p className="text-xs text-brand-text-secondary mt-1">{t("security.desc")}</p>
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
                                    <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("security.currentPassword")}</label>
                                    <div className="relative group">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full bg-brand-surface border-2 border-brand-border rounded-xl py-3 pl-11 pr-4 text-brand-text-primary focus:border-brand-primary transition-all outline-none text-sm"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("security.newPassword")}</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-brand-surface border-2 border-brand-border rounded-xl py-3 pl-11 pr-4 text-brand-text-primary focus:border-brand-primary transition-all outline-none text-sm"
                                                placeholder={t("security.errorLength")}
                                                minLength={8}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("security.confirmPassword")}</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-brand-surface border-2 border-brand-border rounded-xl py-3 pl-11 pr-4 text-brand-text-primary focus:border-brand-primary transition-all outline-none text-sm"
                                                placeholder={t("security.confirmPassword")}
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
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("security.save")}</>}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => setHasPassword(false)}
                                    className="block mt-4 text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-primary transition-colors underline underline-offset-4"
                                >
                                    {t("security.noPassword")}
                                </button>
                            </form>
                        )}

                        {/* FLOW B: Set Initial Password via Verification */}
                        {hasPassword === false && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="p-4 bg-brand-secondary/10 border-2 border-brand-secondary/20 rounded-xl mb-6">
                                    <p className="text-sm font-bold text-brand-text-primary mb-1">{t("security.noPasswordSet")}</p>
                                    <p className="text-xs text-brand-text-secondary">{t("security.noPasswordSetDesc")}</p>
                                </div>

                                {!isOtpSent ? (
                                    <div className="flex flex-col gap-4">
                                        <Button
                                            onClick={handleRequestOtp}
                                            disabled={isPending}
                                            className="w-full h-12 bg-brand-secondary hover:bg-brand-secondary-hover text-brand-text-primary border-2 border-brand-border-heavy shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                                        >
                                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                <>{t("security.btnSendOtpTo", { email: userEmail })} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                            )}
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={() => setHasPassword(true)}
                                            className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted hover:text-brand-primary transition-colors mt-2"
                                        >
                                            {t("security.btnCancelBack")}
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSetInitialPassword} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("security.otpTitle")}</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                                <input
                                                    type="text"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    className="w-full bg-brand-surface border-2 border-brand-border rounded-xl py-3 pl-11 pr-4 text-brand-text-primary focus:border-brand-primary transition-all outline-none text-sm tracking-[0.5em] font-mono font-bold"
                                                    placeholder={t("security.otpPlaceholder")}
                                                    maxLength={6}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("security.setInitialPassword")}</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                                    <input
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-xl py-3 pl-11 pr-4 text-brand-text-primary focus:border-brand-primary transition-all outline-none text-sm"
                                                        placeholder={t("security.setInitialPasswordPh")}
                                                        minLength={8}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("security.confirmInitialPassword")}</label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-xl py-3 pl-11 pr-4 text-brand-text-primary focus:border-brand-primary transition-all outline-none text-sm"
                                                        placeholder={t("security.confirmInitialPasswordPh")}
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
                                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("security.btnSetInitialPassword")}</>}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsOtpSent(false)}
                                                className="px-6 border-2 border-brand-border hover:bg-brand-surface"
                                            >
                                                {t("security.btnResend")}
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
                            {t("security.tipsTitle")}
                        </h3>
                        <ul className="space-y-3 text-xs text-brand-text-secondary leading-relaxed">
                            {(t.raw("security.tips") as string[]).map((tip, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-brand-primary">•</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card className="p-6 bg-brand-primary/5 border-2 border-brand-primary/10">
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-2">{t("security.helpTitle")}</p>
                        <p className="text-xs text-brand-text-secondary leading-relaxed mb-4">{t("security.helpDesc")}</p>
                        <a href="mailto:jack@scaletotop.com" className="text-xs font-bold text-brand-primary underline">jack@scaletotop.com</a>
                    </Card>
                </div>
            </div>
        </div>
    );
}
