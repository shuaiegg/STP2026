import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export function OverviewPanel({ siteId, domain }: { siteId: string, domain: string }) {
    const [latestAudit, setLatestAudit] = useState<any>(null);
    const [marketGap, setMarketGap] = useState<any>(null);
    const [competitorCount, setCompetitorCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const [selectedGap, setSelectedGap] = useState<any | null>(null);
    const [gapProfile, setGapProfile] = useState<any | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    const handleGapClick = useCallback(async (gap: any) => {
        if (!gap.evidence || gap.evidence.length === 0) return;

        if (selectedGap?.topic === gap.topic) {
            setSelectedGap(null);
            setGapProfile(null);
            return;
        }

        setSelectedGap(gap);
        setGapProfile(null);
        setIsLoadingProfile(true);

        try {
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [auditsRes, gapRes, compRes] = await Promise.all([
                fetch(`/api/dashboard/sites/${siteId}/audits`),
                fetch(`/api/dashboard/sites/${siteId}/market-gap`),
                fetch(`/api/dashboard/sites/${siteId}/competitors`)
            ]);

            const auditsData = await auditsRes.json();
            const gapData = await gapRes.json();
            const compData = await compRes.json();

            if (auditsData.audits && auditsData.audits.length > 0) {
                setLatestAudit(auditsData.audits[0]);
            }
            if (gapData.success) {
                setMarketGap(gapData.data);
            }
            if (compData.success) {
                setCompetitorCount(compData.competitors.length);
            }
        } catch (e) {
            console.error('Failed to load overview data:', e);
        } finally {
            setLoading(false);
        }
    }, [siteId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="p-12 pl-6 pb-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-3"></div>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">正在聚合全域情报...</p>
            </div>
        );
    }

    if (!latestAudit) {
        return (
            <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[400px] border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl opacity-80">🔭</span>
                </div>
                <h3 className="text-slate-900 font-semibold mb-2 text-lg">开启第一次站点探测</h3>
                <p className="text-sm text-slate-500 max-w-sm mb-6">
                    我们还需要对您的站点进行初步扫描，以生成初始星图和提取核心话题结构。
                </p>
                <Link href={`/dashboard/site-intelligence/instant-audit?site=${encodeURIComponent(domain)}`}>
                    <button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm px-6 py-2.5 font-bold transition-all flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="21.17" x2="12" y1="8" y2="8" /><line x1="3.95" x2="8.58" y1="6.06" y2="14" /><line x1="10.88" x2="15.46" y1="21.94" y2="14" /></svg>
                        立即发射探测站
                    </button>
                </Link>
            </Card>
        );
    }

    const techScore = latestAudit.techScore || 0;
    const isScoreGood = techScore >= 80;
    const isScoreWarn = techScore >= 50 && techScore < 80;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tech Score Widget */}
                <Card className="p-6 flex flex-col justify-between border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isScoreGood ? 'bg-emerald-500' : isScoreWarn ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                            最新健康度
                        </h4>
                    </div>
                    <div className="mt-4 flex items-end gap-3">
                        <div className={`text-5xl font-extrabold tracking-tight tabular-nums ${isScoreGood ? 'text-emerald-600' : isScoreWarn ? 'text-amber-600' : 'text-rose-600'}`}>
                            {techScore}
                        </div>
                        <div className="mb-1 text-sm font-medium text-slate-500">/ 100</div>
                    </div>
                    <div className="mt-4 text-[11px] text-slate-500 font-medium">
                        基于最后一次扫描的平均加载响应计算。
                    </div>
                </Card>

                {/* Scope Widget */}
                <Card className="p-6 flex flex-col justify-between border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            版图结构
                        </h4>
                    </div>
                    <div className="mt-4">
                        <div className="text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                            {latestAudit.pageCount} <span className="text-lg text-slate-400 font-medium">个页面</span>
                        </div>
                    </div>
                    <div className="mt-4 text-[11px] text-slate-500 font-medium flex items-center gap-2">
                        更新于 {new Date(latestAudit.createdAt).toLocaleDateString()}
                    </div>
                </Card>

                {/* Competitors Widget */}
                <Card className="p-6 flex flex-col justify-between border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            视野内对手
                        </h4>
                    </div>
                    <div className="mt-4">
                        <div className="text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                            {competitorCount} <span className="text-lg text-slate-400 font-medium">/ 5 排列</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Link href="#competitors" onClick={() => (document.querySelector('button[aria-label="竞争对手追踪"]') as HTMLElement)?.click()}>
                            <span className="text-[11px] text-brand-primary font-bold hover:underline">
                                管理追踪列表 &rarr;
                            </span>
                        </Link>
                    </div>
                </Card>
            </div>

            {/* Strategic Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                {/* Our Strengths */}
                <Card className="p-6 border-emerald-100 bg-emerald-50/20 shadow-sm">
                    <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2 mb-4">
                        核心优势集群 (Our Strengths)
                    </h3>
                    {marketGap?.ourStrengths?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {marketGap.ourStrengths.slice(0, 15).map((topic: any, i: number) => (
                                <Badge key={i} variant="default" className="bg-white border-emerald-200 text-emerald-700 shadow-sm cursor-default">
                                    {topic.topic}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500">星图中尚未发现密集的内容集群。试着丰富您的网站内容或者重新扫描。</p>
                    )}
                </Card>

                {/* Top Market Gaps */}
                <Card className="p-6 border-rose-100 bg-rose-50/20 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                            高优市场空白 (Top Market Gaps)
                        </h3>
                        {marketGap?.marketGaps?.length > 0 && (
                            <Badge variant="muted" className="bg-white border-rose-200 text-rose-600 text-[10px]">
                                发现 {marketGap.marketGaps.length} 个缺口
                            </Badge>
                        )}
                    </div>

                    {marketGap?.marketGaps?.length > 0 ? (
                        <div className="space-y-3 flex-1">
                            {marketGap.marketGaps.slice(0, 5).map((gap: any, i: number) => (
                                <div key={i} className="flex flex-col gap-2">
                                    <div
                                        className={`flex items-center justify-between p-3 rounded-xl border shadow-sm transition-all cursor-pointer ${selectedGap?.topic === gap.topic
                                            ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-200'
                                            : 'bg-white border-rose-100 hover:border-rose-300'
                                            }`}
                                        onClick={() => handleGapClick(gap)}
                                    >
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                {gap.topic}
                                                <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">频率: {gap.frequency}</span>
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                对手: {gap.competitors.slice(0, 2).join(', ')}{gap.competitors.length > 2 ? '等' : ''}
                                            </p>
                                        </div>
                                        <button className="text-rose-500 opacity-60 hover:opacity-100 transition-opacity">
                                            {selectedGap?.topic === gap.topic ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                            )}
                                        </button>
                                    </div>

                                    {/* Inline Expansion Pane */}
                                    {selectedGap?.topic === gap.topic && (
                                        <div className="mx-2 mb-2 p-4 bg-white rounded-lg border border-rose-100 shadow-inner animate-in slide-in-from-top-1">
                                            {isLoadingProfile ? (
                                                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                                                    <div className="w-5 h-5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
                                                    <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">解构竞品框架...</span>
                                                </div>
                                            ) : gapProfile ? (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                                            <div className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">词数</div>
                                                            <div className="text-sm font-black text-slate-700">{gapProfile.wordCount.toLocaleString()}</div>
                                                        </div>
                                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                                            <div className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">层级</div>
                                                            <div className="text-sm font-black text-slate-700">{gapProfile.headings.length}</div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-slate-900 rounded p-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                                                        {gapProfile.headings.length > 0 ? (
                                                            <ul className="space-y-1 font-mono text-[10px]">
                                                                {gapProfile.headings.map((h: any, i: number) => (
                                                                    <li key={i} className={`
                                                                        ${h.level === 1 ? 'text-white font-bold pb-1' : ''}
                                                                        ${h.level === 2 ? 'text-blue-300 ml-1.5' : ''}
                                                                        ${h.level === 3 ? 'text-slate-400 ml-4' : ''}
                                                                    `}>
                                                                        <span className="opacity-40 mr-1.5 scale-75 inline-block">&lt;h{h.level}&gt;</span>
                                                                        {h.text}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-slate-500 text-[10px] text-center">无清晰标题结构</p>
                                                        )}
                                                    </div>
                                                    <button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 text-[10px] font-bold tracking-widest uppercase transition-colors">
                                                        进入智能写手 ⚡
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-rose-500 bg-rose-50/50 p-2 rounded">
                                                    抓取失败，该页面可能受反爬虫保护。
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 flex-1">
                            {competitorCount > 0
                                ? "在当前跟踪的竞品中，尚未发现明显的市场空白。可能是您的内容已全方位覆盖，或者竞品不够激进。"
                                : "请先添加竞争对手，系统才能扫描并对比出您的市场空白。"}
                        </p>
                    )}
                </Card>
            </div>
        </div>
    );
}
