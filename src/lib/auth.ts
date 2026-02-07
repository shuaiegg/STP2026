import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { emailOTP, forgetPassword } from "better-auth/plugins";
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
            async sendVerificationCode({ email, code }) {
                await sendEmail({
                    to: email,
                    subject: "ScaletoTop 验证码",
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: 0 auto;">
                            <h1 style="color: #4F46E5;">ScaletoTop</h1>
                            <p style="font-size: 16px; color: #374151;">您的验证码是：</p>
                            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; padding: 20px; background: #F9FAFB; border-radius: 8px; text-align: center; margin: 20px 0;">
                                ${code}
                            </div>
                            <p style="font-size: 14px; color: #6B7280;">该验证码 5 分钟内有效。</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #9CA3AF;">如果您没有请求此代码，请忽略此邮件。</p>
                        </div>
                    `
                });
            },
        }),
        forgetPassword({
            async sendResetPassword({ user, url }) {
                await sendEmail({
                    to: user.email,
                    subject: "重置您的 ScaletoTop 密码",
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: 0 auto;">
                            <h1 style="color: #4F46E5;">ScaletoTop</h1>
                            <p style="font-size: 16px; color: #374151;">您好 ${user.name || '用户'},</p>
                            <p style="font-size: 14px; color: #4B5563; line-height: 1.6;">
                                我们收到了重置您账户密码的请求。如果您确定要设置新密码，请点击下方的按钮：
                            </p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${url}" style="background: #4F46E5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                                    重置密码
                                </a>
                            </div>
                            <p style="font-size: 12px; color: #9CA3AF;">
                                该链接 1 小时内有效。如果您没有申请重置，请忽略此邮件，您的账号积分依然安全。
                            </p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #9CA3AF;">若按钮无法点击，请复制此链接至浏览器：<br/>${url}</p>
                        </div>
                    `
                });
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
        "http://192.168.1.11:3000",
        "https://stp.carpartsluxury.com"
    ],
    // You can add more advanced settings here like cross-domain cookies if needed
});
