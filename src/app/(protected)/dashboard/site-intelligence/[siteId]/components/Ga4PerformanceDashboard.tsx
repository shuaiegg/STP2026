"use client"
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Clock, Activity, MousePointerClick } from 'lucide-react';

export function Ga4PerformanceDashboard({ siteId }: { siteId: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGa4Data = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/dashboard/sites/${siteId}/ga4/performance`);
                const result = await res.json();

                if (result.success) {
                    setData(result.data);
                } else if (result.needsReauth || result.error?.includes('无访问权限')) {
                    setError('GA4连接失效或没有数据权限，请在概览页面重新授权关联 GA4。');
                } else {
                    setError(result.error || '无法加载流量数据');
                }
            } catch (e) {
                console.error(e);
                setError('请求流量数据失败');
            } finally {
                setLoading(false);
            }
        };

        fetchGa4Data();
    }, [siteId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Fetching Google Analytics 4 Data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[400px] border border-dashed border-rose-200 rounded-xl bg-orange-50/30">
                <span className="text-3xl mb-3 opacity-80">📉</span>
                <p className="text-sm font-bold text-orange-900 mb-1">无法读取 GA4 流量数据</p>
                <p className="text-xs text-orange-700/70 max-w-sm text-center">{error}</p>
            </div>
        );
    }

    if (!data || !data.chartData || data.chartData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[400px] border border-dashed border-slate-200 rounded-xl">
                <span className="text-3xl mb-3 opacity-30">🕸️</span>
                <p className="text-sm font-bold text-slate-600">近 30 天无流量数据</p>
                <p className="text-xs text-slate-400">目前您的站点尚未被记录到有效访问。</p>
            </div>
        );
    }

    const { chartData, totals } = data;

    const formatRate = (val: number) => `${(val * 100).toFixed(1)}%`;
    const formatDuration = (val: number) => {
        const mins = Math.floor(val / 60);
        const secs = Math.floor(val % 60);
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Totals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-5 flex flex-col justify-between border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={12} />活跃用户数 (30d)</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                        {totals.activeUsers.toLocaleString()}
                    </div>
                </Card>

                <Card className="p-5 flex flex-col justify-between border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MousePointerClick size={12} />总会话数</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                        {totals.sessions.toLocaleString()}
                    </div>
                </Card>

                <Card className="p-5 flex flex-col justify-between border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Activity size={12} />平均互动率</span>
                    </div>
                    <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                        {formatRate(totals.engagementRate)}
                    </div>
                </Card>

                <Card className="p-5 flex flex-col justify-between border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12} />平均停留时间</span>
                    </div>
                    <div className="text-2xl pt-1 pr-2 font-extrabold text-slate-900 tabular-nums truncate">
                        {formatDuration(totals.averageSessionDuration || 0)}
                    </div>
                </Card>
            </div>

            {/* Main Traffic Chart */}
            <Card className="p-6 border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Activity size={16} className="text-orange-500" />
                        近 30 天流量趋势 (GA4)
                    </h3>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(val) => {
                                    const d = new Date(val);
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                }}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                dy={10}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                                labelStyle={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}
                                labelFormatter={(label) => `日期: ${label}`}
                            />
                            <Area yAxisId="left" type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSessions)" name="会话数" />
                            <Area yAxisId="left" type="monotone" dataKey="activeUsers" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" name="活跃用户数" activeDot={{ r: 6, strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
}
