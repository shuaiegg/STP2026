import React from 'react';

export default function RefundPage() {
    return (
        <div className="bg-white min-h-screen pt-32 pb-24 px-6 font-sans">
            <div className="max-w-4xl mx-auto prose prose-slate">
                <h1 className="text-4xl font-black text-slate-900 mb-10 italic">退款政策 / Refund Policy</h1>
                
                <section className="mb-12">
                    <p className="text-lg text-slate-600 leading-relaxed font-medium mb-8">
                        欢迎使用 ScaletoTop。我们致力于为您提供高质量的 AI SEO 驱动工具。关于积分充值的退款政策如下：
                    </p>

                    <h3 className="text-xl font-bold text-slate-900 mb-4">1. 退款适用范围</h3>
                    <p className="text-slate-600 mb-4">
                        仅在以下由于系统故障导致的情形下，您可以申请退款：
                    </p>
                    <ul className="list-disc pl-6 text-slate-600 mb-6 space-y-2">
                        <li>充值成功但积分在 24 小时内未到账，且经技术排查无法手动补发。</li>
                        <li>由于系统严重错误（Bug）导致积分被错误扣除，且工具未能产出任何有效结果。</li>
                    </ul>

                    <h3 className="text-xl font-bold text-slate-900 mb-4">2. 不予退款场景</h3>
                    <p className="text-slate-600 mb-4">
                        以下情形不属于退款范围：
                    </p>
                    <ul className="list-disc pl-6 text-slate-600 mb-6 space-y-2">
                        <li>积分已被用于执行 AI 任务（如：生成文章、审计站点、分析竞品），无论您对 AI 生成的内容是否满意。</li>
                        <li>由于用户自身原因（如：填错域名、输入错误关键词）导致的积分消耗。</li>
                        <li>由于第三方平台（如：搜索引擎算法调整、社交媒体策略变更）导致的外部效果不佳。</li>
                    </ul>

                    <h3 className="text-xl font-bold text-slate-900 mb-4">3. 退款流程与响应</h3>
                    <p className="text-slate-600 mb-4">
                        如需申请退款，请发送邮件至 <a href="mailto:support@scaletotop.com" className="text-brand-primary font-bold">support@scaletotop.com</a>，并在邮件中注明您的注册邮箱及支付单号。
                    </p>
                    <p className="text-slate-600 mb-6 font-bold">
                        我们承诺在收到申请后的 3 个工作日内给予初步答复。
                    </p>
                </section>

                <hr className="border-slate-100 my-16" />

                <section className="text-slate-500 bg-slate-50 p-8 rounded-2xl border border-slate-100 italic">
                    <h2 className="text-lg font-bold text-slate-700 mb-4">Appendix: English Summary</h2>
                    <p className="text-sm mb-4">
                        Refunds are only available for technical failures (e.g., payment successful but credits not added, or credits deducted without tool execution due to system bugs).
                    </p>
                    <p className="text-sm mb-4">
                        Credits already consumed for AI tasks (SEO audits, article writing, etc.) are non-refundable regardless of content satisfaction.
                    </p>
                    <p className="text-sm">
                        To request a refund, please contact <span className="font-bold">support@scaletotop.com</span>. We will respond within 3 business days.
                    </p>
                </section>
            </div>
        </div>
    );
}
