"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Loader2, ArrowRight, ArrowLeft, Send, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { translateAuthError } from "@/lib/auth-errors";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const t = useTranslations("auth.forgot");
    const locale = useLocale();
    const localizeError = (msg: string) => (locale === "zh" ? translateAuthError(msg) : msg);
    const [email, setEmail] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState("");

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            // @ts-ignore — emailOTP plugin type interferes with forgetPassword signature; works at runtime
            const { error: authError } = await authClient.forgetPassword({
                email: email.trim().toLowerCase(),
                redirectTo: "/reset-password",
            });

            if (authError) {
                throw new Error(authError.message);
            }

            setIsSent(true);
            toast.success(t("toastSent"));
        } catch (err: any) {
            setError(localizeError(err.message || t("errRequest")));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-surface flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
            
            {/* Dynamic Mesh Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-secondary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10 stagger-1 animate-slide-in-up">
                    <Link href="/" className="inline-block mb-8 group">
                        <div className="w-12 h-12 bg-brand-primary border-2 border-brand-border-heavy flex items-center justify-center font-display font-black text-2xl text-brand-text-inverted shadow-[4px_4px_0_0_rgba(10,10,10,1)] group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none transition-all duration-200">
                            S
                        </div>
                    </Link>
                    <h1 className="font-display text-3xl font-black text-brand-text-primary mb-2 tracking-tight">
                        {isSent ? t("titleSent") : t("title")}
                    </h1>
                    <p className="text-brand-text-secondary text-sm font-medium">
                        {isSent ? t("subSent", { email }) : t("sub")}
                    </p>
                </div>

                <Card className="p-8 border-2 border-brand-border-heavy bg-white shadow-[8px_8px_0_0_rgba(10,10,10,1)] stagger-2 animate-slide-in-up">
                    {isSent ? (
                        <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-brand-surface border-2 border-brand-border-heavy flex items-center justify-center text-brand-primary mx-auto relative">
                                <Send size={32} className="relative z-10" />
                                <div className="absolute inset-0 bg-brand-secondary/10 animate-pulse" />
                            </div>
                            <div className="space-y-3">
                                <p className="text-sm text-brand-text-primary leading-relaxed font-bold">
                                    {t("sentTitle")}
                                </p>
                                <p className="text-xs text-brand-text-secondary leading-relaxed">
                                    {t("sentDesc")}
                                </p>
                            </div>
                            <div className="pt-4 border-t border-brand-border">
                                <Button 
                                    onClick={() => setIsSent(false)}
                                    variant="ghost"
                                    className="w-full text-brand-primary font-black text-[10px] uppercase tracking-[0.2em] hover:bg-brand-surface"
                                >
                                    {t("reenter")}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleRequestReset} className="space-y-6">
                            {error && (
                                <div className="bg-brand-accent/10 border-2 border-brand-accent text-brand-accent text-xs py-3 px-4 font-black text-center animate-in fade-in slide-in-from-top-2 duration-300">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">{t("labelEmail")}</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-brand-surface border-2 border-brand-border rounded-none py-3 pl-11 pr-4 text-brand-text-primary placeholder:text-brand-text-muted focus:border-brand-primary transition-all outline-none text-sm font-medium"
                                        placeholder={t("placeholder")}
                                        required
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
                                        {t("btnSend")} 
                                        <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    )}
                </Card>

                <div className="mt-8 text-center stagger-3 animate-slide-in-up">
                    <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-text-secondary hover:text-brand-primary transition-colors">
                        <ArrowLeft size={14} /> {t("backLogin")}
                    </Link>
                </div>
            </div>
        </div>
    );
}
