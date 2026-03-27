'use client';

import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/Card';

interface OrganicTrafficChartProps {
    siteId: string;
    hasGsc: boolean;
    onConnectClick?: () => void;
}

export function OrganicTrafficChart({ siteId, hasGsc, onConnectClick }: OrganicTrafficChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({ clicks: 0, impressions: 0, ctr: 0 });

    useEffect(() => {
        if (!hasGsc) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const res = await fetch(`/api/dashboard/sites/${siteId}/gsc/performance`);
                const json = await res.json();
                if (json.success && json.daily) {
                    setData(json.daily);
                    const totalClicks = json.daily.reduce((sum: number, d: any) => sum + (d.clicks || 0), 0);
                    const totalImpressions = json.daily.reduce((sum: number, d: any) => sum + (d.impressions || 0), 0);
                    setTotals({
                        clicks: totalClicks,
                        impressions: totalImpressions,
                        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
                    });
                }
            } catch (e) {
                console.error('Failed to load traffic data:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [siteId, hasGsc]);

    if (loading) {
        return <Card className="p-6 bg-white border-slate-200 shadow-sm h-64 animate-pulse"><span /></Card>;
    }

    if (!hasGsc) {
        return (
            <Card className="p-8 bg-white border-slate-200 shadow-sm h-64 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-slate-500 mb-3">连接 Google Search Console 后查看有机流量趋势</p>
                <button
                    onClick={onConnectClick}
                    className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-colors"
                >
                    连接 GSC
                </button>
            </Card>
        );
    }

    if (data.length === 0) {
        return (
            <Card className="p-8 bg-white border-slate-200 shadow-sm h-64 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-slate-500">暂无流量数据</p>
            </Card>
        );
    }

    const formatDate = (date: string) => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    };

    const formatNumber = (n: number) => {
        if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
        return n.toString();
    };

    return (
        <Card className="p-6 bg-white border-slate-200 shadow-sm">
            {/* KPI Labels */}
            <div className="flex items-center gap-6 mb-4">
                <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">总点击</span>
                    <span className="text-lg font-black text-slate-900">{formatNumber(totals.clicks)}</span>
                </div>
                <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">总展示</span>
                    <span className="text-lg font-black text-slate-900">{formatNumber(totals.impressions)}</span>
                </div>
                <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">平均 CTR</span>
                    <span className="text-lg font-black text-slate-900">{totals.ctr.toFixed(1)}%</span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickLine={false}
                    />
                    <YAxis
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
                        formatter={(value: any) => [value, '点击数']}
                        labelFormatter={(label: any) => formatDate(String(label))}
                    />
                    <Area
                        type="monotone"
                        dataKey="clicks"
                        stroke="#00d4ff"
                        strokeWidth={2}
                        fill="url(#clicksGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
}
