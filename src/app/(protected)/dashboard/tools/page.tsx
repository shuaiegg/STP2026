"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
import { useSessionContext } from "@/components/providers/SessionProvider";
import Link from 'next/link';

const tools = [
    {
        id: 'geo-writer',
        icon: Zap,
        href: '/tools/geo-writer',
        credits: 15,           // fallback
        skillName: 'GEO_WRITER_FULL',
        status: 'ACTIVE'
    },
    {
        id: 'keyword-recon',
        icon: Search,
        href: '#',
        credits: 10,
        skillName: null,
        status: 'BETA'
    },
    {
        id: 'serp-optimizer',
        icon: BarChart3,
        href: '#',
        credits: 20,
        skillName: null,
        status: 'COMING_SOON'
    },
    {
        id: 'auto-i18n',
        icon: Languages,
        href: '#',
        credits: 15,
        skillName: null,
        status: 'COMING_SOON'
    }
];

export default function MarketingToolsPage() {
    const t = useTranslations('dashboard.tools');
    const toolItems = t.raw('items') as { name: string; description: string; category: string }[];
    const { session } = useSessionContext();
    const currentCredits = Number((session?.user as any)?.credits || 0);
    const [skillCosts, setSkillCosts] = useState<Record<string, number>>({});

    useEffect(() => {
        fetch('/api/skills/list')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.skills) {
                    const costs: Record<string, number> = {};
                    data.skills.forEach((s: any) => {
                        if (s.name && s.cost) costs[s.name] = s.cost;
                    });
                    setSkillCosts(costs);
                }
            })
            .catch(() => {}); // silent fallback to hardcoded values
    }, []);

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div>
                <h1 className="font-display text-4xl font-black text-brand-text-primary italic leading-none mb-4">{t('title')}</h1>
                <p className="text-brand-text-secondary font-medium">{t('subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {tools.map((toolDef, index) => {
                    const tool = { ...toolDef, ...toolItems[index] };
                    const Icon = tool.icon;
                    const isActive = tool.status === 'ACTIVE';
                    const cost = Number((tool.skillName && skillCosts[tool.skillName]) ?? tool.credits);
                    const hasEnoughCredits = currentCredits >= cost;
                    
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
                                        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${hasEnoughCredits || !isActive ? 'text-brand-secondary' : 'text-red-500'}`}>
                                            <Sparkles size={12} />
                                            {t('costCredits', { cost })}
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
                                hasEnoughCredits ? (
                                    <Link href={tool.href}>
                                        <Button className="w-full h-12 bg-brand-primary text-white font-black border-2 border-black shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 group/btn">
                                            {t('openTool')} <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href="/dashboard/billing">
                                        <Button className="w-full h-12 bg-amber-600 text-white font-black border-2 border-black shadow-[4px_4px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 group/btn">
                                            {t('insufficient')} <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                )
                            ) : (
                                <Button disabled className="w-full h-12 bg-slate-100 text-slate-400 font-black border-2 border-slate-200 cursor-not-allowed">
                                    {t('comingSoon')}
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
                <h4 className="text-lg font-black text-brand-text-primary mb-2">{t('customTitle')}</h4>
                <p className="text-sm text-brand-text-secondary font-medium mb-6">
                    {t('customDesc')}
                </p>
            </div>
        </div>
    );
}
