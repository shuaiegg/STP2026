import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function MarketGapAnalysis({ marketGap, siteId }: { marketGap: any, siteId: string }) {
    const [selectedGap, setSelectedGap] = useState<any | null>(null);
    const [gapProfile, setGapProfile] = useState<any | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    const handleGapClick = useCallback(async (gap: any) => {
        if (!gap.evidence || gap.evidence.length === 0) return;

        // If clicking the same gap, toggle it off
        if (selectedGap?.topic === gap.topic) {
            setSelectedGap(null);
            setGapProfile(null);
            return;
        }

        setSelectedGap(gap);
        setGapProfile(null);
        setIsLoadingProfile(true);

        try {
            // Fetch profile for the first evidence URL
            const targetUrl = gap.evidence[0];
            const res = await fetch(`/api/dashboard/sites/${siteId}/market-gap/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl })
            });
            const data = await res.json();
            if (data.success) {
                setGapProfile(data.data);
            }
        } catch (e) {
            console.error("Failed to load gap profile", e);
        } finally {
            setIsLoadingProfile(false);
        }
    }, [siteId, selectedGap]);
    if (!marketGap || !marketGap.marketGaps || marketGap.marketGaps.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">市场空白分析 (Market Gaps)</h3>
                <Badge variant="muted" className="border-brand-primary/20 text-brand-primary bg-brand-primary/5">
                    已分析 {marketGap.totalCompetitorsScanned} 个竞品
                </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 border-rose-100 bg-gradient-to-br from-white to-rose-50/30">
                    <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        竞品有的，我们没有的 ({marketGap.marketGaps.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {marketGap.marketGaps.slice(0, 20).map((gap: any, i: number) => (
                            <div key={i} className="group relative">
                                <div className="flex flex-col gap-1 items-start">
                                    <Badge
                                        variant="default"
                                        onClick={() => handleGapClick(gap)}
                                        className={`px-2.5 py-1 flex items-center gap-1 cursor-pointer transition-colors ${selectedGap?.topic === gap.topic
                                                ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                                                : 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50'
                                            }`}
                                    >
                                        {gap.topic}
                                        <span className={`${selectedGap?.topic === gap.topic ? 'text-rose-200' : 'text-rose-400'} ml-0.5 text-[9px] font-bold`}>x{gap.frequency}</span>
                                    </Badge>
                                    {gap.intent && (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider ml-1 px-1 ${selectedGap?.topic === gap.topic ? 'text-rose-500' : 'text-rose-400/80'}`}>
                                            {gap.intent === 'Informational' ? 'ℹ️ 信息' :
                                                gap.intent === 'Commercial' ? '💰 商业' :
                                                    gap.intent === 'Transactional' ? '🛒 转化' : '🧭 导航'}
                                        </span>
                                    )}
                                </div>
                                {/* Hover Tooltip (Disabled for selected) */}
                                {selectedGap?.topic !== gap.topic && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-[240px] z-20">
                                        <div className="bg-slate-900 text-white text-[11px] rounded-xl p-3 shadow-2xl border border-white/10">
                                            <div className="font-bold mb-1 opacity-60 uppercase text-[9px] tracking-widest">核心竞品</div>
                                            <div className="mb-2">{gap.competitors.join(', ')}</div>

                                            {gap.evidence && gap.evidence.length > 0 && (
                                                <div className="space-y-1.5">
                                                    <div className="font-bold opacity-60 uppercase text-[9px] tracking-widest">点击查看深度剖析</div>
                                                    <div className="flex flex-col gap-1">
                                                        {gap.evidence.map((url: string, idx: number) => (
                                                            <div key={idx} className="text-brand-primary truncate block">
                                                                🔗 {url.replace(/^https?:\/\//, '').split('/')[0]}...{url.split('/').pop()}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-3 h-3 bg-slate-900 rotate-45 mx-auto -mt-1.5 border-r border-b border-white/10" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Deep Profile Expansion Pane */}
                    {selectedGap && (
                        <div className="mt-6 p-5 bg-white rounded-xl border border-rose-200 shadow-inner animate-in slide-in-from-top-2">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /><line x1="11" x2="11" y1="8" y2="14" /><line x1="8" x2="14" y1="11" y2="11" /></svg>
                                    竞品深度剖析: {selectedGap.topic}
                                </h5>
                                <button onClick={() => setSelectedGap(null)} className="text-slate-400 hover:text-slate-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </button>
                            </div>

                            {isLoadingProfile ? (
                                <div className="py-8 flex flex-col items-center justify-center space-y-3">
                                    <div className="w-6 h-6 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
                                    <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">正在抓取竞品大纲结构...</span>
                                </div>
                            ) : gapProfile ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-1">内容厚度</div>
                                            <div className="text-lg font-black text-slate-800 tabular-nums">{gapProfile.wordCount.toLocaleString()} <span className="text-xs text-slate-500 font-medium">词</span></div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-1">标题结构</div>
                                            <div className="text-lg font-black text-slate-800 tabular-nums">{gapProfile.headings.length} <span className="text-xs text-slate-500 font-medium">个层级</span></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-2 flex items-center justify-between">
                                            <span>内容结构拆解 (H1 ➡️ H3)</span>
                                            <a href={gapProfile.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary lowercase tracking-normal flex items-center gap-1 hover:underline">
                                                原文出处 <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" /></svg>
                                            </a>
                                        </div>
                                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {gapProfile.headings.length > 0 ? (
                                                <ul className="space-y-1.5 font-mono text-[11px]">
                                                    {gapProfile.headings.map((h: any, i: number) => (
                                                        <li key={i} className={`
                                                            ${h.level === 1 ? 'text-white font-bold pb-2 border-b border-white/10 mb-2' : ''}
                                                            ${h.level === 2 ? 'text-blue-300 ml-2 mt-1.5' : ''}
                                                            ${h.level === 3 ? 'text-slate-400 ml-6' : ''}
                                                        `}>
                                                            <span className="opacity-50 mr-2 text-[9px]">&lt;h{h.level}&gt;</span>
                                                            {h.text}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-slate-500 text-xs text-center py-4">未能提取到清晰的标题结构</p>
                                            )}
                                        </div>
                                    </div>

                                    <button className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-400 cursor-not-allowed rounded-lg py-2.5 text-xs font-bold tracking-widest uppercase transition-colors">
                                        基于此骨架生成文章 (即将推出)
                                    </button>
                                </div>
                            ) : (
                                <div className="text-xs text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">
                                    无法提取该竞品页面的结构数据，可能存在反爬虫限制或页面已被移除。
                                </div>
                            )}
                        </div>
                    )}
                </Card>
                <Card className="p-5 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
                    <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        我们的绝对优势 ({marketGap.ourStrengths.length})
                    </h4>
                    {marketGap.ourStrengths.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {marketGap.ourStrengths.slice(0, 20).map((strength: any, i: number) => (
                                <div key={i} className="flex flex-col gap-1 items-start">
                                    <Badge variant="default" className="bg-white border-emerald-200 text-emerald-700 px-2.5 py-1 cursor-default">
                                        {strength.topic}
                                    </Badge>
                                    {strength.intent && (
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/80 ml-1 px-1">
                                            {strength.intent === 'Informational' ? '信息' : strength.intent}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-emerald-600/60 font-medium">您的特有内容尚未建立，或已被竞品反超。</p>
                    )}
                </Card>
            </div>
        </div>
    );
}
