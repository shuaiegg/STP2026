"use client";

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/Card';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface KeywordDataPoint {
    keyword: string;
    volume: number;
    competition: number;
    score: number;
}

interface KeywordOpportunityMatrixProps {
    topics: Array<{
        keyword: string;
        volume: number;
        competition: number;
    }>;
}

export function KeywordOpportunityMatrix({ topics }: KeywordOpportunityMatrixProps) {
    // 计算机会评分：高流量 + 低竞争 = 高机会
    const calculateOpportunityScore = (volume: number, competition: number): number => {
        // 标准化流量分数 (假设10000+为满分)
        const volumeScore = Math.min(100, (volume / 10000) * 100);
        // 竞争度越低越好
        const competitionScore = 100 - competition;
        // 加权平均：流量权重60%，竞争度权重40%
        return Math.round(volumeScore * 0.6 + competitionScore * 0.4);
    };

    // 转换数据
    const data: KeywordDataPoint[] = topics.map(t => ({
        keyword: t.keyword,
        volume: t.volume,
        competition: t.competition,
        score: calculateOpportunityScore(t.volume, t.competition)
    }));

    // 根据评分确定颜色
    const getColor = (score: number): string => {
        if (score >= 70) return '#10b981'; // 绿色 - 高机会
        if (score >= 50) return '#f59e0b'; // 黄色 - 中等机会
        if (score >= 30) return '#fb923c'; // 橙色 - 低机会
        return '#ef4444'; // 红色 - 几乎无机会
    };

    // 获取机会等级标签
    const getOpportunityLabel = (score: number): string => {
        if (score >= 70) return '高机会';
        if (score >= 50) return '中等';
        if (score >= 30) return '低机会';
        return '避免';
    };

    // 自定义Tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length > 0) {
            const data: KeywordDataPoint = payload[0].payload;
            return (
                <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-lg">
                    <p className="font-black text-sm text-slate-800 mb-2">{data.keyword}</p>
                    <div className="space-y-1 text-xs">
                        <p className="text-slate-600">
                            <span className="font-bold">搜索量:</span> {data.volume.toLocaleString()}
                        </p>
                        <p className="text-slate-600">
                            <span className="font-bold">竞争度:</span> {data.competition}%
                        </p>
                        <p className={`font-black ${data.score >= 70 ? 'text-emerald-600' : data.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            <span>机会评分:</span> {data.score} - {getOpportunityLabel(data.score)}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    // 找出最佳机会
    const topOpportunities = [...data]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    return (
        <Card className="p-8 border-2 border-slate-100 rounded-3xl bg-white">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <TrendingUp className="text-emerald-500" size={24} />
                        关键词机会矩阵
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                        找到高流量、低竞争的黄金关键词
                    </p>
                </div>
            </div>

            {/* 图例 */}
            <div className="flex gap-4 mb-6 text-xs font-bold">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">高机会 (70+)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-slate-600">中等 (50-69)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-slate-600">低机会 (30-49)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-slate-600">避免 (&lt;30)</span>
                </div>
            </div>

            {/* 散点图 */}
            <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        type="number"
                        dataKey="volume"
                        name="搜索量"
                        label={{ value: '月搜索量', position: 'bottom', offset: 40, style: { fontSize: '12px', fontWeight: 'bold', fill: '#64748b' } }}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <YAxis
                        type="number"
                        dataKey="competition"
                        name="竞争度"
                        label={{ value: '竞争度 (%)', angle: -90, position: 'left', offset: 40, style: { fontSize: '12px', fontWeight: 'bold', fill: '#64748b' } }}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Scatter data={data}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={getColor(entry.score)}
                                opacity={0.8}
                            />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>

            {/* 推荐机会 */}
            {topOpportunities.length > 0 && (
                <div className="mt-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="text-emerald-600" size={16} />
                        <span className="text-xs font-black text-emerald-700 uppercase">Top 3 机会关键词</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {topOpportunities.map((opp, i) => (
                            <div key={i} className="bg-white p-3 rounded-xl border border-emerald-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg font-black text-emerald-600">#{i + 1}</span>
                                    <span className="text-xs font-black text-slate-700 line-clamp-1">{opp.keyword}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 space-y-0.5">
                                    <div>搜索量: <span className="font-bold text-slate-700">{opp.volume.toLocaleString()}</span></div>
                                    <div>竞争: <span className="font-bold text-slate-700">{opp.competition}%</span></div>
                                    <div>评分: <span className="font-bold text-emerald-600">{opp.score}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}
