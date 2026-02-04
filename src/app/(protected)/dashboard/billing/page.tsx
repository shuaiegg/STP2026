import React from 'react';
import { Construction, ArrowLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function ComingSoon() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mb-8 animate-pulse">
                <CreditCard size={40} />
            </div>
            <h1 className="text-4xl font-black text-brand-text-primary mb-4 font-display italic">账单系统建设中...</h1>
            <p className="text-brand-text-secondary max-w-md mb-10 leading-relaxed">
                我们正在对接 Creem.io 支付接口。阿拉丁正在后台为您核对每一分钱的产出，敬请期待！
            </p>
            <Link href="/dashboard">
                <Button className="font-bold px-8 py-6 shadow-lg">
                    <CreditCard className="mr-2" size={18} /> 返回控制台
                </Button>
            </Link>
        </div>
    );
}
