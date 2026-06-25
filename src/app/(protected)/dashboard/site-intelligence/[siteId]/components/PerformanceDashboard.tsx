import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';

// Dynamically import Recharts with ssr: false
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const ComposedChart = dynamic(() => import('recharts').then(mod => mod.ComposedChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });

interface PerformanceDashboardProps {
    siteId: string;
}

export function PerformanceDashboard({ siteId }: PerformanceDashboardProps) {
    const t = useTranslations('dashboard.performanceDashboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch(`/api/dashboard/sites/${siteId}/gsc/performance`)
            .then(res => res.json())
            .then(resData => {
                if (resData.success) {
                    setData(resData);
                } else {
                    setError(resData.error || t('emptyTitle'));
                }
            })
            .catch(err => {
                console.error(err);
                setError(t('emptyTitle'));
            })
            .finally(() => setLoading(false));
    }, [siteId, t]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="p-5 flex flex-col justify-between border-brand-border h-[104px]">
                            <div className="h-3 w-24 bg-brand-border rounded-md"></div>
                            <div className="h-8 w-16 bg-brand-surface rounded-md mt-2"></div>
                        </Card>
                    ))}
                </div>

                <Card className="p-6 border-brand-border h-[380px]">
                    <div className="h-5 w-40 bg-brand-border rounded-md mb-6"></div>
                    <div className="h-[300px] w-full bg-brand-surface/50 rounded-xl border border-brand-border"></div>
                </Card>

                <Card className="p-6 border-brand-border">
                    <div className="h-5 w-48 bg-brand-border rounded-md mb-4"></div>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-brand-border pb-3">
                            <div className="h-4 w-24 bg-brand-border rounded-md"></div>
                            <div className="hidden md:flex gap-16">
                                <div className="h-4 w-12 bg-brand-border rounded-md"></div>
                                <div className="h-4 w-12 bg-brand-border rounded-md"></div>
                                <div className="h-4 w-12 bg-brand-border rounded-md"></div>
                            </div>
                        </div>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex justify-between border-b border-brand-surface pb-3 last:border-0 last:pb-0">
                                <div className="h-4 w-48 bg-brand-surface rounded-md"></div>
                                <div className="hidden md:flex gap-16">
                                    <div className="h-4 w-12 bg-brand-surface rounded-md"></div>
                                    <div className="h-4 w-12 bg-brand-surface rounded-md"></div>
                                    <div className="h-4 w-12 bg-brand-surface rounded-md"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 text-center text-brand-error min-h-[400px] flex items-center justify-center">
                {error} {t('errorSuffix')}
            </div>
        );
    }

    if (!data || data.daily.length === 0) {
        return (
            <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[400px] border-dashed border-brand-border">
                <span className="text-4xl opacity-50 mb-4">📊</span>
                <h3 className="text-lg font-semibold text-brand-text-secondary">{t('emptyTitle')}</h3>
                <p className="text-sm text-brand-text-muted mt-2">{t('emptyDesc')}</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 flex flex-col justify-between border-brand-border">
                    <h4 className="text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">{t('totalImpressions')}</h4>
                    <div className="mt-2 text-3xl font-extrabold text-brand-secondary tabular-nums">
                        {formatNumber(data.summary.impressions)}
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between border-brand-border">
                    <h4 className="text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">{t('totalClicks')}</h4>
                    <div className="mt-2 text-3xl font-extrabold text-brand-info tabular-nums">
                        {formatNumber(data.summary.clicks)}
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between border-brand-border">
                    <h4 className="text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">{t('avgCtr')}</h4>
                    <div className="mt-2 text-3xl font-extrabold text-brand-success tabular-nums">
                        {(data.summary.ctr * 100).toFixed(2)}%
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between border-brand-border">
                    <h4 className="text-[11px] font-bold text-brand-text-muted uppercase tracking-widest">{t('daysCount')}</h4>
                    <div className="mt-2 text-3xl font-extrabold text-brand-text-secondary tabular-nums">
                        {data.daily.length}
                    </div>
                </Card>
            </div>

            {/* Main Chart */}
            <Card className="p-6 border-brand-border">
                <h3 className="text-sm font-bold text-brand-text-primary mb-6">{t('trendTitle')}</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data.daily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-brand-secondary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-brand-secondary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-brand-border)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'var(--color-brand-text-muted)' }}
                                tickFormatter={(str) => (typeof str === 'string' ? str.substring(5) : str)}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'var(--color-brand-text-muted)' }}
                                tickFormatter={formatNumber}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'var(--color-brand-text-muted)' }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 'bold', color: 'var(--color-brand-text-primary)', marginBottom: '4px' }}
                            />
                            <Area yAxisId="left" type="monotone" dataKey="impressions" stroke="var(--color-brand-secondary)" strokeWidth={2} fillOpacity={1} fill="url(#colorImpressions)" name={t('impressions')} />
                            <Line yAxisId="right" type="monotone" dataKey="clicks" stroke="var(--color-brand-info)" strokeWidth={3} dot={false} name={t('clicks')} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Top Queries Table */}
            <Card className="p-6 border-brand-border">
                <h3 className="text-sm font-bold text-brand-text-primary mb-4">{t('topQueries')}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-brand-text-muted uppercase bg-brand-surface/50">
                            <tr>
                                <th className="px-4 py-3 font-medium rounded-tl-lg">{t('tableQueryCol')}</th>
                                <th className="px-4 py-3 font-medium text-right">{t('tableClicksCol')}</th>
                                <th className="px-4 py-3 font-medium text-right">{t('tableImpressionsCol')}</th>
                                <th className="px-4 py-3 font-medium text-right rounded-tr-lg">{t('tableCtrCol')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.topQueries.map((q: any, i: number) => (
                                <tr key={i} className="border-b border-brand-border last:border-0 hover:bg-brand-surface/50">
                                    <td className="px-4 py-3 font-medium text-brand-text-primary">{q.query || t('notProvided')}</td>
                                    <td className="px-4 py-3 text-right text-brand-info font-bold">{q.clicks.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-brand-text-secondary tabular-nums">{q.impressions.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-brand-success tabular-nums">{(q.ctr * 100).toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
