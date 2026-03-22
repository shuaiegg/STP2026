"use client";

import React from 'react';
import { Check, Zap, Shield, Sparkles, TrendingUp, CreditCard, ShoppingCart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

import { CREDIT_PRODUCTS } from '@/lib/billing/products';
import { authClient } from '@/lib/auth-client';

export default function PricingPage() {
    const { data: session } = authClient.useSession();

    const getFeatures = (credits: number) => {
        if (credits === 50) {
            return [
                "50 个 AI 积分",
                "全量市场分析功能",
                "StellarWriter 大师级写作",
                "包含 GEO 实体绑定",
                "永久有效，永不过期",
            ];
        } else if (credits === 130) {
            return [
                "130 个 AI 积分 (单价更优)",
                "包含入门包所有功能",
                "多版本历史快照保存",
                "导出 Markdown/HTML/PDF",
                "优先 AI 生成通道",
            ];
        } else {
            return [
                "300 个 AI 积分 (极致性价比)",
                "包含标准包所有功能",
                "多站点内链智能推荐 (Beta)",
                "竞品内容大纲反向解析",
                "专属 1 对 1 技术支持",
            ];
        }
    };

    const getDescription = (credits: number) => {
        if (credits === 50) return "深度体验营销分析，支持核心 SEO 诊断";
        if (credits === 130) return "高频产出最优选，覆盖多篇深度专业内容";
        return "专业创作方案，为您的业务提供持续增长动力";
    };

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
            <div className="max-w-7xl mx-auto px-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {CREDIT_PRODUCTS.map((pack, i) => (
                        <Card 
                            key={pack.productId} 
                            className={`p-10 flex flex-col border-2 relative transition-all duration-500 hover:translate-y-[-8px] ${
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
                                    {getDescription(pack.credits)}
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
                                    <div className="text-[10px] font-bold text-emerald-600">约 15 积分 / 篇</div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 mb-10">
                                {getFeatures(pack.credits).map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="mt-1 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                            <Check size={10} className="text-emerald-500" strokeWidth={4} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 leading-tight">{feature}</span>
                                    </div>
                                ))}
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
