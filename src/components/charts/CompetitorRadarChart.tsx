"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Target } from 'lucide-react';
import type { DetailedSEOScore } from '@/lib/utils/seo-scoring';

// Dynamically import Recharts with ssr: false
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const RadarChart = dynamic(() => import('recharts').then(mod => mod.RadarChart), { ssr: false });
const Radar = dynamic(() => import('recharts').then(mod => mod.Radar), { ssr: false });
const PolarGrid = dynamic(() => import('recharts').then(mod => mod.PolarGrid), { ssr: false });
const PolarAngleAxis = dynamic(() => import('recharts').then(mod => mod.PolarAngleAxis), { ssr: false });
const PolarRadiusAxis = dynamic(() => import('recharts').then(mod => mod.PolarRadiusAxis), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });

interface CompetitorRadarChartProps {
    myScore: DetailedSEOScore;
    competitors?: any[];
}

export function CompetitorRadarChart({ myScore, competitors = [] }: CompetitorRadarChartProps) {
    // 计算竞品平均分（简化版，实际应该从竞品数据分析）
    // 如果没有竞品数据，使用行业标准分数
    const competitorAverage = {
        title: 75,
        description: 70,
        keywords: 68,
        readability: 72,
        structure: 65,
        images: 60
    };

    // 准备雷达图数据
    const data = [
        {
            metric: '标题优化',
            mine: myScore.breakdown.title.score,
            average: competitorAverage.title,
            fullMark: 100
        },
        {
            metric: '描述优化',
            mine: myScore.breakdown.description.score,
            average: competitorAverage.description,
            fullMark: 100
        },
        {
            metric: '关键词使用',
            mine: myScore.breakdown.keywords.score,
            average: competitorAverage.keywords,
            fullMark: 100
        },
        {
            metric: '可读性',
            mine: myScore.breakdown.readability.score,
            average: competitorAverage.readability,
            fullMark: 100
        },
        {
            metric: '结构完整性',
            mine: myScore.breakdown.structure.score,
            average: competitorAverage.structure,
            fullMark: 100
        },
        {
            metric: '图片优化',
            mine: myScore.breakdown.images.score,
            average: competitorAverage.images,
            fullMark: 100
        }
    ];

    // 计算优势和劣势
    const strengths = data.filter(d => d.mine > d.average).sort((a, b) => (b.mine - b.average) - (a.mine - a.average));
    const weaknesses = data.filter(d => d.mine < d.average).sort((a, b) => (a.mine - a.average) - (b.mine - b.average));

    // 自定义Tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length > 0) {
            const data = payload[0].payload;
            const diff = data.mine - data.average;
            return (
                <div className="bg-white border-2 border-slate-200 rounded-xl p-3 shadow-lg">
                    <p className="font-black text-sm text-slate-800 mb-2">{data.metric}</p>
                    <div className="space-y-1 text-xs">
                        <p className="text-blue-600"><span className="font-bold">我的:</span> {data.mine}</p>
                        <p className="text-slate-500"><span className="font-bold">平均:</span> {data.average}</p>
                        <p className={`font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                            {diff > 0 ? '领先 ' : diff < 0 ? '落后 ' : '持平 '}
                            {Math.abs(diff)}分
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="p-8 border-2 border-slate-100 rounded-3xl bg-white">
            <div className="mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Target className="text-purple-500" size={24} />
                    竞品对比雷达图
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                    多维度竞争力分析
                </p>
            </div>

            {/* 雷达图 */}
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis
                            dataKey="metric"
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Radar
                            name="我的内容"
                            dataKey="mine"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.6}
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 4 }}
                        />
                        <Radar
                            name="行业平均"
                            dataKey="average"
                            stroke="#94a3b8"
                            fill="#94a3b8"
                            fillOpacity={0.3}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#94a3b8', r: 3 }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            iconType="circle"
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* 分析总结 */}
            <div className="mt-6 grid grid-cols-2 gap-4">
                {/* 优势 */}
                {strengths.length > 0 && (
                    <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                        <div className="text-xs font-black text-emerald-700 uppercase mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            优势维度
                        </div>
                        <div className="space-y-2">
                            {strengths.slice(0, 3).map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-xs">
                                    <span className="text-slate-700 font-semibold">{item.metric}</span>
                                    <span className="font-black text-emerald-600">
                                        +{item.mine - item.average}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 待提升 */}
                {weaknesses.length > 0 && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                        <div className="text-xs font-black text-red-700 uppercase mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            待提升维度
                        </div>
                        <div className="space-y-2">
                            {weaknesses.slice(0, 3).map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-xs">
                                    <span className="text-slate-700 font-semibold">{item.metric}</span>
                                    <span className="font-black text-red-600">
                                        {item.mine - item.average}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 如果没有劣势，显示祝贺 */}
                {weaknesses.length === 0 && strengths.length > 0 && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                        <div className="text-xs font-black text-blue-700 uppercase mb-2">🎉 全面领先</div>
                        <p className="text-xs text-blue-600">您的内容在所有维度都超过行业平均水平！</p>
                    </div>
                )}
            </div>
        </Card>
    );
}
