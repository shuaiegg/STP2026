'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/Card';


const COLORS = ['#10b981', '#00d4ff', '#f59e0b', '#8b5cf6', '#ef4444'];

interface Keyword {
    keyword: string;
    impressions: number | null;
    clicks: number | null;
    position: number | null;
}

interface KeywordTrendChartProps {
    siteId: string;
    onSyncClick?: () => void;
    onConnectClick?: () => void;
    hasGsc: boolean;
    isSyncing?: boolean;
    refreshKey?: number;
}

export function KeywordTrendChart({ siteId, onSyncClick, onConnectClick, hasGsc, isSyncing, refreshKey }: KeywordTrendChartProps) {
    const t = useTranslations('dashboard.keywordTrend');
    const [trendData, setTrendData] = useState<any[]>([]);
    const [trendKeywords, setTrendKeywords] = useState<string[]>([]);
    const [snapshotCount, setSnapshotCount] = useState(0);
    const [currentKeywords, setCurrentKeywords] = useState<Keyword[]>([]);
    const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!hasGsc) { setLoading(false); return; }
        setLoading(true);
        (async () => {
            try {
                const [trendsRes, kwRes] = await Promise.all([
                    fetch(`/api/dashboard/sites/${siteId}/keyword-snapshots/trends?topN=5&limit=8`),
                    fetch(`/api/dashboard/sites/${siteId}/keywords?limit=20&sortBy=impressions`),
                ]);
                const trendsJson = await trendsRes.json();
                const kwJson = await kwRes.json();

                if (trendsJson.success) {
                    setTrendData(trendsJson.data || []);
                    setTrendKeywords(trendsJson.keywords || []);
                    setSnapshotCount(trendsJson.snapshotCount || 0);
                }
                if (kwJson.success) {
                    setCurrentKeywords(kwJson.keywords || []);
                    setLastSyncAt(kwJson.lastSyncAt ?? null);
                }
            } catch (e) {
                console.error('Failed to load keyword data:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [siteId, hasGsc, refreshKey]);

    if (loading) {
        return <Card className="p-6 bg-white border-slate-200 shadow-sm h-64 animate-pulse"><span /></Card>;
    }

    if (!hasGsc) {
        return (
            <Card className="p-8 bg-white border-slate-200 shadow-sm h-64 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-slate-500 mb-3">{t('noGsc')}</p>
                <button onClick={onConnectClick} className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-colors">
                    {t('connectGsc')}
                </button>
            </Card>
        );
    }

    // Synced before but GSC returned no keyword data (Google withholds query data for low-traffic sites)
    if (currentKeywords.length === 0 && lastSyncAt) {
        return (
            <Card className="p-8 bg-white border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-3 min-h-[200px]">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 text-lg">⚠</div>
                <div className="space-y-1 max-w-xs">
                    <p className="text-sm font-bold text-slate-700">{t('noQueryData')}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{t('noQueryDataHint')}</p>
                </div>
                <button
                    onClick={onSyncClick}
                    disabled={isSyncing}
                    className="mt-1 px-3 py-1.5 border border-slate-200 text-slate-500 hover:text-slate-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                    {isSyncing ? <><Loader2 size={11} className="animate-spin" />{t('syncingBtn')}</> : <><RefreshCw size={11} />{t('resyncBtn')}</>}
                </button>
            </Card>
        );
    }

    // No keywords at all — never synced
    if (currentKeywords.length === 0) {
        return (
            <Card className="p-8 bg-white border-slate-200 shadow-sm h-64 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-slate-500 mb-1">{t('syncPrompt')}</p>
                <p className="text-[11px] text-slate-400 mb-4">{t('syncHint')}</p>
                <button
                    onClick={onSyncClick}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                    {isSyncing ? <><Loader2 size={12} className="animate-spin" />{t('syncingBtn')}</> : t('syncBtn')}
                </button>
            </Card>
        );
    }

    // Have keywords but not enough snapshots for trend — show ranking table
    if (snapshotCount < 2 || trendData.length < 2) {
        return (
            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('currentRanking')}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{t('trendPrompt')}</p>
                    </div>
                    <button
                        onClick={onSyncClick}
                        disabled={isSyncing}
                        title={t('syncBtn')}
                        className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    </button>
                </div>
                <div className="overflow-auto max-h-[260px]">
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-sm">
                            <tr>
                                <th className="text-left px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-full">{t('colKeyword')}</th>
                                <th className="text-right px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('colPos')}</th>
                                <th className="text-right px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('colClicks')}</th>
                                <th className="text-right px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('colImpr')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {currentKeywords.map((kw, i) => (
                                <tr key={kw.keyword} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                                    <td className="px-4 py-2.5 text-slate-700 font-medium truncate max-w-[180px]">{kw.keyword}</td>
                                    <td className="px-3 py-2.5 text-right font-mono font-bold">
                                        {kw.position != null ? (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${kw.position <= 10 ? 'bg-emerald-50 text-emerald-700' : kw.position <= 30 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
                                                #{kw.position}
                                            </span>
                                        ) : <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-slate-600 font-mono">{kw.clicks ?? '—'}</td>
                                    <td className="px-4 py-2.5 text-right text-slate-600 font-mono">{kw.impressions != null ? kw.impressions.toLocaleString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        );
    }

    // Full trend chart
    const formatDate = (date: string) => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    };

    return (
        <Card className="p-6 bg-white border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('trendTitle')}</h4>
                <div className="flex items-center gap-3">
                    <div className="flex gap-3 flex-wrap">
                        {trendKeywords.map((kw, i) => (
                            <div key={kw} className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-[9px] font-bold text-slate-500 truncate max-w-[80px]">{kw}</span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={onSyncClick}
                        disabled={isSyncing}
                        title={t('syncBtn')}
                        className="p-1.5 text-slate-300 hover:text-brand-primary rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    </button>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis reversed domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', color: '#f8fafc' }}
                        formatter={(value: any, name?: string) => {
                            if (name?.endsWith('_clicks')) return [null, null];
                            return [value ? `#${Number(value).toFixed(1)}` : '-', name || ''];
                        }}
                        labelFormatter={(label: any) => formatDate(String(label))}
                    />
                    {trendKeywords.map((kw, i) => (
                        <Line key={kw} type="monotone" dataKey={kw} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3, fill: COLORS[i % COLORS.length] }} activeDot={{ r: 5 }} connectNulls />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}
