'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CREDIT_PRODUCTS } from '@/lib/billing/products';
import { Check, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

export function BillingClient() {
    const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('success') === '1') {
            toast.success('支付成功！积分将在几分钟内到账');
        }
    }, [searchParams]);

    const handleCheckout = async (productId: string) => {
        setLoadingProductId(productId);
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId }),
            });
            const data = await res.json();
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                toast.error(data.error || '创建订单失败');
            }
        } catch (error) {
            toast.error('网络请求失败');
        } finally {
            setLoadingProductId(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {CREDIT_PRODUCTS.map((product) => (
                <Card key={product.productId} className={`relative overflow-hidden flex flex-col p-6 h-full transition-all duration-300 ${product.recommended ? 'ring-2 ring-brand-primary shadow-xl scale-105 z-10' : 'hover:shadow-md'}`}>
                    {product.recommended && (
                        <div className="absolute top-0 right-0">
                            <div className="bg-brand-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                                推荐
                            </div>
                        </div>
                    )}
                    
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{product.label}</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-slate-900">{product.credits}</span>
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-tight">积分</span>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8 flex-grow">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>永久有效，不限时间</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>解锁所有 AI 工具</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>单价: ${(product.price / product.credits).toFixed(3)} / 积分</span>
                        </div>
                        {product.credits > 50 && (
                            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md inline-flex w-fit">
                                <Zap className="w-3 h-3 fill-current" />
                                <span>省 {Math.round((1 - (product.price / product.credits) / (9 / 50)) * 100)}%</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-100">
                        <div className="text-2xl font-bold text-slate-900 mb-4 text-center">
                            ${product.price}
                        </div>
                        <Button 
                            className={`w-full py-6 font-bold text-base ${product.recommended ? 'bg-brand-primary hover:bg-brand-primary/90' : 'bg-slate-900 hover:bg-slate-800'}`}
                            onClick={() => handleCheckout(product.productId)}
                            disabled={loadingProductId !== null}
                        >
                            {loadingProductId === product.productId ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                '立即购买'
                            )}
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}
