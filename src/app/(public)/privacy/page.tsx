"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Shield, ChevronDown, ChevronUp, Globe } from 'lucide-react';

function renderContent(text: string) {
    return text.split('\n').map((line, i) => {
        const parts = line.split(/\*\*(.+?)\*\*/g);
        return (
            <span key={i}>
                {parts.map((part, j) =>
                    j % 2 === 1 ? <strong key={j} className="font-bold text-brand-text-primary">{part}</strong> : part
                )}
                {'\n'}
            </span>
        );
    });
}

export default function PrivacyPage() {
    const lastUpdated = "2026-03-22";
    const [showEnglish, setShowEnglish] = useState(false);

    const sections = [
        {
            id: "1",
            title: "1. 我们收集的个人信息",
            content: `当您使用 ScaletoTop 的服务时，我们可能收集以下个人信息：

• **账户注册信息**：包括您的姓名、电子邮箱地址及登录凭证。注册时提供此类信息属于自愿行为，您可在不提供个人信息的情况下匿名浏览本网站。

• **业务输入内容**：您在使用 AI 工具过程中输入的关键词、SEO 调研需求及相关业务描述，用于实时生成服务内容。

• **支付信息**：当您购买积分套餐时，支付信息由我们授权的第三方支付处理商收集并处理。我们不在自有服务器上存储您的银行卡号或完整支付数据。

• **技术信息**：包括浏览器类型、操作系统、IP 地址以及页面访问行为，通过 Cookie 及类似技术自动采集，用于维持服务正常运行及改善用户体验。`
        },
        {
            id: "2",
            title: "2. 我们如何使用您的信息",
            content: `我们收集您的信息，仅用于以下目的：

• 提供、维护并持续优化 ScaletoTop 平台的各项功能与 AI 工具。
• 处理您的订单、管理积分余额并记录交易明细。
• 向您发送必要的系统通知、账户验证信息及服务更新。
• 响应您的服务请求及客户支持咨询。
• 分析平台整体使用趋势，改善产品功能（采用去标识化或聚合方式）。
• 识别、预防及调查欺诈行为或其他违规活动，保护用户账户安全。`
        },
        {
            id: "3",
            title: "3. 信息共享与第三方服务",
            content: `我们不会将您的个人信息出售给第三方。我们仅在以下情形下与合作方共享必要信息：

• **服务提供商**：我们与在保密协议约束下运营的受信任服务提供商合作，涵盖云基础架构、支付处理、电子邮件发送及产品分析等职能。这些提供商仅被授权在为我们提供服务所必需的范围内处理您的数据。

• **AI 内容生成**：您输入的内容可能被传输至我们授权的 AI 内容生成服务提供商，仅用于实时生成输出结果。我们与相关提供商签有数据处理协议，您的数据不得被用于训练通用模型或任何超出当次请求范围的用途。

• **支付处理**：作为 Merchant of Record（MOR）的授权支付处理商负责处理所有交易并承担相应合规责任，其隐私政策对支付数据处理具有独立约束力。

• **法律要求**：若法律、法院命令或政府机构要求，我们可能披露您的信息。

• **业务转让**：若发生合并、收购或资产出售，用户数据可能作为业务资产的一部分进行转让，届时接收方须遵守本隐私政策中的承诺。`
        },
        {
            id: "4",
            title: "4. Cookie 的使用",
            content: `本网站使用 Cookie 及类似技术来增强您的使用体验：

• **必要性 Cookie**：维持您的登录状态及基本功能的正常运行，无法关闭。
• **分析类 Cookie**：帮助我们了解用户如何与平台交互，以便改善功能设计。所有分析数据均以匿名或聚合形式处理。

您可以通过浏览器设置拒绝非必要 Cookie，但这可能导致部分功能无法正常使用。`
        },
        {
            id: "5",
            title: "5. 数据存储、保留与跨境传输",
            content: `• **存储地点**：您的数据存储于由我们的云基础架构服务提供商运营的安全服务器上，主要位于美国和新加坡的数据中心。

• **数据保留**：我们仅在实现收集目的所必需的期限内保留您的个人数据。账户注销后，除法律法规要求保留的财务记录（通常为 7 年）外，其余个人数据将在 30 个自然日内删除。

• **跨境传输**：由于我们的服务提供商在全球多个地区运营，您的数据可能被传输至您所在地区以外的国家或地区进行处理。我们通过合同条款及其他适当保护措施，确保此类传输符合主流国际隐私保护标准。`
        },
        {
            id: "6",
            title: "6. 数据安全",
            content: `我们采用行业标准的技术与管理措施保护您的个人信息：

• 所有数据传输均通过 TLS/SSL 加密协议保护。
• 您的密码经高强度单向哈希算法处理后存储，我们无法查阅您的原始密码。
• 支付数据由符合 PCI-DSS 标准的第三方支付处理商全程加密处理。
• 对个人数据的访问权限受到严格限制，仅限于需要接触此类数据以履行职责的内部人员。

尽管如此，互联网传输或电子存储方式无法保证绝对安全。如果您发现账户存在安全异常，请立即联系我们。`
        },
        {
            id: "7",
            title: "7. 您的权利",
            content: `根据适用的数据保护法律，您享有以下权利：

• **查阅权**：要求获取我们持有的关于您的个人信息副本。
• **更正权**：要求更正不准确或不完整的个人信息。
• **删除权**：在特定情形下要求删除您的个人信息（"被遗忘权"）。
• **数据可携权**：要求以机器可读格式获取您的数据，以便转移至其他服务。
• **反对权**：在特定情形下反对我们处理您的个人信息。

如需行使上述任何权利，请通过 support@scaletotop.com 与我们联系。我们将在收到请求后的合理期限内（通常不超过 30 个自然日）予以回复。`
        },
        {
            id: "8",
            title: "8. 未成年人保护",
            content: `ScaletoTop 的服务面向成年用户。我们不会故意收集 16 周岁以下未成年人的个人信息。如果您认为我们意外收集了未成年人的信息，请立即联系我们，我们将尽快删除相关数据。`
        },
        {
            id: "9",
            title: "9. 第三方网站链接",
            content: `本网站可能包含指向第三方网站的链接。我们对这些外部网站的内容及隐私保护实践不承担任何责任。我们建议您在访问任何第三方网站时查阅其隐私政策。`
        },
        {
            id: "10",
            title: "10. 隐私政策的变更",
            content: `我们保留随时修订本隐私政策的权利。若发生重大变更，我们将在网站显著位置发布通知，并更新页面顶部的"最后更新日期"。在政策变更后继续使用本服务，即表示您接受修订后的条款。我们建议您定期查阅本页面，以了解最新的隐私保护实践。`
        }
    ];

    const englishContent = `PRIVACY POLICY
Last Updated: 2026-03-22

ScaletoTop ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, share, and protect information about you when you use our services.

1. Information We Collect
- Account Information: Name, email address, and login credentials provided at registration.
- Business Input Content: Keywords, SEO research requirements, and other inputs you enter while using our AI tools, used solely to generate real-time outputs.
- Payment Information: Collected and processed by our authorized third-party payment processor. We do not store complete card numbers on our servers.
- Technical Information: Browser type, OS, IP address, and page interaction data collected automatically via cookies and similar technologies.

2. How We Use Your Information
- To provide, maintain, and improve ScaletoTop platform features and AI tools.
- To process orders, manage credit balances, and record transactions.
- To send necessary system notifications, account verification, and service updates.
- To respond to your support requests.
- To analyze platform usage trends in anonymized or aggregated form.
- To detect, prevent, and investigate fraud or other prohibited activities.

3. Information Sharing and Third-Party Services
We do not sell your personal information. We share information only with:
- Service Providers: Trusted partners operating under confidentiality agreements for cloud infrastructure, payment processing, email delivery, and product analytics — authorized only as necessary to provide services to us.
- AI Content Generation: Your inputs may be transmitted to authorized AI generation service providers solely to produce real-time results. Your data may not be used to train general-purpose models.
- Payment Processor: Our authorized Merchant of Record handles all transactions under its own privacy policy.
- Legal Requirements: When required by law, court order, or government authority.
- Business Transfers: In the event of a merger or acquisition, under equivalent privacy commitments.

4. Cookies
We use cookies for session management (essential) and anonymous usage analytics (optional). You may disable non-essential cookies via your browser settings, though some features may be affected.

5. Data Storage, Retention, and Transfer
- Storage: Secure servers operated by our cloud infrastructure provider, primarily in the United States and Singapore.
- Retention: Personal data is retained only as long as necessary. Upon account deletion, data is removed within 30 days, except financial records required by law (typically 7 years).
- Cross-border Transfer: Data may be processed in countries outside your region under contractual safeguards meeting international privacy standards.

6. Data Security
- TLS/SSL encryption for all data in transit.
- Passwords stored using strong one-way hashing; we cannot access your original password.
- Payment data processed by a PCI-DSS compliant payment processor.
- Access to personal data strictly limited to personnel who require it to perform their duties.

7. Your Rights
Under applicable data protection laws, you have the right to: access, correct, delete, and export your personal data, and to object to certain types of processing. To exercise these rights, contact us at support@scaletotop.com. We will respond within 30 calendar days.

8. Children's Privacy
Our services are intended for adults. We do not knowingly collect personal information from individuals under 16. If you believe we have done so inadvertently, contact us and we will promptly delete the relevant data.

9. Third-Party Links
We are not responsible for the privacy practices of linked third-party websites. We recommend reviewing their privacy policies before providing any personal information.

10. Changes to This Policy
We reserve the right to update this policy at any time. Material changes will be announced on our website. Continued use after changes constitutes acceptance of the revised policy.

Contact: support@scaletotop.com`;

    return (
        <div className="bg-brand-surface min-h-screen py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-primary/10 mb-6">
                        <Shield className="w-8 h-8 text-brand-primary" />
                    </div>
                    <h1 className="font-display text-4xl md:text-5xl font-black text-brand-text-primary mb-4 italic">隐私政策</h1>
                    <p className="text-brand-text-secondary font-mono text-sm uppercase tracking-widest">
                        最后更新日期：{lastUpdated}
                    </p>
                </div>

                <div className="mb-10 p-6 bg-brand-primary/5 border-2 border-brand-primary/10 rounded-2xl text-sm text-brand-text-secondary leading-relaxed">
                    ScaletoTop（以下简称"我们"）致力于保护您的个人信息与隐私权。本隐私政策说明了当您使用我们的平台与服务时，我们如何收集、使用、共享及保护您的相关信息。请在使用本服务前仔细阅读本政策。
                </div>

                <div className="space-y-6">
                    {sections.map((section) => (
                        <Card key={section.id} className="p-8 border-2 border-brand-border bg-white">
                            <h2 className="text-lg font-black text-brand-text-primary mb-4">{section.title}</h2>
                            <div className="text-brand-text-secondary leading-relaxed text-sm whitespace-pre-line">
                                {renderContent(section.content)}
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
                            <Globe size={16} /> English Version
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
                        如果您对本隐私政策有任何疑问，请联系我们：
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
                        © 2026 ScaletoTop · All Rights Reserved
                    </p>
                </div>
            </div>
        </div>
    );
}
