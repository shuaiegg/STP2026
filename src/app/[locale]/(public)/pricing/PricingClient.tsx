"use client";

import React, { useEffect } from 'react';
import { Check, Zap, CreditCard, ShoppingCart, Info, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import posthog from 'posthog-js';

import { CREDIT_PRODUCTS } from '@/lib/billing/products';
import { useSessionContext } from "@/components/providers/SessionProvider";

export default function PricingClient() {
    const t = useTranslations('pricing');
    const { session } = useSessionContext();

    useEffect(() => {
        posthog.capture('pricing_viewed');
    }, []);

    const getValueProp = (credits: number) => {
        if (credits === 50) return t('valueProp50');
        if (credits === 130) return t('valueProp130');
        if (credits === 300) return t('valueProp300');
        return "";
    };

    const features = t.raw('features') as string[];
    const costReferences = t.raw('costRefs') as { name: string; cost: string; desc: string }[];

    // 登录后导向 dashboard（无 locale 前缀），未登录导向公开注册页（locale 感知）
    const CtaLink: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) =>
        session
            ? <NextLink href="/dashboard/billing" className={className}>{children}</NextLink>
            : <Link href="/register" className={className}>{children}</Link>;

    return (
        <div className="bg-brand-surface min-h-screen">
            {/* Header section */}
            <div className="max-w-7xl mx-auto pt-24 pb-16 px-6 text-center">
                <Badge className="mb-6 bg-brand-secondary/20 text-brand-secondary border-brand-secondary/30 px-4 py-1.5 font-black uppercase tracking-widest text-xs">
                    STP Credit Store
                </Badge>
                <h1 className="font-display text-5xl md:text-6xl font-black text-brand-text-primary mb-6 italic leading-tight">
                    {t('heroTitle1')}<span className="text-brand-primary">{t('heroTitle2')}</span>
                </h1>
                <p className="text-xl text-brand-text-secondary max-w-2xl mx-auto leading-relaxed">
                    {t('heroSubtitle')}
                </p>
            </div>

            {/* Packs Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {CREDIT_PRODUCTS.map((pack) => (
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
                                    {t('recommended')}
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-black text-brand-text-primary mb-2 uppercase tracking-tight">{pack.label}</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-4xl font-black text-brand-text-primary font-display">${pack.price}</span>
                                    <span className="text-slate-400 font-bold text-sm">{t('oneTime')}</span>
                                </div>
                                <p className="text-xs text-brand-text-secondary leading-relaxed h-12 font-medium">
                                    {pack.recommended ? t('packDescRecommended') : t('packDesc')}
                                </p>
                            </div>

                            <div className="mb-10 p-6 bg-brand-primary/5 rounded-2xl border-2 border-brand-primary/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Zap size={24} className="text-brand-secondary fill-brand-secondary" />
                                    <div>
                                        <div className="text-3xl font-black text-brand-text-primary font-mono">{pack.credits}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('creditsLabel')}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-emerald-600">{t('perCredit', { value: (pack.price/pack.credits).toFixed(2) })}</div>
                                </div>
                            </div>

                            <div className="flex-1 space-y-6 mb-10">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-brand-primary" /> {t('valueEstimate')}
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 leading-relaxed">
                                        {getValueProp(pack.credits)}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className="mt-1 w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                <Check size={10} className="text-emerald-500" strokeWidth={4} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 leading-tight">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <CtaLink className="block mt-auto">
                                <Button
                                    variant={pack.recommended ? "primary" : "outline"}
                                    className={`w-full py-6 font-black uppercase tracking-widest text-xs border-2 flex gap-2 ${
                                        pack.recommended
                                        ? 'bg-brand-primary text-white border-brand-primary shadow-xl shadow-brand-primary/20'
                                        : 'bg-white text-brand-text-primary border-brand-border-heavy hover:bg-slate-50'
                                    }`}
                                    onClick={() => posthog.capture('pricing_plan_selected', {
                                        plan: pack.label,
                                        credits: pack.credits,
                                        price: pack.price,
                                    })}
                                >
                                    <ShoppingCart size={14} />
                                    {t('buyNow')}
                                </Button>
                            </CtaLink>
                        </Card>
                    ))}
                </div>

                {/* Credit Cost Reference Section */}
                <div className="mt-24 max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl font-black text-brand-text-primary italic mb-4 uppercase tracking-tight">{t('costRefTitle')}</h2>
                        <p className="text-sm text-brand-text-secondary font-medium italic">
                            {t('costRefSubtitle')}
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
                                {t('costNote')}
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
                            <h4 className="text-lg font-black text-brand-text-primary uppercase italic">{t('paymentTitle')}</h4>
                            <p className="text-sm text-brand-text-secondary font-medium">{t('paymentDesc')}</p>
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
