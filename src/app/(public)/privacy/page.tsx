"use client";

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Shield, Eye, Lock, Globe, Server, UserCheck } from 'lucide-react';

export default function PrivacyPage() {
    const lastUpdated = "2026-02-06";

    const sections = [
        {
            title: "1. 我们收集的信息",
            icon: <Eye className="w-5 h-5 text-brand-primary" />,
            content: "为了提供数字化营销服务，我们收集以下信息：\n• 账户信息：您的姓名、电子邮箱地址以及登录凭证（通过 Better Auth 安全处理）。\n• 业务数据：您在工具中输入的关键词、SEO 调研需求以及生成的营销大纲。\n• 使用数据：通过 PostHog 记录的页面浏览、点击行为及工具使用频率，用于优化产品体验。"
        },
        {
            title: "2. 信息的使用方式",
            icon: <Globe className="w-5 h-5 text-brand-primary" />,
            content: "您的信息仅用于：\n• 提供、维护并改进 ScaletoTop 的 AI 工具（如 StellarWriter）。\n• 计算并扣除您的账户积分。\n• 发送必要的系统通知、验证码（OTP）及服务更新邮件。\n• 识别并防止欺诈行为，保护您的资产安全。"
        },
        {
            title: "3. 数据处理与第三方服务",
            icon: <Server className="w-5 h-5 text-brand-primary" />,
            content: "我们与以下可信赖的服务商合作处理数据：\n• AI 处理：我们使用 DeepSeek、Google Gemini 和 Anthropic 的 API 处理内容生成，您的输入不会被用于这些模型的通用训练。\n• 基础架构：数据存储于 Supabase (AWS) 安全服务器中。\n• 追踪分析：使用 PostHog 进行产品内行为分析。\n• 邮件发送：通过 Resend 发送所有业务邮件。"
        },
        {
            title: "4. 您的权利与选择",
            icon: <UserCheck className="w-5 h-5 text-brand-primary" />,
            content: "您对自己的数据拥有绝对控制权：\n• 您可以随时要求查阅、更正或导出您的个人信息。\n• 您可以选择注销账户，我们将根据法律要求删除您的所有关联数据。\n• 对于 PostHog 追踪，我们为管理员提供了隐私屏蔽选项。"
        },
        {
            title: "5. 数据安全",
            icon: <Lock className="w-5 h-5 text-brand-primary" />,
            content: "我们采用行业标准的加密技术（TLS/SSL）保护数据传输，并使用 Prisma Transaction 确保积分数据的原子化与一致性。您的密码通过 bcrypt 高强度加密存储，我们无法查阅您的原始密码。"
        }
    ];

    return (
        <div className="bg-brand-surface min-h-screen py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-primary/10 mb-6">
                        <Shield className="w-8 h-8 text-brand-primary" />
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl font-black text-brand-text-primary mb-4 italic">隐私条款声明</h1>
                    <p className="text-brand-text-secondary font-mono text-sm uppercase tracking-widest">
                        最后更新日期: {lastUpdated}
                    </p>
                </div>

                <div className="space-y-8">
                    {sections.map((section, index) => (
                        <Card key={index} className="p-8 border-2 border-brand-border bg-white hover:border-brand-primary/20 transition-all">
                            <div className="flex items-start gap-4">
                                <div className="mt-1">{section.icon}</div>
                                <div>
                                    <h2 className="text-xl font-bold text-brand-text-primary mb-4">{section.title}</h2>
                                    <div className="text-brand-text-secondary leading-relaxed whitespace-pre-line text-sm md:text-base">
                                        {section.content}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="mt-16 p-8 border-2 border-dashed border-brand-border rounded-3xl text-center">
                    <p className="text-brand-text-secondary text-sm mb-4">
                        如果您对本隐私政策有任何疑问，请通过以下方式联系我们：
                    </p>
                    <a 
                        href="mailto:jack@scaletotop.com" 
                        className="text-brand-primary font-black hover:underline"
                    >
                        jack@scaletotop.com
                    </a>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-brand-text-muted uppercase tracking-[0.2em] font-bold">
                        © 2026 ScaletoTop Legal Department
                    </p>
                </div>
            </div>
        </div>
    );
}
