import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
// Import the server auth type to infer custom fields
import type { auth } from "./auth";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [
        emailOTPClient(),
    ],
    fetchOptions: {}
});

// Export the inferred types so we can use them across the app
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;

/**
 * 这里的核心逻辑是：Better Auth 的 emailOTPClient 会自动把插件 ID "email-otp" 
 * 转换为 "email-o-t-p" 的请求路径（在某些版本中存在此 Bug）。
 * 我们在登录页面直接使用这个 Client。
 */
