import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/Badge';

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
                    setError(resData.error || 'Failed to load performance data');
                }
            })
            .catch(err => {
                console.error(err);
                setError('Failed to fetch GSC performance.');
            })
            .finally(() => setLoading(false));
    }, [siteId]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    if (loading) {
        return (
            <div className="p-12 pl-6 pb-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-3"></div>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">正在拉取搜索数据...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 text-center text-rose-500 min-h-[400px] flex items-center justify-center">
                {error} (请确认已在“概览”页绑定 GSC 资源)
            </div>
        );
    }

    if (!data || data.daily.length === 0) {
        return (
            <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[400px] border-dashed border-slate-200">
                <span className="text-4xl opacity-50 mb-4">📊</span>
                <h3 className="text-lg font-semibold text-slate-700">暂无数据</h3>
                <p className="text-sm text-slate-500 mt-2">该资源过去 30 天没有搜索展示数据或尚未准备好，请稍后再试。</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 flex flex-col justify-between border-slate-200">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">总曝光 (Impressions)</h4>
                    <div className="mt-2 text-3xl font-extrabold text-blue-600 tabular-nums">
                        {formatNumber(data.summary.impressions)}
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between border-slate-200">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">总点击 (Clicks)</h4>
                    <div className="mt-2 text-3xl font-extrabold text-indigo-600 tabular-nums">
                        {formatNumber(data.summary.clicks)}
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between border-slate-200">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">平均点击率 (CTR)</h4>
                    <div className="mt-2 text-3xl font-extrabold text-emerald-600 tabular-nums">
                        {(data.summary.ctr * 100).toFixed(2)}%
                    </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between border-slate-200">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">近30天天数</h4>
                    <div className="mt-2 text-3xl font-extrabold text-slate-700 tabular-nums">
                        {data.daily.length}
                    </div>
                </Card>
            </div>

            {/* Main Chart */}
            <Card className="p-6 border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-6">搜索表现趋势 (30天)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data.daily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                tickFormatter={(str) => (typeof str === 'string' ? str.substring(5) : str)}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                                tickFormatter={formatNumber}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748b' }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                            />
                            <Area yAxisId="left" type="monotone" dataKey="impressions" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorImpressions)" name="曝光 (Impressions)" />
                            <Line yAxisId="right" type="monotone" dataKey="clicks" stroke="#4f46e5" strokeWidth={3} dot={false} name="点击 (Clicks)" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Top Queries Table */}
            <Card className="p-6 border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-4">热门搜索词 (Top Queries)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
                            <tr>
                                <th className="px-4 py-3 font-medium rounded-tl-lg">搜索词</th>
                                <th className="px-4 py-3 font-medium text-right">点击</th>
                                <th className="px-4 py-3 font-medium text-right">曝光</th>
                                <th className="px-4 py-3 font-medium text-right rounded-tr-lg">点击率</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.topQueries.map((q: any, i: number) => (
                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                    <td className="px-4 py-3 font-medium text-slate-800">{q.query || '(未提供)'}</td>
                                    <td className="px-4 py-3 text-right text-indigo-600 font-bold">{q.clicks.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{q.impressions.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-emerald-600 tabular-nums">{(q.ctr * 100).toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
