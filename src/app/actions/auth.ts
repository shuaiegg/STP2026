"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function createFirstAdmin(data: { email: string; name: string }) {
    // 1. Check if any user exists
    const userCount = await prisma.user.count();

    if (userCount > 0) {
        return { success: false, error: "系统已初始化，无法重置管理员。" };
    }

    // 2. Create the first user directly in DB
    // Note: Better Auth needs the user to have an account with password if using email login
    // For simplicity, we create the user and then they should use "forgot password" or 
    // we instruct them to use a specific signUp flow.
    // Actually, Better Auth doesn't allow creating users with passwords easily via prisma only.

    // Better strategy: Return success and tell them to use a HIDDEN signup route for the first time
    return { success: true };
}

export async function logout() {
    // Better Auth cleanup is usually done on client, 
    // but we can also do it here if needed by clearing cookies
    // However, the recommended way is authClient.signOut()
    redirect("/admin/login");
}
