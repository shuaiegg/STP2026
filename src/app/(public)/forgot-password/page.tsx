"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mail, Loader2, ArrowRight, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { translateAuthError } from "@/lib/auth-errors";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState("");

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const { error: authError } = await authClient.forgetPassword({
                email,
                redirectTo: "/reset-password",
            });

            if (authError) {
                throw new Error(authError.message);
            }

            setIsSent(true);
            toast.success("重置邮件已发送");
        } catch (err: any) {
            setError(translateAuthError(err.message || "请求失败，请检查邮箱是否正确"));
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
                        {isSent ? "检查您的收件箱" : "找回密码"}
                    </h1>
                    <p className="text-brand-text-secondary">
                        {isSent ? `我们已将重置链接发送至 ${email}` : "我们将向您的邮箱发送一个特殊的加密链接"}
                    </p>
                </div>

                <Card className="p-8 border-2 border-brand-border-heavy bg-white shadow-[8px_8px_0_0_rgba(10,10,10,1)]">
                    {isSent ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                                <Send size={32} />
                            </div>
                            <p className="text-sm text-brand-text-secondary leading-relaxed">
                                请点击邮件中的链接来设置您的新密码。如果没有收到，请检查垃圾邮件箱。
                            </p>
                            <Button 
                                onClick={() => setIsSent(false)}
                                variant="ghost"
                                className="text-brand-primary font-bold text-xs uppercase tracking-widest"
                            >
                                重新输入邮箱
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleRequestReset} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border-2 border-red-200 text-red-600 text-xs py-3 px-4 font-bold text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="font-mono text-[10px] font-bold text-brand-text-muted uppercase tracking-widest ml-1">注册邮箱</label>
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
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>发送重置链接 <ArrowRight className="w-4 h-4" /></>}
                            </Button>
                        </form>
                    )}
                </Card>

                <div className="mt-8 text-center">
                    <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-brand-text-muted hover:text-brand-primary transition-colors">
                        <ArrowLeft size={14} /> 返回登录
                    </Link>
                </div>
            </div>
        </div>
    );
}
