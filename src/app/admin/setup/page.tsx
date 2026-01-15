import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SetupForm from "./SetupForm";
import { ShieldCheck } from "lucide-react";

export default async function AdminSetupPage() {
    // 1. Check if any admin exists to prevent unauthorized access after setup
    // Using simple string for ADMIN, Prisma Client should handle this if it matches the enum
    const adminCount = await prisma.user.count({
        where: {
            role: "ADMIN" as any
        }
    });

    if (adminCount > 0) {
        redirect("/admin/login");
    }

    return (
        <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative background blur */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-lg shadow-blue-500/20">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">初始化管理员</h1>
                    <p className="text-slate-400">设置您的超级管理员账号以启动系统</p>
                </div>

                <SetupForm />
            </div>
        </div>
    );
}
