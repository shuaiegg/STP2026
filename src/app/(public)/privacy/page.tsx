"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Shield, Eye, Lock, Globe, Server, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';

export default function PrivacyPage() {
    const lastUpdated = "2026-03-21";
    const [showEnglish, setShowEnglish] = useState(false);

    const sections = [
        {
            title: "1. 我们收集的信息",
            icon: <Eye className="w-5 h-5 text-brand-primary" />,
            content: "为了提供数字化营销服务，我们收集以下信息：\n• 账户信息：您的姓名、电子邮箱地址以及登录凭证（通过 better-auth 加密安全处理）。\n• 业务数据：您在工具中输入的关键词、SEO 调研需求以及生成的营销大纲。\n• 支付信息：由第三方支付处理商 Creem.io 处理。我们不存储您的银行卡或信用卡完整信息。\n• 使用数据：通过 PostHog 记录的页面浏览、点击行为及工具使用频率，用于优化产品体验。"
        },
        {
            title: "2. 信息的使用方式",
            icon: <Globe className="w-5 h-5 text-brand-primary" />,
            content: "您的信息仅用于：\n• 提供、维护并改进 ScaletoTop 的 AI 工具（如 StellarWriter）。\n• 计算并扣除您的账户积分。\n• 发送必要的系统通知、验证码（OTP）及服务更新邮件。\n• 识别并防止欺诈行为，保护您的资产安全。"
        },
        {
            title: "3. 数据处理与第三方服务",
            icon: <Server className="w-5 h-5 text-brand-primary" />,
            content: "我们与以下可信赖的服务商合作处理数据：\n• AI 处理商：DeepSeek、Google Gemini、Anthropic。您的输入仅用于实时生成，不会被用于训练这些模型的通用能力。\n• 支付处理：Creem.io（作为 Merchant of Record）。您的支付由 Creem 安全处理并承担相关合规责任。\n• 基础架构：Supabase (AWS) 提供数据库与文件存储。\n• 邮件服务：通过 Resend 发送验证码及业务通知。\n• 统计分析：使用 PostHog 进行产品内匿名行为分析。"
        },
        {
            title: "4. 您的权利、保留期与跨境传输",
            icon: <UserCheck className="w-5 h-5 text-brand-primary" />,
            content: "• 权利：您可以随时要求查阅、更正、导出或删除您的个人信息。如需操作请联系 support 邮件。\n• 保留期：我们将在您账户激活期间保留数据。注销账户后，除法律要求保留的财务记录外，其余个人数据将在 30 天内删除。\n• 跨境传输：您的数据可能在您居住地以外的服务器（主要是美国和新加坡）上进行处理，我们确保相关处理商符合国际主流隐私保护标准。"
        },
        {
            title: "5. 数据安全",
            icon: <Lock className="w-5 h-5 text-brand-primary" />,
            content: "我们采用行业标准的加密技术（TLS/SSL）保护数据传输。您的密码通过高强度哈希算法加密，我们无法查阅您的原始密码。支付环节由 Creem.io 全程加密处理，符合 PCI-DSS 标准。"
        }
    ];

    const englishContent = `
        Privacy Policy
        Last Updated: 2026-03-21

        1. Information We Collect
        - Account Info: Name, email, and credentials (managed via better-auth).
        - Business Data: Keywords, SEO research requirements, and generated outlines.
        - Payment Info: Handled by Creem.io (Merchant of Record). We do not store your credit card data.
        - Usage Data: Page views and clicks tracked via PostHog to improve experience.

        2. How We Use Information
        - To provide and improve ScaletoTop AI tools.
        - To manage your credit balance and transactions.
        - To send system notifications and OTP emails.
        - To prevent fraud and ensure account security.

        3. Third-Party Processors
        - AI Providers: DeepSeek, Google Gemini, Anthropic. Your data is not used for general model training.
        - Payments: Creem.io (Merchant of Record).
        - Infrastructure: Supabase (AWS) for database and storage.
        - Emails: Resend.
        - Analytics: PostHog.

        4. Your Rights, Retention, and Data Transfer
        - Rights: You may access, correct, export, or delete your personal data at any time.
        - Retention: Data is kept while your account is active. Upon closure, data is deleted within 30 days except for legal financial records.
        - Cross-border Transfer: Data is processed on international servers (primarily US and Singapore) with industry-standard safeguards.

        5. Data Security
        - We use TLS/SSL encryption for data in transit. 
        - Passwords are hashed and never stored in plain text.
        - Payment processing complies with PCI-DSS via Creem.io.
    `;

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

                {/* English version fold */}
                <div className="mt-12">
                    <button 
                        onClick={() => setShowEnglish(!showEnglish)}
                        className="w-full flex items-center justify-between p-6 bg-slate-50 border-2 border-brand-border rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition-all"
                    >
                        <span className="flex items-center gap-2 uppercase tracking-widest text-xs">
                            <Globe size={16} /> English Version (Full Content)
                        </span>
                        {showEnglish ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    
                    {showEnglish && (
                        <Card className="mt-4 p-8 border-2 border-brand-border bg-white animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium">
                                {englishContent}
                            </div>
                        </Card>
                    )}
                </div>

                <div className="mt-16 p-8 border-2 border-dashed border-brand-border rounded-3xl text-center">
                    <p className="text-brand-text-secondary text-sm mb-4 font-medium">
                        如果您对本隐私政策有任何疑问，请通过以下官方支持邮箱联系我们：
                    </p>
                    <a 
                        href="mailto:support@scaletotop.com" 
                        className="text-brand-primary font-black text-lg hover:underline"
                    >
                        support@scaletotop.com
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
