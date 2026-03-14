import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MarketGapAnalysis } from './MarketGapAnalysis';

export function CompetitorsPanel({ siteId }: { siteId: string }) {
    const [competitors, setCompetitors] = useState<any[]>([]);
    const [marketGap, setMarketGap] = useState<any>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isListRefreshing, setIsListRefreshing] = useState(false);
    const [isGapRefreshing, setIsGapRefreshing] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestedCompetitors, setSuggestedCompetitors] = useState<any[]>([]);
    const [scanningId, setScanningId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsInitialLoading(true);
        setIsListRefreshing(true);
        setIsGapRefreshing(true);
        try {
            const [compRes, gapRes] = await Promise.all([
                fetch(`/api/dashboard/sites/${siteId}/competitors`),
                fetch(`/api/dashboard/sites/${siteId}/market-gap`)
            ]);
            const [compData, gapData] = await Promise.all([compRes.json(), gapRes.json()]);
            if (compData.success) setCompetitors(compData.competitors);
            if (gapData.success) setMarketGap(gapData.data);
        } catch (e) {
            console.error('Failed to fetch data:', e);
        } finally {
            setIsListRefreshing(false);
            setIsGapRefreshing(false);
            setIsInitialLoading(false);
        }
    }, [siteId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDomain.trim()) return;
        setIsAdding(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/competitors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: newDomain })
            });
            const data = await res.json();
            if (data.success) {
                setNewDomain('');
                fetchData();
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
            alert("添加失败");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (compId: string) => {
        if (!confirm("确定要删除此竞品吗？")) return;
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/competitors/${compId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                fetchData();
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
            alert("删除失败");
        }
    };

    const handleScan = async (compId: string) => {
        setScanningId(compId);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/competitors/${compId}/scan`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                fetchData();
            } else {
                alert(data.error || "扫描失败");
            }
        } catch (e) {
            console.error(e);
            alert("扫描发生错误");
        } finally {
            setScanningId(null);
        }
    };

    const handleSuggest = async () => {
        setIsSuggesting(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/competitors/suggest`);
            const data = await res.json();
            if (data.success) {
                setSuggestedCompetitors(data.suggestions);
            } else {
                alert(data.error || "获取建议失败");
            }
        } catch (e) {
            console.error(e);
            alert("请求建议时发生错误");
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleAddFromSuggest = async (domain: string) => {
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/competitors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain })
            });
            const data = await res.json();
            if (data.success) {
                setSuggestedCompetitors(prev => prev.filter(s => s.domain !== domain));
                fetchData();
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
            alert("添加失败");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-6">
                <Card className="flex-1 p-6 space-y-4">
                    <div className="space-y-1">
                        <h3 className="font-semibold text-slate-900">添加竞争对手</h3>
                        <p className="text-sm text-slate-500">输入竞品的裸域名以抓取其核心内容主题并进行空白分析。（最多 5 个）</p>
                    </div>
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="例如: copy.ai"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                        />
                        <Button type="submit" disabled={isAdding || !newDomain.trim()} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm group">
                            {isAdding ? "处理中..." : (
                                <>
                                    <span>添加并分析</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                </>
                            )}
                        </Button>
                    </form>
                </Card>
                <div className="w-full md:w-64 bg-slate-900 rounded-2xl p-6 border border-slate-800 flex items-center justify-center text-center shadow-xl">
                    <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold">追踪限额</p>
                        <p className="text-4xl font-extrabold text-white tabular-nums">
                            {competitors.length} <span className="text-xl text-slate-600 font-medium">/ 5</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Smart Suggestions Section */}
            {suggestedCompetitors.length > 0 ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between px-1">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
                            AI 发现的潜在对手
                        </h4>
                        <button
                            onClick={() => setSuggestedCompetitors([])}
                            className="text-[10px] text-slate-400 hover:text-slate-600 font-medium"
                        >
                            清除建议
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {suggestedCompetitors.map((s, i) => (
                            <Card key={i} className="p-4 border-dashed border-brand-primary/20 bg-brand-primary/[0.02] flex flex-col justify-between group">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-slate-900">{s.domain}</p>
                                        <Badge variant="default" className="text-[10px] py-0 border-brand-primary/20 text-brand-primary bg-white">推荐</Badge>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed italic">“{s.reason}”</p>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleAddFromSuggest(s.domain)}
                                        className="h-7 text-[10px] px-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg flex-1 font-bold"
                                    >
                                        快速添加
                                    </Button>
                                    <button
                                        onClick={() => setSuggestedCompetitors(prev => prev.filter((_, idx) => idx !== i))}
                                        className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex justify-end pr-2">
                    <button
                        onClick={handleSuggest}
                        disabled={isSuggesting}
                        className="text-[11px] text-brand-primary hover:text-brand-primary/80 font-bold flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/5 rounded-full border border-brand-primary/10 transition-all hover:shadow-sm disabled:opacity-50"
                    >
                        {isSuggesting ? (
                            <><svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 行业深度测绘中...</>
                        ) : (
                            <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg> 自动寻找对手</>
                        )}
                    </button>
                </div>
            )}

            <Card className="overflow-hidden border-slate-200 shadow-sm">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="21.17" x2="12" y1="8" y2="8" /><line x1="3.95" x2="8.58" y1="6.06" y2="14" /><line x1="10.88" x2="15.46" y1="21.94" y2="14" /></svg>
                        情报雷达
                    </h3>
                    {(isListRefreshing || isGapRefreshing) && (
                        <div className="flex items-center gap-2 animate-in fade-in duration-300">
                            <svg className="animate-spin h-3 w-3 text-brand-primary/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">同步中</span>
                        </div>
                    )}
                </div>
                {isInitialLoading ? (
                    <div className="p-12 pl-6 pb-8 text-center flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-3"></div>
                        <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">探测雷达初始化中...</p>
                    </div>
                ) : competitors.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl opacity-80">🕵️‍♂️</span>
                        </div>
                        <h4 className="text-slate-900 font-medium mb-1">雷达待命</h4>
                        <p className="text-sm text-slate-500 max-w-[260px]">还没有追踪任何竞品，添加一个网域即可开启全自动内容探测。</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100/80">
                        {competitors.map(comp => {
                            const isScanning = scanningId === comp.id;
                            const hasTopics = comp.topics && comp.topics.length > 0;
                            return (
                                <div key={comp.id} className="p-5 hover:bg-slate-50/50 transition-colors group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 text-brand-primary flex items-center justify-center font-bold text-lg shadow-sm ring-1 ring-inset ring-brand-primary/10">
                                                {comp.domain.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 flex items-center gap-2">
                                                    {comp.domain}
                                                    {hasTopics && (
                                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                                            情报已获取
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="mt-2 min-h-[24px]">
                                                    {hasTopics ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {comp.topics.map((t: string, i: number) => (
                                                                <span key={i} className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                                                                    {t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] text-slate-400 font-medium">尚未扫描该站点的内容基因</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleScan(comp.id)}
                                                disabled={isScanning}
                                                className={`h-8 text-xs font-semibold rounded-lg shadow-sm border-slate-200 transition-all ${isScanning ? 'bg-slate-100 text-slate-400' : 'hover:bg-brand-primary hover:text-white hover:border-brand-primary'}`}
                                            >
                                                {isScanning ? (
                                                    <span className="flex items-center gap-1.5"><svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 扫描中...</span>
                                                ) : hasTopics ? "重新扫描" : "获取情报"}
                                            </Button>
                                            <button
                                                onClick={() => handleDelete(comp.id)}
                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent shadow-[0_0_0_1px_transparent] hover:shadow-red-100"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            <MarketGapAnalysis marketGap={marketGap} siteId={siteId} />
        </div>
    );
}
