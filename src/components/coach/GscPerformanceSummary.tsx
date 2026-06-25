"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import dynamic from 'next/dynamic';
import { Loader2, TrendingUp } from 'lucide-react';

const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const ComposedChart = dynamic(() => import('recharts').then(m => m.ComposedChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(m => m.Legend), { ssr: false });

const COPY = {
    impressions: { zh: '近30天展示', en: 'Impressions (30d)' },
    clicks: { zh: '点击', en: 'Clicks' },
    seriesImp: { zh: '展示', en: 'Impressions' },
    seriesClicks: { zh: '点击', en: 'Clicks' },
    topQueries: { zh: '热门词', en: 'Top queries' },
    noData: { zh: '暂无搜索数据', en: 'No search data yet' },
    noDataDesc: { zh: 'GSC 数据通常需要 3 天延迟', en: 'GSC data typically has a 3-day delay' },
} as const;

interface GscPerformanceSummaryProps {
    siteId: string;
    locale: 'zh' | 'en';
}

export function GscPerformanceSummary({ siteId, locale }: GscPerformanceSummaryProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch(`/api/dashboard/sites/${siteId}/gsc/performance`)
            .then(r => r.json())
            .then(d => { if (d.success) setData(d); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [siteId]);

    const formatNumber = (n: number) => {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
        return n.toString();
    };

    if (loading) {
        return (
            <Card className="p-5 flex items-center justify-center h-36 border-brand-border">
                <Loader2 size={20} className="animate-spin text-brand-text-muted" aria-hidden="true" />
            </Card>
        );
    }

    if (!data || !data.daily?.length) {
        return (
            <Card className="p-5 border-brand-border border-dashed flex flex-col items-center justify-center h-36 gap-1">
                <TrendingUp size={20} className="text-brand-text-muted" aria-hidden="true" />
                <p className="text-sm text-brand-text-secondary font-medium">{COPY.noData[locale]}</p>
                <p className="text-xs text-brand-text-muted">{COPY.noDataDesc[locale]}</p>
            </Card>
        );
    }

    const { summary, daily, topQueries } = data;

    return (
        <Card className="p-5 border-brand-border space-y-4">
            {/* Metrics row */}
            <div className="flex items-center gap-6">
                <div>
                    <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-0.5">
                        {COPY.impressions[locale]}
                    </p>
                    <p className="text-2xl font-extrabold text-brand-secondary tabular-nums">
                        {formatNumber(summary.impressions)}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-0.5">
                        {COPY.clicks[locale]}
                    </p>
                    <p className="text-2xl font-extrabold text-brand-info tabular-nums">
                        {formatNumber(summary.clicks)}
                    </p>
                </div>
            </div>

            {/* Trend: impressions (area, left axis) + clicks (line, right axis), dated X axis */}
            <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={daily} margin={{ top: 5, right: 6, left: -18, bottom: 0 }}>
                        <defs>
                            <linearGradient id="summaryGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-brand-secondary)" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="var(--color-brand-secondary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-brand-border)" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            minTickGap={28}
                            tick={{ fontSize: 10, fill: 'var(--color-brand-text-muted)' }}
                            tickFormatter={(v) => (typeof v === 'string' ? v.slice(5) : v)}
                        />
                        <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            width={30}
                            allowDecimals={false}
                            tick={{ fontSize: 10, fill: 'var(--color-brand-text-muted)' }}
                            tickFormatter={formatNumber}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            width={24}
                            allowDecimals={false}
                            tick={{ fontSize: 10, fill: 'var(--color-brand-info)' }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                            labelStyle={{ fontWeight: 'bold', color: 'var(--color-brand-text-primary)', marginBottom: 2 }}
                            labelFormatter={(v) => (typeof v === 'string' ? v.slice(5) : v)}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} iconType="plainline" />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="impressions"
                            name={COPY.seriesImp[locale]}
                            stroke="var(--color-brand-secondary)"
                            strokeWidth={2}
                            fill="url(#summaryGrad)"
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="clicks"
                            name={COPY.seriesClicks[locale]}
                            stroke="var(--color-brand-info)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Top queries preview */}
            {topQueries?.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest mb-2">
                        {COPY.topQueries[locale]}
                    </p>
                    <div className="space-y-1">
                        {topQueries.slice(0, 3).map((q: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-brand-text-secondary truncate max-w-[200px]">{q.query}</span>
                                <span className="text-brand-text-muted tabular-nums shrink-0 ml-2">{formatNumber(q.impressions)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}
