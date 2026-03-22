"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Gavel, Ban, CreditCard, BrainCircuit, AlertTriangle, FileText, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
    const lastUpdated = "2026-03-21";
    const [showEnglish, setShowEnglish] = useState(false);

    const sections = [
        {
            title: "1. 服务描述与账户要求",
            icon: <FileText className="w-5 h-5 text-brand-primary" />,
            content: "ScaletoTop 提供 AI 驱动的 SEO 审计、关键词分析及内容生成服务。用户需年满 18 周岁，并通过有效的电子邮箱（OTP 验证）创建账户。您负责保护账户安全，并对账户下发生的所有行为承担法律责任。"
        },
        {
            title: "2. 积分系统与定价规则",
            icon: <CreditCard className="w-5 h-5 text-brand-primary" />,
            content: "• 积分性质：本平台积分（Credits）仅作为使用 AI 工具的消耗凭证，不具有任何现金价值，不可转让或兑现。\n• 消耗规则：系统按执行任务时的公示价格扣除积分。部分任务（如 24 小时内重复生成相同内容）可能享受免重复计费政策，具体以工具说明为准。\n• 有效期：购买的积分永久有效，除非本协议另有规定（如因违反政策被终止服务）。"
        },
        {
            title: "3. 退款条款",
            icon: <AlertTriangle className="w-5 h-5 text-brand-primary" />,
            content: "由于 AI 生成服务的即时性与不可逆性，积分一经购买或消耗，通常不予退还。仅在由于系统重大故障导致积分被错误扣除的情况下，您可申请退款。详细规则请参阅我们的 [退款政策](/refund)。"
        },
        {
            title: "4. AI 内容免责声明",
            icon: <BrainCircuit className="w-5 h-5 text-brand-primary" />,
            content: "• 准确性：AI 输出的内容可能包含事实性错误或不准确信息。用户应对最终发布的内容进行全面的人工审核，ScaletoTop 不对生成内容引发的任何后果负责。\n• 外部因素：SEO 效果受到搜索引擎算法等第三方平台的影响，本平台不保证生成的内容必然获得特定排名或流量提升。"
        },
        {
            title: "5. 可接受使用政策 (AUP)",
            icon: <Ban className="w-5 h-5 text-brand-primary" />,
            content: "您同意不利用本服务进行以下行为：\n• 自动化滥用：通过脚本、爬虫等非正常手段大规模消耗资源或抓取数据。\n• 违法内容：生成虚假、误导性、侵权或违反当地法律法规的信息。\n• 未经授权转售：在未获得书面授权的情况下，将本平台生成的 AI 输出结果作为独立软件服务进行转售。\n• 逆向工程：尝试探测、破解或逆向工程平台核心算法。"
        },
        {
            title: "6. 责任限制与终止",
            icon: <Gavel className="w-5 h-5 text-brand-primary" />,
            content: "在法律允许范围内，ScaletoTop 不对任何间接、偶然或惩罚性损害赔偿负责。如果您违反本服务条款或可接受使用政策，我们保留在不预先通知的情况下，暂停或终止您的账户及积分使用权的权利。"
        }
    ];

    const englishContent = `
        Terms of Service
        Last Updated: 2026-03-21

        1. Service Description & Account Requirements
        ScaletoTop provides AI-powered SEO auditing, keyword analysis, and content generation. Users must be at least 18 years old and create an account via valid email (OTP). You are responsible for account security and all activities under your account.

        2. Credit System & Pricing
        - Credits: Platform credits are used as vouchers for AI tasks. They have no cash value and are non-transferable/non-redeemable.
        - Consumption: Credits are deducted based on current tool pricing. 
        - Expiration: Purchased credits do not expire unless your account is terminated for policy violations.

        3. Refund Terms
        Due to the instant nature of AI services, credits are generally non-refundable once purchased or consumed. Refunds are only available for significant technical failures. See our Refund Policy (/refund) for details.

        4. AI Content Disclaimer
        - Accuracy: AI outputs may contain factual errors. Users must review all content manually before publishing. ScaletoTop is not liable for consequences of using AI-generated content.
        - Performance: SEO results are subject to third-party algorithms. We do not guarantee specific rankings or traffic growth.

        5. Acceptable Use Policy (AUP)
        You agree not to:
        - Abuse via automation: Use scripts/crawlers to mass consume resources.
        - Generate illegal content: Create false, misleading, or infringing info.
        - Unauthorized Resale: Resell AI outputs as a standalone software service without permission.
        - Reverse Engineering: Attempt to hack or reverse engineer platform algorithms.

        6. Limitation of Liability & Termination
        ScaletoTop is not liable for indirect or incidental damages. We reserve the right to suspend or terminate accounts/credits without notice for violations of these Terms or the AUP.
    `;

    return (
        <div className="bg-brand-surface min-h-screen py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-primary/10 mb-6">
                        <Gavel className="w-8 h-8 text-brand-primary" />
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl font-black text-brand-text-primary mb-4 italic">服务条款 (Terms of Service)</h1>
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
                                    <div className="text-brand-text-secondary leading-relaxed whitespace-pre-line text-sm md:text-base font-medium">
                                        {section.title === "3. 退款条款" ? (
                                            <>
                                                由于 AI 生成服务的即时性与不可逆性，积分一经购买或消耗，通常不予退还。仅在由于系统重大故障导致积分被错误扣除的情况下，您可申请退款。详细规则请参阅我们的 <Link href="/refund" className="text-brand-primary font-bold hover:underline">退款政策</Link>。
                                            </>
                                        ) : section.content}
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
                            <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium italic">
                                {englishContent}
                            </div>
                        </Card>
                    )}
                </div>

                <div className="mt-16 text-center bg-white p-8 border-2 border-brand-border rounded-3xl">
                    <p className="text-brand-text-secondary text-sm mb-6 font-medium">
                        如果您对服务条款有任何疑问，请联系官方支持邮箱：
                    </p>
                    <a href="mailto:support@scaletotop.com" className="text-brand-primary font-black text-lg hover:underline underline-offset-4">
                        support@scaletotop.com
                    </a>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-brand-text-muted uppercase tracking-[0.2em] font-bold">
                        © 2026 ScaletoTop Compliance Team
                    </p>
                </div>
            </div>
        </div>
    );
}
