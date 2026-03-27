'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/Card';

const COLORS = ['#10b981', '#00d4ff', '#f59e0b', '#8b5cf6', '#ef4444'];

interface KeywordTrendChartProps {
    siteId: string;
    onSyncClick?: () => void;
    onConnectClick?: () => void;
    hasGsc: boolean;
    isSyncing?: boolean;
    refreshKey?: number;
}

export function KeywordTrendChart({ siteId, onSyncClick, onConnectClick, hasGsc, isSyncing, refreshKey }: KeywordTrendChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [keywords, setKeywords] = useState<string[]>([]);
    const [snapshotCount, setSnapshotCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!hasGsc) {
            setLoading(false);
            return;
        }
        setLoading(true);
        (async () => {
            try {
                const res = await fetch(`/api/dashboard/sites/${siteId}/keyword-snapshots/trends?topN=5&limit=8`);
                const json = await res.json();
                if (json.success) {
                    setData(json.data || []);
                    setKeywords(json.keywords || []);
                    setSnapshotCount(json.snapshotCount || 0);
                }
            } catch (e) {
                console.error('Failed to load keyword trends:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [siteId, hasGsc, refreshKey]);

    if (loading) {
        return <Card className="p-6 bg-white border-slate-200 shadow-sm h-64 animate-pulse"><span /></Card>;
    }

    // Not connected
    if (!hasGsc) {
        return (
            <Card className="p-8 bg-white border-slate-200 shadow-sm h-64 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-slate-500 mb-3">连接 Google Search Console 后追踪关键词排名趋势</p>
                <button
                    onClick={onConnectClick}
                    className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-colors"
                >
                    连接 GSC
                </button>
            </Card>
        );
    }

    // Less than 2 snapshots
    if (snapshotCount < 2 || data.length < 2) {
        return (
            <Card className="p-8 bg-white border-slate-200 shadow-sm h-64 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-slate-500 mb-1">
                    {snapshotCount === 0 ? '同步 GSC 数据以建立基准' : '已建立基准，再同步一次即可查看趋势'}
                </p>
                <p className="text-[11px] text-slate-400 mb-4">
                    {snapshotCount === 0 ? '首次同步将记录当前排名快照' : '趋势图需要两次不同日期的快照'}
                </p>
                <button
                    onClick={onSyncClick}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                    {isSyncing ? <><Loader2 size={12} className="animate-spin" />同步中…</> : '立即同步'}
                </button>
            </Card>
        );
    }

    const formatDate = (date: string) => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    };

    return (
        <Card className="p-6 bg-white border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">排名趋势 (TOP 5)</h4>
                <div className="flex gap-3 flex-wrap">
                    {keywords.map((kw, i) => (
                        <div key={kw} className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-[9px] font-bold text-slate-500 truncate max-w-[80px]">{kw}</span>
                        </div>
                    ))}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                    />
                    <YAxis
                        reversed
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '11px',
                            color: '#f8fafc',
                        }}
                        formatter={(value: any, name?: string) => {
                            if (name?.endsWith('_clicks')) return [null, null];
                            return [value ? `#${Number(value).toFixed(1)}` : '-', name || ''];
                        }}
                        labelFormatter={(label: any) => formatDate(String(label))}
                    />
                    {keywords.map((kw, i) => (
                        <Line
                            key={kw}
                            type="monotone"
                            dataKey={kw}
                            stroke={COLORS[i % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
                            activeDot={{ r: 5 }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}
