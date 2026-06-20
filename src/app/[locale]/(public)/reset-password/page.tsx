"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Lock, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/auth-errors";
// i18n router so a /zh visitor lands on /zh/login (not the English /login).
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function ResetPasswordPage() {
    const t = useTranslations("auth.reset");
    const locale = useLocale();
    const localizeError = (msg: string) => (locale === "zh" ? translateAuthError(msg) : msg);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError(t("errMismatch"));
            return;
        }

        setIsPending(true);
        setError("");

        try {
            const { error: authError } = await authClient.resetPassword({
                newPassword: password,
            });

            if (authError) {
                throw new Error(authError.message);
            }

            setIsSuccess(true);
            toast.success(t("toastSuccess"));
            
            // 3秒后自动跳转
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            setError(localizeError(err.message || t("errFailed")));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-8">
                        <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center font-display font-black text-2xl text-brand-text-inverted shadow-sm">
                            S
                        </div>
                    </Link>
                    <h1 className="font-display text-3xl font-black text-brand-text-primary mb-2">{t("title")}</h1>
                    <p className="text-brand-text-secondary">{t("sub")}</p>
                </div>

                <Card className="p-8 bg-white shadow-lg rounded-xl border border-brand-border">
                    {isSuccess ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                                <CheckCircle2 size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-brand-text-primary">{t("successTitle")}</h2>
                            <p className="text-sm text-brand-text-secondary">
                                {t("successDesc")}
                            </p>
                            <Link href="/login" className="block">
                                <Button className="w-full">{t("goLogin")}</Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border-2 border-red-200 text-red-600 text-xs py-3 px-4 font-bold text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("labelNew")}</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm"
                                        placeholder={t("phNew")}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("labelConfirm")}</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm"
                                        placeholder={t("phConfirm")}
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full h-12 bg-brand-secondary hover:bg-brand-secondary-hover text-white rounded-lg shadow-sm hover:shadow transition-all font-bold text-sm flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("btnReset")}</>}
                            </Button>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}
