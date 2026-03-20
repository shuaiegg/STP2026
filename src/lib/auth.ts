import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { emailOTP } from "better-auth/plugins";
import { sendEmail } from "./email";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        emailOTP({
            // Explicitly allow sign up via OTP
            async sendVerificationOTP({ email, otp, type }) {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`[Auth] OTP triggered: ${type} for ${email}`);
                }
                
                const subjects = {
                    "sign-up": "欢迎加入 ScaletoTop - 注册验证码",
                    "sign-in": "ScaletoTop 登录验证码",
                    "forget-password": "ScaletoTop 重置密码验证码",
                    "email-verification": "验证您的 ScaletoTop 邮箱"
                };
                const subject = subjects[type as keyof typeof subjects] || "ScaletoTop 验证码";

                const result = await sendEmail({
                    to: email,
                    subject: subject,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: 0 auto;">
                            <h1 style="color: #4F46E5;">ScaletoTop</h1>
                            <p style="font-size: 16px; color: #374151;">您的验证码是：</p>
                            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; padding: 20px; background: #F9FAFB; border-radius: 8px; text-align: center; margin: 20px 0;">
                                ${otp}
                            </div>
                            <p style="font-size: 14px; color: #6B7280;">该验证码短期内有效，请尽快使用。</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #9CA3AF;">如果您没有请求此代码，请忽略此邮件。</p>
                        </div>
                    `
                });
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`[Auth] Resend delivery:`, result.success ? "SUCCESS" : "FAILED", JSON.stringify(result));
                }
            },
        }),
    ],
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "USER",
                input: false
            },
            credits: {
                type: "number",
                defaultValue: 0,
                input: false
            }
        }
    },
    // Optional: Add session settings
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    trustedOrigins: [
        'https://www.scaletotop.com',
        'https://scaletotop.com',
        ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    ],
    rateLimit: {
        window: 60,
        max: process.env.NODE_ENV === 'production' ? 10 : 20,
    },
});
