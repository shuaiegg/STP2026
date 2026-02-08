"use client";

import React from 'react';
import { 
    Zap, 
    FileText, 
    Search, 
    Sparkles, 
    ArrowRight,
    MousePointer2,
    BarChart3,
    Languages,
    Plus
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

const tools = [
    {
        id: 'geo-writer',
        name: 'StellarWriter (智作)',
        description: '基于全网竞争数据与 SEO 策略的内容生产引擎，支持 GEO 增益与多维大纲生成。',
        icon: Zap,
        href: '/tools/geo-writer',
        credits: 35,
        category: '内容创作',
        status: 'ACTIVE'
    },
    {
        id: 'keyword-recon',
        name: '关键词情报侦察',
        description: '深度挖掘利基市场关键词，分析搜索量、竞争难度与流量潜力。',
        icon: Search,
        href: '#',
        credits: 10,
        category: '市场研究',
        status: 'BETA'
    },
    {
        id: 'serp-optimizer',
        name: 'SERP 排名优化器',
        description: '分析特定页面的排名表现，提供针对性的内容修正与权重提升建议。',
        icon: BarChart3,
        href: '#',
        credits: 20,
        category: 'SEO 诊断',
        status: 'COMING_SOON'
    },
    {
        id: 'auto-i18n',
        name: '多语言本地化',
        description: '将您的内容库一键翻译为多国语言，并保留原有的 SEO 权重与排版格式。',
        icon: Languages,
        href: '#',
        credits: 15,
        category: '全球化',
        status: 'COMING_SOON'
    }
];

export default function MarketingToolsPage() {
    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div>
                <h1 className="font-display text-4xl font-black text-brand-text-primary italic leading-none mb-4">营销工具箱</h1>
                <p className="text-brand-text-secondary font-medium">选择合适的专业工具，开始您的数字化增长实验。</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = tool.status === 'ACTIVE';
                    
                    return (
                        <Card 
                            key={tool.id} 
                            className={`p-8 border-2 bg-white transition-all flex flex-col justify-between group ${
                                isActive 
                                ? 'border-slate-100 hover:border-brand-primary/30 hover:shadow-xl hover:shadow-brand-primary/5' 
                                : 'border-slate-50 opacity-80'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                                        isActive ? 'bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary group-hover:text-white' : 'bg-slate-50 text-slate-300'
                                    }`}>
                                        <Icon size={28} />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {tool.status === 'BETA' && (
                                            <Badge className="bg-amber-50 text-amber-600 border-amber-100 font-black text-[9px] uppercase tracking-widest">Internal Beta</Badge>
                                        )}
                                        {tool.status === 'COMING_SOON' && (
                                            <Badge className="bg-slate-50 text-slate-400 border-slate-100 font-black text-[9px] uppercase tracking-widest">Coming Soon</Badge>
                                        )}
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-brand-secondary uppercase tracking-widest">
                                            <Sparkles size={12} />
                                            需 {tool.credits} 积分
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 mb-8">
                                    <h3 className="text-xl font-black text-brand-text-primary font-display group-hover:text-brand-primary transition-colors">{tool.name}</h3>
                                    <p className="text-sm text-brand-text-secondary leading-relaxed font-medium">
                                        {tool.description}
                                    </p>
                                </div>
                            </div>

                            {isActive ? (
                                <Link href={tool.href}>
                                    <Button className="w-full h-12 bg-brand-primary text-white font-black border-2 border-black shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 group/btn">
                                        立即开启工具 <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            ) : (
                                <Button disabled className="w-full h-12 bg-slate-100 text-slate-400 font-black border-2 border-slate-200 cursor-not-allowed">
                                    即将上线
                                </Button>
                            )}
                        </Card>
                    );
                })}
            </div>
            
            <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50 flex flex-col items-center text-center max-w-2xl mx-auto">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-300 mb-4">
                    <Plus size={24} />
                </div>
                <h4 className="text-lg font-black text-brand-text-primary mb-2">需要更多定制工具？</h4>
                <p className="text-sm text-brand-text-secondary font-medium mb-6">
                    杰克，如果你有其他的增长灵感，可以在“神灯”里直接告诉我，我会为你即时建模并集成到这里。
                </p>
            </div>
        </div>
    );
}
