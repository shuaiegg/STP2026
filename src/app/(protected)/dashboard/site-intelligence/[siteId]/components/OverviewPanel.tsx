import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { IntegrationGuidanceCard } from '@/components/dashboard/IntegrationGuidanceCard';
import { Zap, ChevronRight, TrendingUp, Search, BarChart2 } from 'lucide-react';

interface OverviewPanelProps {
  siteId: string;
  domain: string;
  hasGsc: boolean;
  hasGa4: boolean;
  hasContentPlan: boolean;
  onSwitchTab?: (tab: string) => void;
}

export function OverviewPanel({ 
  siteId, 
  domain, 
  hasGsc, 
  hasGa4, 
  hasContentPlan, 
  onSwitchTab 
}: OverviewPanelProps) {
    const [latestAudit, setLatestAudit] = useState<any>(null);
    const [semanticData, setSemanticData] = useState<any>(null);
    const [competitorCount, setCompetitorCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [isExtractingDNA, setIsExtractingDNA] = useState(false);
    const [siteData, setSiteData] = useState<any>(null);

    const [selectedDebt, setSelectedDebt] = useState<any | null>(null);

    const handleDebtClick = useCallback((debt: any) => {
        if (selectedDebt?.topic === debt.topic) {
            setSelectedDebt(null);
            return;
        }
        setSelectedDebt(debt);
    }, [selectedDebt]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [auditsRes, gapRes, compRes, siteRes] = await Promise.all([
                fetch(`/api/dashboard/sites/${siteId}/audits`),
                fetch(`/api/dashboard/sites/${siteId}/semantic-gap`),
                fetch(`/api/dashboard/sites/${siteId}/competitors`),
                fetch(`/api/dashboard/sites/${siteId}`)
            ]);

            const auditsData = await auditsRes.json();
            const semanticResData = await gapRes.json();
            const compData = await compRes.json();
            const siteDataJson = await siteRes.json();

            if (auditsData.audits && auditsData.audits.length > 0) {
                setLatestAudit(auditsData.audits[0]);
            }
            if (semanticResData.success) {
                setSemanticData(semanticResData.data);
            }
            if (compData.success) {
                setCompetitorCount(compData.competitors.length);
            }
            if (siteDataJson.success) {
                setSiteData(siteDataJson.site);
            }
        } catch (e) {
            console.error('Failed to load overview data:', e);
        } finally {
            setLoading(false);
        }
    }, [siteId]);

    const handleExtractDNA = useCallback(async () => {
        setIsExtractingDNA(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/ontology`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                await fetchData();
            } else {
                alert(data.error || "提取业务DNA失败");
            }
        } catch (error) {
            console.error(error);
            alert("发生错误");
        } finally {
            setIsExtractingDNA(false);
        }
    }, [siteId, fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[180px] bg-white border border-slate-100 rounded-2xl shadow-sm" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-[400px] bg-white border border-slate-100 rounded-2xl shadow-sm" />
                    <div className="h-[400px] bg-white border border-slate-100 rounded-2xl shadow-sm" />
                </div>
            </div>
        );
    }

    const techScore = latestAudit?.techScore || 0;
    const isScoreGood = techScore >= 80;
    const isScoreWarn = techScore >= 50 && techScore < 80;

    return (
        <div className="space-y-8">
            {/* Top Row: Core Metrics & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Health Score Card */}
                <Card className="p-6 border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isScoreGood ? 'bg-emerald-500' : isScoreWarn ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                            全站健康得分
                        </h4>
                        <div className="flex items-baseline gap-2 pt-2">
                            <span className={`text-5xl font-black font-display italic tracking-tighter ${isScoreGood ? 'text-emerald-600' : isScoreWarn ? 'text-amber-600' : 'text-rose-600'}`}>
                                {techScore}
                            </span>
                            <span className="text-sm font-bold text-slate-300">/ 100</span>
                        </div>
                    </div>
                    <p className="mt-4 text-[11px] text-slate-500 font-medium">
                        基于星图扫描的技术 SEO 指标计算得出。
                    </p>
                </Card>

                {/* Page Count Card */}
                <Card className="p-6 border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">版图页面规模</h4>
                        <div className="flex items-baseline gap-2 pt-2">
                            <span className="text-5xl font-black font-display italic tracking-tighter text-slate-900">
                                {latestAudit?.pageCount || 0}
                            </span>
                            <span className="text-sm font-bold text-slate-300">PAGES</span>
                        </div>
                    </div>
                    <p className="mt-4 text-[11px] text-slate-500 font-medium">
                        已在星图中探明的有效 URL 节点。
                    </p>
                </Card>

                {/* Competitors Card */}
                <Card className="p-6 border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已追踪竞争对手</h4>
                        <div className="flex items-baseline gap-2 pt-2">
                            <span className="text-5xl font-black font-display italic tracking-tighter text-slate-900">
                                {competitorCount}
                            </span>
                            <span className="text-sm font-bold text-slate-300">/ 5 MAX</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => onSwitchTab?.('competitors')}
                        className="mt-4 flex items-center text-[11px] font-black text-brand-primary uppercase tracking-widest hover:gap-2 transition-all"
                    >
                        管理追踪列表 <ChevronRight size={14} className="ml-1" />
                    </button>
                </Card>
            </div>

            {/* Adaptive Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Data Insights */}
                <div className="space-y-8">
                    {/* Keywords Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Search size={16} className="text-brand-primary" /> 关键词表现
                            </h3>
                            {hasGsc && (
                                <button onClick={() => onSwitchTab?.('performance')} className="text-[10px] font-black text-brand-primary uppercase">查看大盘 &rarr;</button>
                            )}
                        </div>
                        {hasGsc ? (
                            <Card className="p-6 bg-white border-slate-200 shadow-sm h-64 flex items-center justify-center text-slate-400 italic text-sm">
                                [ 关键词趋势组件待集成 ]
                            </Card>
                        ) : (
                            <IntegrationGuidanceCard type="gsc" href={`/dashboard/site-intelligence/${siteId}#integrations`} />
                        )}
                    </div>

                    {/* Traffic Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <BarChart2 size={16} className="text-brand-primary" /> 流量趋势
                            </h3>
                            {hasGa4 && (
                                <button onClick={() => onSwitchTab?.('traffic')} className="text-[10px] font-black text-brand-primary uppercase">查看详情 &rarr;</button>
                            )}
                        </div>
                        {hasGa4 ? (
                            <Card className="p-6 bg-white border-slate-200 shadow-sm h-64 flex items-center justify-center text-slate-400 italic text-sm">
                                [ GA4 流量组件待集成 ]
                            </Card>
                        ) : (
                            <IntegrationGuidanceCard type="ga4" href={`/dashboard/site-intelligence/${siteId}#integrations`} />
                        )}
                    </div>
                </div>

                {/* Right Column: Strategic Insights */}
                <div className="space-y-8">
                    {/* Content Plan Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={16} className="text-brand-primary" /> 内容执行进度
                            </h3>
                            {hasContentPlan && (
                                <button onClick={() => onSwitchTab?.('strategy')} className="text-[10px] font-black text-brand-primary uppercase">进入工作台 &rarr;</button>
                            )}
                        </div>
                        {hasContentPlan ? (
                            <div className="space-y-4">
                                {semanticData?.ontology ? (
                                    <Card className="p-6 bg-indigo-50/30 border-indigo-100 shadow-sm">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">核心业务 DNA</h4>
                                        <div className="space-y-3">
                                            <p className="text-xs text-indigo-900 leading-relaxed font-bold">
                                                {semanticData.ontology.coreOfferings?.slice(0, 3).join(" • ")}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {semanticData.ourStrengths?.slice(0, 5).map((topic: any, i: number) => (
                                                    <Badge key={i} variant="default" className="bg-white border-indigo-200 text-indigo-700 shadow-sm">
                                                        {topic.topic}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </Card>
                                ) : (
                                    <Card className="p-6 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3 py-12">
                                        <p className="text-xs text-slate-500">已开启计划，建议提取业务 DNA 以优化策略</p>
                                        <button onClick={handleExtractDNA} disabled={isExtractingDNA} className="bg-slate-900 text-white rounded-xl px-4 py-2 text-[11px] font-black uppercase">立即提取</button>
                                    </Card>
                                )}
                            </div>
                        ) : (
                            <IntegrationGuidanceCard type="content-plan" href={`/dashboard/site-intelligence/${siteId}#strategy`} />
                        )}
                    </div>

                    {/* Semantic Debts / Gaps */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={16} className="text-rose-500" /> 高优语义债
                        </h3>
                        {semanticData?.semanticDebts?.length > 0 ? (
                            <Card className="p-6 border-rose-100 bg-rose-50/20 shadow-sm">
                                <div className="space-y-3">
                                    {semanticData.semanticDebts.slice(0, 3).map((debt: any, i: number) => (
                                        <div 
                                            key={i} 
                                            className="flex items-center justify-between p-3 bg-white rounded-xl border border-rose-100 hover:border-rose-300 transition-colors cursor-pointer group"
                                            onClick={() => handleDebtClick(debt)}
                                        >
                                            <span className="text-sm font-bold text-slate-800">{debt.topic}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">覆盖度</span>
                                                    <span className="text-[10px] font-black text-rose-600">{debt.coverageScore}%</span>
                                                </div>
                                                <ChevronRight size={14} className="text-rose-200 group-hover:text-rose-400" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-12 border-dashed border-slate-200 text-center text-slate-400 italic text-xs">
                                尚未发现明显的语义缺口
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
