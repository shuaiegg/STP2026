"use client";

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Gavel, Ban, CreditCard, BrainCircuit, AlertTriangle, FileText } from 'lucide-react';

export default function TermsPage() {
    const lastUpdated = "2026-02-06";

    const sections = [
        {
            title: "1. 条款接受",
            icon: <Gavel className="w-5 h-5 text-brand-primary" />,
            content: "通过访问或使用 ScaletoTop (STP) 平台，即表示您同意受这些服务条款的约束。如果您不同意这些条款的任何部分，请勿使用我们的服务。"
        },
        {
            title: "2. 用户账户与安全",
            icon: <FileText className="w-5 h-5 text-brand-primary" />,
            content: "您必须通过有效的电子邮件（OTP 验证）创建账户。您负责保护您的账户凭据，并对您账户下发生的所有活动负责。我们保留随时拒绝服务或注销账户的权利。"
        },
        {
            title: "3. 积分系统与支付",
            icon: <CreditCard className="w-5 h-5 text-brand-primary" />,
            content: "• 积分消耗：StellarWriter 等工具的使用将根据公布的价格从您的余额中扣除积分。\n• 重复使用：针对同一关键词的 24 小时内重复生成不重复计费。\n• 退款政策：由于 AI 生成服务的即时性，积分一经购买或消耗，除非系统发生重大技术故障，否则不予退还。"
        },
        {
            title: "4. AI 内容生成免责声明",
            icon: <BrainCircuit className="w-5 h-5 text-brand-primary" />,
            content: "• 准确性：AI 生成的内容仅供参考。由于大型语言模型的特性，输出结果可能包含不准确的信息。用户应对最终发布的内容进行人工审核。\n• 版权归属：通过本平台生成的文章版权归用户所有，但用户需确保输入的内容不侵犯他人的知识产权。"
        },
        {
            title: "5. 禁止行为",
            icon: <Ban className="w-5 h-5 text-brand-primary" />,
            content: "严禁以下行为：\n• 利用自动化脚本大规模恶意刷取或消耗系统资源。\n• 利用本平台生成虚假新闻、诈骗信息或违反当地法律法规的内容。\n• 尝试逆向工程本平台的核心算法。"
        },
        {
            title: "6. 服务变更与责任限制",
            icon: <AlertTriangle className="w-5 h-5 text-brand-primary" />,
            content: "我们持续优化 AI 模型，因此工具的输出风格和定价可能会发生变化。在法律允许的最大范围内，ScaletoTop 不对因使用或无法使用本服务而导致的任何直接、间接或后果性损失负责。"
        }
Section: {
            title: "6. 服务变更与责任限制",
            icon: <AlertTriangle className="w-5 h-5 text-brand-primary" />,
            content: "我们持续优化 AI 模型，因此工具的输出风格和定价可能会发生变化。在法律允许的最大范围内，ScaletoTop 不对因使用或无法使用本服务而导致的任何直接、间接或后果性损失负责。"
        }
    ];

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
                                    <div className="text-brand-text-secondary leading-relaxed whitespace-pre-line text-sm md:text-base">
                                        {section.content}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-brand-text-secondary text-sm mb-6">
                        继续使用本平台，即表示您已阅读并同意上述所有条款。
                    </p>
                    <p className="text-[10px] text-brand-text-muted uppercase tracking-[0.2em] font-bold">
                        © 2026 ScaletoTop Compliance Team
                    </p>
                </div>
            </div>
        </div>
    );
}
