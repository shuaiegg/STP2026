"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Mail, Lock, User, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SetupForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPending(true);
        setError("");

        try {
            const { error: authError } = await authClient.signUp.email({
                email,
                password,
                name,
                // Passing role as part of the signUp. 
                // Note: Better Auth needs to be configured to accept additional fields.
                role: "ADMIN" as any,
            });

            if (authError) {
                setError(authError.message || "创建失败，请稍后重试");
            } else {
                // If success, refresh to trigger middleware check and redirect to dashboard
                router.push("/admin");
                router.refresh();
            }
        } catch (err: any) {
            console.error("Setup error:", err);
            setError("发生意外错误");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Card className="p-8 bg-slate-900/40 border-slate-800 backdrop-blur-xl shadow-2xl rounded-2xl">
            <form onSubmit={handleCreateAdmin} className="space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm py-3 px-4 rounded-xl text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">管理员姓名</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-950/50 border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/30 transition-all outline-none"
                            placeholder="张管理员"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">登录邮箱</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-950/50 border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/30 transition-all outline-none"
                            placeholder="admin@example.com"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">设置密码</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950/50 border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/30 transition-all outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                >
                    {isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            创建并进入后台
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </Button>
            </form>
        </Card>
    );
}
