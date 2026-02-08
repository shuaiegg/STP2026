import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [
        emailOTPClient(),
    ],
    fetchOptions: {
        onError(context) {
            console.error("Better Auth Client Error:", context.error);
        },
        // Force the path prefix if the client library generates it incorrectly
        // The logs showed the client requesting email-o-t-p
        onResponse(context) {
            return context.response;
        }
    }
});

/**
 * 这里的核心逻辑是：Better Auth 的 emailOTPClient 会自动把插件 ID "email-otp" 
 * 转换为 "email-o-t-p" 的请求路径（在某些版本中存在此 Bug）。
 * 我们在登录页面直接使用这个 Client。
 */
