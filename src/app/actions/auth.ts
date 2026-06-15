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

export async function setInitialPassword(password: string) {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session) return { success: false, error: "Unauthorized" };

    if (!password || password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters" };
    }

    try {
        // better-auth identifies the user from the session headers (not a body userId).
        // setPassword is for users who signed up via OTP/OAuth and have no password yet.
        await auth.api.setPassword({
            body: { newPassword: password },
            headers: reqHeaders,
        });
        return { success: true };
    } catch (e: any) {
        console.error('[Auth Action] Failed to set initial password:', e);
        return { success: false, error: e.message || "Failed to set password" };
    }
}

export async function logout() {
    // Better Auth cleanup is usually done on client, 
    // but we can also do it here if needed by clearing cookies
    // However, the recommended way is authClient.signOut()
    redirect("/login");
}
