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
            async sendVerificationOTP({ email, otp, type }) {
                console.log(`📧 [DEBUG] Attempting to send ${type} OTP to ${email}`);
                const result = await sendEmail({
                    to: email,
                    subject: "ScaletoTop 验证码",
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: 0 auto;">
                            <h1 style="color: #4F46E5;">ScaletoTop</h1>
                            <p style="font-size: 16px; color: #374151;">您的验证码是：</p>
                            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; padding: 20px; background: #F9FAFB; border-radius: 8px; text-align: center; margin: 20px 0;">
                                ${otp}
                            </div>
                            <p style="font-size: 14px; color: #6B7280;">该验证码 5 分钟内有效。</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #9CA3AF;">如果您没有请求此代码，请忽略此邮件。</p>
                        </div>
                    `
                });
                console.log(`📧 [DEBUG] Resend result for ${email}:`, JSON.stringify(result));
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
        "http://localhost:3000",
        "https://dev.scaletotop.com",
        "https://www.scaletotop.com"
    ],
    rateLimit: {
        window: 60, // 1 minute
        max: 5, // 5 requests per window
        customRules: {
            "/api/auth/email-otp/verify-email": {
                window: 60,
                max: 3,
            },
            "/api/auth/sign-in/email-otp": {
                window: 60,
                max: 3,
            },
        },
    },
});
