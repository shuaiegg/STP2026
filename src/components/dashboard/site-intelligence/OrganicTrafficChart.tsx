'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/Card';

interface OrganicTrafficChartProps {
    siteId: string;
    hasGsc: boolean;
    onConnectClick?: () => void;
}

export function OrganicTrafficChart({ siteId, hasGsc, onConnectClick }: OrganicTrafficChartProps) {
    const t = useTranslations('dashboard.organicTraffic');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({ clicks: 0, impressions: 0, ctr: 0 });
    const [hasSummary, setHasSummary] = useState(false);

    useEffect(() => {
        if (!hasGsc) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const res = await fetch(`/api/dashboard/sites/${siteId}/gsc/performance`);
                const json = await res.json();
                if (json.success) {
                    setData(json.daily || []);
                    // Prefer pre-computed summary; fall back to summing daily rows
                    if (json.summary && (json.summary.impressions > 0 || json.summary.clicks > 0)) {
                        setTotals({
                            clicks: json.summary.clicks,
                            impressions: json.summary.impressions,
                            ctr: json.summary.ctr * 100,
                        });
                        setHasSummary(true);
                    } else if (json.daily?.length) {
                        const totalClicks = json.daily.reduce((sum: number, d: any) => sum + (d.clicks || 0), 0);
                        const totalImpressions = json.daily.reduce((sum: number, d: any) => sum + (d.impressions || 0), 0);
                        setTotals({
                            clicks: totalClicks,
                            impressions: totalImpressions,
                            ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
                        });
                        setHasSummary(totalClicks > 0 || totalImpressions > 0);
                    }
                }
            } catch (e) {
                console.error('Failed to load traffic data:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [siteId, hasGsc]);

    if (loading) {
        return <Card className="p-6 bg-white border-brand-border shadow-sm h-64 animate-pulse"><span /></Card>;
    }

    if (!hasGsc) {
        return (
            <Card className="p-8 bg-white border-brand-border shadow-sm h-64 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-brand-text-secondary mb-3">{t('connectPrompt')}</p>
                <button
                    onClick={onConnectClick}
                    className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary-hover transition-colors"
                >
                    {t('connectGsc')}
                </button>
            </Card>
        );
    }

    // No data at all (truly empty or API error)
    if (!hasSummary && data.length === 0) {
        return (
            <Card className="p-8 bg-white border-brand-border shadow-sm h-64 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-brand-text-secondary">{t('noData')}</p>
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
        <Card className="p-6 bg-white border-brand-border shadow-sm">
            {/* KPI Labels */}
            <div className="flex items-center gap-6 mb-4">
                <div>
                    <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest block">{t('totalClicks')}</span>
                    <span className="text-lg font-black text-brand-text-primary">{formatNumber(totals.clicks)}</span>
                </div>
                <div>
                    <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest block">{t('totalImpr')}</span>
                    <span className="text-lg font-black text-brand-text-primary">{formatNumber(totals.impressions)}</span>
                </div>
                <div>
                    <span className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest block">{t('avgCtr')}</span>
                    <span className="text-lg font-black text-brand-text-primary">{totals.ctr.toFixed(1)}%</span>
                </div>
            </div>

            {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 10, fill: '#8a8a8a' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#8a8a8a' }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0a0a0a',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '11px',
                            color: '#ffffff',
                        }}
                        formatter={(value: any) => [value, t('clicksLabel')]}
                        labelFormatter={(label: any) => formatDate(String(label))}
                    />
                    <Area
                        type="monotone"
                        dataKey="clicks"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#clicksGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>
            ) : (
                <div className="h-[180px] flex items-center justify-center">
                    <p className="text-[11px] text-brand-text-muted text-center leading-relaxed">
                        {t('noTrendData')}
                    </p>
                </div>
            )}
        </Card>
    );
}
