"use client";

import React from 'react';
import { Check, Zap, CreditCard, ShoppingCart, Info, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

import { CREDIT_PRODUCTS } from '@/lib/billing/products';
import { authClient } from '@/lib/auth-client';

export default function PricingClient() {
    const { data: session } = authClient.useSession();

    const getValueProp = (credits: number) => {
        if (credits === 50) return "可完成约 3 篇深度内容创作 或 10 次站点体检";
        if (credits === 130) return "可完成约 8 篇深度内容创作 或 26 次站点体检";
        if (credits === 300) return "可完成约 20 篇深度内容创作 或 60 次站点体检";
        return "";
    };

    const costReferences = [
        { name: "StellarWriter 智作", cost: "15 积分 / 篇", desc: "AI 驱动的深度内容生成与 SEO 优化" },
        { name: "站点 SEO 体检", cost: "5 积分 / 次", desc: "全站技术 SEO 扫描与可视化星图审计" },
        { name: "关键词数据调研", cost: "按需而定", desc: "即将上线：深度利基市场关键词分析" },
    ];

    return (
        <div className="bg-brand-surface min-h-screen">
            {/* Header section */}
            <div className="max-w-7xl mx-auto pt-24 pb-16 px-6 text-center">
                <Badge className="mb-6 bg-brand-secondary/20 text-brand-secondary border-brand-secondary/30 px-4 py-1.5 font-black uppercase tracking-widest text-xs">
                    STP Credit Store
                </Badge>
                <h1 className="font-display text-5xl md:text-6xl font-black text-brand-text-primary mb-6 italic leading-tight">
                    按需充值，<span className="text-brand-primary">即买即用</span>
                </h1>
                <p className="text-xl text-brand-text-secondary max-w-2xl mx-auto leading-relaxed">
                    无需订阅。$9 美金开启您的全网数据驱动的 AI 写作引擎。
                </p>
            </div>

            {/* Packs Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {CREDIT_PRODUCTS.map((pack, i) => (
                        <Card 
                            key={pack.productId} 
                            className={`p-10 flex flex-col border-2 relative transition-all duration-500 hover:translate-y-[-8px] overflow-visible ${
                                pack.recommended 
                                ? 'border-brand-primary bg-white shadow-[24px_24px_0_0_rgba(151,71,255,0.05)]' 
                                : 'border-brand-border bg-white'
                            }`}
                        >
                            {pack.recommended && (
                                <div className="absolute top-0 right-10 transform -translate-y-1/2 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                                    推荐
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-black text-brand-text-primary mb-2 uppercase tracking-tight">{pack.label}</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-black text-brand-text-primary font-display">${pack.price}</span>
                                    <span className="text-slate-400 font-bold text-sm">/ 一次性充值</span>
                                </div>
                                <p className="text-xs text-brand-text-secondary leading-relaxed h-12 font-medium">
                                    {pack.recommended ? "最高性价比之选，支撑持续的增长实验" : "灵活充值，随时启动您的创作流程"}
                                </p>
                            </div>

                            <div className="mb-10 p-6 bg-brand-primary/5 rounded-2xl border-2 border-brand-primary/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Zap size={24} className="text-brand-secondary fill-brand-secondary" />
                                    <div>
                                        <div className="text-3xl font-black text-brand-text-primary font-mono">{pack.credits}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI 积分</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-emerald-600">约 ${(pack.price/pack.credits).toFixed(2)} / 积分</div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-6 mb-10">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-brand-primary" /> 价值预估
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                        {getValueProp(pack.credits)}
                                    </p>
                                </div>
                                
                                <div className="space-y-3">
                                    {[
                                        "解锁所有 AI 营销工具",
                                        "全量数据分析权限",
                                        "永久有效，永不过期",
                                        "积分余额实时可查"
                                    ].map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className="mt-1 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                <Check size={10} className="text-emerald-500" strokeWidth={4} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 leading-tight">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Link href={session ? "/dashboard/billing" : "/register"} className="block mt-auto">
                                <Button 
                                    variant={pack.recommended ? "primary" : "outline"}
                                    className={`w-full py-6 font-black uppercase tracking-widest text-xs border-2 flex gap-2 ${
                                        pack.recommended 
                                        ? 'bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/20' 
                                        : 'bg-white text-brand-text-primary border-brand-border-heavy hover:bg-slate-50'
                                    }`}
                                >
                                    <ShoppingCart size={14} />
                                    立即购买
                                </Button>
                            </Link>
                        </Card>
                    ))}
                </div>

                {/* Credit Cost Reference Section */}
                <div className="mt-24 max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-black text-brand-text-primary italic mb-4 uppercase tracking-tight">积分消耗参考</h2>
                        <p className="text-sm text-brand-text-secondary font-medium italic">
                            透明消费，所有功能对所有积分持有者平等开放
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {costReferences.map((ref, idx) => (
                            <div key={idx} className="p-6 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-between group hover:border-brand-primary/20 transition-all">
                                <div>
                                    <h4 className="text-sm font-black text-brand-text-primary mb-1">{ref.name}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium">{ref.desc}</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 bg-brand-primary/5 text-brand-primary text-[10px] font-black rounded-full border border-brand-primary/10 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                        {ref.cost}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div className="p-6 bg-brand-secondary/5 border-2 border-dashed border-brand-secondary/20 rounded-2xl flex items-center gap-4">
                            <Info size={20} className="text-brand-secondary shrink-0" />
                            <p className="text-[10px] text-brand-secondary font-bold leading-relaxed">
                                注：StellarWriter 消耗取决于内容长度与复杂度，15 积分为单次生成平均参考值。
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer trust badges */}
                <div className="mt-20 p-8 border-2 border-brand-border bg-slate-50 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white border-2 border-brand-border flex items-center justify-center text-brand-primary shadow-sm">
                            <CreditCard size={32} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-brand-text-primary uppercase italic">支持支付宝与全球主流支付</h4>
                            <p className="text-sm text-brand-text-secondary font-medium">通过 Creem 安全处理。中国用户支持支付宝扫码，按实时汇率折算。</p>
                        </div>
                    </div>
                    <div className="flex gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <div className="px-4 py-2 bg-white border border-brand-border rounded-lg font-bold text-[10px]">ALIPAY</div>
                        <div className="px-4 py-2 bg-white border border-brand-border rounded-lg font-bold text-[10px]">VISA</div>
                        <div className="px-4 py-2 bg-white border border-brand-border rounded-lg font-bold text-[10px]">MASTERCARD</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
