import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { emailOTP } from "better-auth/plugins";
import { sendEmail, sendWelcomeEmail } from "./email";
import { addContact } from "./email/systeme";
import { getTriggerTagName } from "./integrations/config";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // 注册 locale 检测链：NEXT_LOCALE cookie（用户手动选过语言，最强信号）
                    // → referer 路径前缀 → Accept-Language → 'en'（站点默认语言）
                    let clientLocale = "en";
                    try {
                        const reqHeaders = await headers();
                        const cookieHeader = reqHeaders.get("cookie") || "";
                        const cookieMatch = cookieHeader.match(/(?:^|;\s*)NEXT_LOCALE=(zh|en)/);
                        const referer = reqHeaders.get("referer") || "";
                        const acceptLanguage = reqHeaders.get("accept-language") || "";

                        if (cookieMatch) {
                            clientLocale = cookieMatch[1];
                        } else if (referer) {
                            clientLocale = (referer.includes("/zh/") || referer.endsWith("/zh")) ? "zh" : "en";
                        } else if (/(^|,)\s*zh\b/i.test(acceptLanguage)) {
                            clientLocale = "zh";
                        }
                    } catch {
                        // headers 不可用时保持默认 'en'
                    }

                    // Check if already has registration bonus to ensure idempotency
                    const existingBonus = await prisma.creditTransaction.findFirst({
                        where: {
                            userId: user.id,
                            type: 'BONUS',
                            description: {
                                contains: '注册赠送'
                            }
                        }
                    });

                    if (existingBonus) return;

                    // Grant bonus credits and set locale
                    await prisma.$transaction([
                        prisma.user.update({
                            where: { id: user.id },
                            data: {
                                credits: {
                                    increment: 10
                                },
                                locale: clientLocale
                            }
                        }),
                        prisma.creditTransaction.create({
                            data: {
                                userId: user.id,
                                amount: 10,
                                type: 'BONUS',
                                description: '注册赠送'
                            }
                        })
                    ]);

                    // Revalidate user cache
                    // @ts-expect-error — Next.js 16 type requires 2 args but 1-arg form works at runtime
                    revalidateTag(`user-${user.id}`);

                    // Send welcome email (non-blocking)
                    sendWelcomeEmail({ email: user.email, name: user.name }, clientLocale).catch((err) => {
                        console.error('[Auth] Failed to send welcome email:', err);
                    });

                    // Sync to systeme.io — tag resolved per-account by locale (_EN rule w/ fallback)
                    getTriggerTagName('SYSTEME_TAG_ON_REGISTER', clientLocale, 'SYSTEME_NEW_USER_TAG').then((tag) => {
                        const tags = tag ? [tag] : [];
                        return addContact(user.email, user.name || '', tags, clientLocale);
                    }).catch((err) => {
                        console.error('[Auth] Failed to add systeme.io contact:', err);
                    });
                }
            }
        }
    },
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
            },
            locale: {
                type: "string",
                required: false,
                defaultValue: "zh",
                input: true
            }
        }
    },
    // Optional: Add session settings
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5 // 5 minutes
        }
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
