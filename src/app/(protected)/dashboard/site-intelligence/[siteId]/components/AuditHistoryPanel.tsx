import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export function AuditHistoryPanel({ siteId, domain }: { siteId: string, domain: string }) {
    const [audits, setAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAudits = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/audits`);
            const data = await res.json();
            if (data.audits) {
                setAudits(data.audits);
            }
        } catch (e) {
            console.error('Failed to load audits:', e);
        } finally {
            setLoading(false);
        }
    }, [siteId]);

    useEffect(() => {
        fetchAudits();
    }, [fetchAudits]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <Card className="overflow-hidden border-slate-200 shadow-sm">
                    <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <div className="h-5 w-32 bg-slate-200 rounded-md"></div>
                        <div className="h-5 w-20 bg-slate-200 rounded-full"></div>
                    </div>
                    <div className="divide-y divide-slate-100/80">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0"></div>
                                    <div className="flex flex-col justify-center py-1 space-y-2">
                                        <div className="h-5 w-32 bg-slate-200 rounded-md"></div>
                                        <div className="flex gap-4">
                                            <div className="h-4 w-24 bg-slate-100 rounded-md"></div>
                                            <div className="h-4 w-20 bg-slate-100 rounded-md"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:block h-9 w-32 bg-slate-100 rounded-xl"></div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    if (audits.length === 0) {
        return (
            <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[400px] border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl opacity-80">📭</span>
                </div>
                <h3 className="text-slate-900 font-semibold mb-2 text-lg">暂无审计历史</h3>
                <p className="text-sm text-slate-500 max-w-sm mb-6">
                    您还没有对该站点进行过深度审计。发起一次扫描以开始建立您的情报档案。
                </p>
                <Link href={`/dashboard/site-intelligence/instant-audit?siteId=${siteId}`}>
                    <button className="bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl shadow-sm px-6 py-2.5 font-bold transition-all flex items-center gap-2">
                        开始全面扫描
                    </button>
                </Link>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                        审计时间线
                    </h3>
                    <Badge variant="muted" className="bg-white border-slate-200 text-slate-600 text-[10px]">
                        共 {audits.length} 次记录
                    </Badge>
                </div>

                <div className="divide-y divide-slate-100/80">
                    {audits.map((audit, index) => {
                        const date = new Date(audit.createdAt);
                        const isLatest = index === 0;
                        const score = audit.techScore || 0;
                        const isScoreGood = score >= 80;
                        const isScoreWarn = score >= 50 && score < 80;

                        return (
                            <div key={audit.id} className={`p-5 hover:bg-slate-50/50 transition-colors group ${isLatest ? 'bg-brand-primary/[0.02]' : ''}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        {/* Date / Time Card */}
                                        <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center shrink-0 shadow-sm">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{date.toLocaleString('en-US', { month: 'short' })}</span>
                                            <span className="text-xl font-black text-slate-900 leading-none">{date.getDate()}</span>
                                            <span className="text-[9px] text-slate-500 mt-0.5">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>

                                        {/* Details */}
                                        <div className="flex flex-col justify-center py-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-900 text-base">深度扫描报告</h4>
                                                {isLatest && (
                                                    <Badge variant="default" className="text-[9px] py-0 px-1.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border-0">
                                                        最新
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                                                <span className="flex items-center gap-1.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h.01" /><path d="M17 7h.01" /><path d="M7 17h.01" /><path d="M17 17h.01" /></svg>
                                                    {audit.pageCount} 个页面节点
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isScoreGood ? 'bg-emerald-500' : isScoreWarn ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                                                    健康分: {score}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex items-center pl-20 sm:pl-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <Link href={`/dashboard/site-intelligence/instant-audit?siteId=${siteId}&auditId=${audit.id}`}>
                                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-brand-primary hover:text-brand-primary text-slate-600 rounded-xl text-xs font-bold shadow-sm transition-all">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                                查看星图快照
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}
