import React from 'react';
import { Mail, MessageCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function ContactPage() {
    return (
        <div className="bg-brand-surface min-h-[80vh] pt-32 pb-24 px-6">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-brand-text-primary mb-6 italic tracking-tight">
                        联系我们 / <span className="text-brand-primary">Contact Us</span>
                    </h1>
                    <p className="text-lg text-brand-text-secondary font-medium">
                        有任何疑问或技术问题？我们随时为您提供支持。
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="p-8 border-2 border-brand-border bg-white flex flex-col items-center text-center group hover:border-brand-primary/20 transition-all">
                        <div className="w-16 h-16 rounded-2xl bg-brand-primary/5 flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                            <Mail size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-text-primary mb-2">电子邮件 Support</h3>
                        <p className="text-sm text-brand-text-secondary mb-6 font-medium">
                            最直接的沟通方式，适合详细的技术咨询。
                        </p>
                        <a 
                            href="mailto:support@scaletotop.com" 
                            className="text-lg font-black text-brand-primary hover:underline underline-offset-4"
                        >
                            support@scaletotop.com
                        </a>
                    </Card>

                    <Card className="p-8 border-2 border-brand-border bg-white flex flex-col items-center text-center group hover:border-brand-primary/20 transition-all">
                        <div className="w-16 h-16 rounded-2xl bg-brand-secondary/5 flex items-center justify-center text-brand-secondary mb-6 group-hover:scale-110 transition-transform">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-text-primary mb-2">响应时限 Response Time</h3>
                        <p className="text-sm text-brand-text-secondary mb-4 font-medium leading-relaxed">
                            我们承诺在 <span className="text-brand-text-primary font-bold">3 个工作日</span> 内回复您的咨询。
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                            We promise to respond to your inquiries within 3 business days.
                        </p>
                    </Card>
                </div>

                <div className="mt-16 p-8 bg-slate-50 border-2 border-brand-border rounded-3xl">
                    <h4 className="text-sm font-black text-brand-text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MessageCircle size={16} className="text-brand-primary" /> 常见问题
                    </h4>
                    <p className="text-sm text-brand-text-secondary leading-relaxed font-medium">
                        如果您遇到支付成功但积分未到账的情况，请在邮件中附带您的 <span className="text-brand-text-primary font-bold">注册邮箱</span> 和 <span className="text-brand-text-primary font-bold">支付单号</span>，以便我们快速为您补发。
                    </p>
                </div>
            </div>
        </div>
    );
}
