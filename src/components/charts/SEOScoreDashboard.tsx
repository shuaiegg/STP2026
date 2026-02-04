"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/Card';
import { BarChart3 } from 'lucide-react';
import type { DetailedSEOScore } from '@/lib/utils/seo-scoring';

interface SEOScoreDashboardProps {
    score: DetailedSEOScore;
}

export function SEOScoreDashboard({ score }: SEOScoreDashboardProps) {
    // 颜色映射
    const getColor = (value: number): string => {
        if (value >= 90) return '#10b981'; // 绿色
        if (value >= 70) return '#f59e0b'; // 黄色
        if (value >= 50) return '#fb923c'; // 橙色
        return '#ef4444'; // 红色
    };

    // 获取状态标签
    const getLabel = (value: number): string => {
        if (value >= 90) return '优秀';
        if (value >= 70) return '良好';
        if (value >= 50) return '需改进';
        return '急需优化';
    };

    // 准备主评分的饼图数据
    const mainChartData = [
        { name: 'score', value: score.overall },
        { name: 'remaining', value: 100 - score.overall }
    ];

    // 细项数据
    const breakdownItems = [
        { key: 'title', label: '标题', ...score.breakdown.title },
        { key: 'description', label: '描述', ...score.breakdown.description },
        { key: 'keywords', label: '关键词', ...score.breakdown.keywords },
        { key: 'readability', label: '可读性', ...score.breakdown.readability },
        { key: 'structure', label: '结构', ...score.breakdown.structure },
        { key: 'images', label: '图片', ...score.breakdown.images },
    ];

    return (
        <Card className="p-8 border-2 border-slate-100 rounded-3xl bg-white">
            <div className="mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <BarChart3 className="text-blue-500" size={24} />
                    SEO评分仪表盘
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                    综合评分与细项分析
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 主评分圆环图 */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative">
                        <ResponsiveContainer width={200} height={200}>
                            <PieChart>
                                <Pie
                                    data={mainChartData}
                                    cx={100}
                                    cy={100}
                                    startAngle={90}
                                    endAngle={-270}
                                    innerRadius={60}
                                    outerRadius={80}
                                    dataKey="value"
                                    animationDuration={1000}
                                >
                                    <Cell fill={getColor(score.overall)} />
                                    <Cell fill="#e5e7eb" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-5xl font-black ${getColor(score.overall).replace('#', 'text-').replace('10b981', 'emerald-500').replace('f59e0b', 'amber-500').replace('fb923c', 'orange-500').replace('ef4444', 'red-500')}`}>
                                {score.overall}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase mt-1">总分</span>
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <div className={`inline-block px-4 py-1 rounded-full text-xs font-black ${score.overall >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                score.overall >= 70 ? 'bg-amber-100 text-amber-700' :
                                    score.overall >= 50 ? 'bg-orange-100 text-orange-700' :
                                        'bg-red-100 text-red-700'
                            }`}>
                            {getLabel(score.overall)}
                        </div>
                    </div>
                </div>

                {/* 细项进度条 */}
                <div className="space-y-4">
                    {breakdownItems.map((item) => (
                        <div key={item.key}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-600">{item.label}</span>
                                <span className={`text-sm font-black ${item.score >= 90 ? 'text-emerald-600' :
                                        item.score >= 70 ? 'text-amber-600' :
                                            item.score >= 50 ? 'text-orange-600' :
                                                'text-red-600'
                                    }`}>
                                    {item.score}
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${item.score}%`,
                                        backgroundColor: getColor(item.score),
                                        transitionDelay: '200ms'
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 评分说明 */}
            <div className="mt-6 pt-6 border-t-2 border-slate-100">
                <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                        <div className="text-lg font-black text-emerald-600">90+</div>
                        <div className="text-[10px] font-bold text-emerald-700 uppercase">优秀</div>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg">
                        <div className="text-lg font-black text-amber-600">70-89</div>
                        <div className="text-[10px] font-bold text-amber-700 uppercase">良好</div>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg">
                        <div className="text-lg font-black text-orange-600">50-69</div>
                        <div className="text-[10px] font-bold text-orange-700 uppercase">需改进</div>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg">
                        <div className="text-lg font-black text-red-600">&lt;50</div>
                        <div className="text-[10px] font-bold text-red-700 uppercase">急需优化</div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
