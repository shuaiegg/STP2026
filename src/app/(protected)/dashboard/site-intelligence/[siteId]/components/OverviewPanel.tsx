import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { GscPropertySelector } from './GscPropertySelector';

export function OverviewPanel({ siteId, domain }: { siteId: string, domain: string }) {
    const [latestAudit, setLatestAudit] = useState<any>(null);
    const [semanticData, setSemanticData] = useState<any>(null);
    const [competitorCount, setCompetitorCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [isExtractingDNA, setIsExtractingDNA] = useState(false);
    const [siteData, setSiteData] = useState<any>(null);
    const [isConnectingGSC, setIsConnectingGSC] = useState(false);

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

    const handleConnectGSC = async () => {
        setIsConnectingGSC(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/gsc-sync/auth`, { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || "Failed to initialize GSC connection");
            }
        } catch (e) {
            console.error(e);
            alert("Error connecting to GSC");
        } finally {
            setIsConnectingGSC(false);
        }
    };

    const handleExtractDNA = useCallback(async () => {
        setIsExtractingDNA(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/ontology`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                // Refresh the panel data
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
                {/* Our Strengths & Business DNA */}
                <div className="space-y-6">
                    {/* Business DNA */}
                    {semanticData?.businessOntology ? (
                        <Card className="p-6 border-indigo-100 bg-indigo-50/30 shadow-sm">
                            <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-3">
                                🧬 核心业务 DNA
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">核心产品/服务</h4>
                                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                                        {semanticData.businessOntology.coreOfferings?.join(" • ")}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">解决痛点</h4>
                                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                                        {semanticData.businessOntology.painPointsSolved?.join(" • ")}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="p-6 border-dashed border-indigo-200 bg-indigo-50/10 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
                            <span className="text-2xl opacity-50">🧬</span>
                            <div>
                                <h3 className="text-sm font-bold text-indigo-900">未提取业务 DNA</h3>
                                <p className="text-xs text-slate-500 mt-1">提取自身的业务逻辑，系统才能推导出你的"语义债"和核心支柱。</p>
                            </div>
                            <button
                                onClick={handleExtractDNA}
                                disabled={isExtractingDNA}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-[11px] font-bold transition-all disabled:opacity-50"
                            >
                                {isExtractingDNA ? "正在利用全站数据反推 DNA..." : "立即提取业务 DNA"}
                            </button>
                        </Card>
                    )}

                    <Card className="p-6 border-emerald-100 bg-emerald-50/20 shadow-sm">
                        <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2 mb-4">
                            权威支柱 (Core Strengths)
                        </h3>
                        {semanticData?.ourStrengths?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {semanticData.ourStrengths.slice(0, 15).map((topic: any, i: number) => (
                                    <Badge key={i} variant="default" className="bg-white border-emerald-200 text-emerald-700 shadow-sm cursor-default">
                                        {topic.topic}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500">系统中尚未提取到成熟的内容支柱。建议补充业务相关的核心长文。</p>
                        )}
                    </Card>
                </div>

                {/* Top Semantic Debts */}
                <Card className="p-6 border-rose-100 bg-rose-50/20 shadow-sm flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                                高优语义债 (Semantic Debts)
                            </h3>
                            {(!siteData?.gscConnections || siteData.gscConnections.length === 0) ? (
                                <button
                                    onClick={handleConnectGSC}
                                    disabled={isConnectingGSC}
                                    className="mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.54 15H17a2 2 0 0 0-2 2v4.54" /><path d="M7 3.34V5a3 3 0 0 0 3 3v0a2 2 0 0 1 2 2v0c0 1.1.9 2 2 2v0a2 2 0 0 0 2-2v0c0-1.1.9-2 2-2h3.17" /><path d="M11 21.95V18a2 2 0 0 0-2-2v0a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" /><circle cx="12" cy="12" r="10" /></svg>
                                    {isConnectingGSC ? '连接中...' : '接入 GSC 数据，智能算出还债优先级 ✨'}
                                </button>
                            ) : !siteData.gscConnections[0].propertyId ? (
                                <div className="mt-4 mb-4">
                                    <GscPropertySelector
                                        siteId={siteId}
                                        onSelected={() => fetchData()}
                                    />
                                </div>
                            ) : (
                                <div className="mt-2 text-[10px] text-emerald-600 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    已连接 GSC 数据源 ({siteData.gscConnections[0].propertyId})
                                </div>
                            )}
                        </div>
                        {semanticData?.semanticDebts?.length > 0 && (
                            <Badge variant="muted" className="bg-white border-rose-200 text-rose-600 text-[10px]">
                                发现 {semanticData.semanticDebts.length} 个缺口
                            </Badge>
                        )}
                    </div>

                    {semanticData?.semanticDebts?.length > 0 ? (
                        <div className="space-y-3 flex-1">
                            {semanticData.semanticDebts.slice(0, 5).map((debt: any, i: number) => (
                                <div key={i} className="flex flex-col gap-2">
                                    <div
                                        className={`flex items-center justify-between p-3 rounded-xl border shadow-sm transition-all cursor-pointer ${selectedDebt?.topic === debt.topic
                                            ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-200'
                                            : 'bg-white border-rose-100 hover:border-rose-300'
                                            }`}
                                        onClick={() => handleDebtClick(debt)}
                                    >
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                {debt.topic}
                                                {debt.priorityLabel && (
                                                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${debt.priorityLabel.includes('🔥')
                                                        ? 'bg-rose-100 text-rose-600'
                                                        : 'bg-emerald-100 text-emerald-600'
                                                        }`}>
                                                        {debt.priorityLabel}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <button className="text-rose-500 opacity-60 hover:opacity-100 transition-opacity">
                                            {selectedDebt?.topic === debt.topic ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                            )}
                                        </button>
                                    </div>

                                    {/* Inline Expansion Pane */}
                                    {selectedDebt?.topic === debt.topic && (
                                        <div className="mx-2 mb-2 p-4 bg-white rounded-lg border border-rose-100 shadow-inner animate-in slide-in-from-top-1 space-y-4">
                                            <div className="bg-slate-50 rounded p-3 text-xs leading-relaxed text-slate-700 border border-slate-100">
                                                <strong className="text-slate-900 block mb-1">为什么这很重要？ (Relevance)</strong>
                                                {debt.relevance}
                                            </div>

                                            {debt.gscData && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-blue-50/50 p-2 rounded border border-blue-100">
                                                        <div className="text-[8px] font-bold text-blue-500 tracking-widest uppercase mb-0.5">月曝光走势 (Impressions)</div>
                                                        <div className="text-sm font-black text-blue-900">{debt.gscData.impressions.toLocaleString()}</div>
                                                    </div>
                                                    <div className="bg-blue-50/50 p-2 rounded border border-blue-100">
                                                        <div className="text-[8px] font-bold text-blue-500 tracking-widest uppercase mb-0.5">捕获点击 (Clicks)</div>
                                                        <div className="text-sm font-black text-blue-900">{debt.gscData.clicks.toLocaleString()}</div>
                                                    </div>
                                                    {debt.gscData.matchedKeywords?.length > 0 && (
                                                        <div className="col-span-2 text-[10px] text-slate-500">
                                                            触发的搜索词: <span className="font-mono text-slate-700">{debt.gscData.matchedKeywords.join(', ')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {debt.subtopics && debt.subtopics.length > 0 && (
                                                <div className="bg-slate-900 rounded p-3">
                                                    <div className="text-[10px] text-slate-400 font-mono mb-2">SUGGESTED SUB-TOPICS:</div>
                                                    <ul className="space-y-1 font-mono text-[11px] text-slate-300 list-disc list-inside">
                                                        {debt.subtopics.map((sub: string, idx: number) => (
                                                            <li key={idx}>{sub}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2.5 text-[11px] font-bold tracking-widest uppercase transition-colors flex justify-center items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                                                派发 GEO Writer 任务
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 flex-1">
                            尚未提取到业务本体数据或未发现明显的语义债。
                        </p>
                    )
                    }
                </Card >
            </div >
        </div >
    );
}
