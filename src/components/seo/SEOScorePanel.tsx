"use client";

import React from 'react';
import { AlertCircle, Lightbulb, TrendingUp, Eye, FileText, Image as ImageIcon, Type, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { DetailedSEOScore, ScoreItem } from '@/lib/utils/seo-scoring';

interface SEOScorePanelProps {
    score: DetailedSEOScore;
}

export function SEOScorePanel({ score }: SEOScorePanelProps) {
    return (
        <div className="space-y-6">
            {/* 总分显示 */}
            <div className="text-center p-8 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 rounded-2xl border-2 border-brand-border">
                <div className={`text-7xl font-black ${getScoreColor(score.overall)}`}>
                    {score.overall}
                </div>
                <div className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-wide">SEO 综合评分</div>
                <div className="mt-4">
                    <Badge className={`${getScoreBadgeColor(score.overall)} text-xs font-bold px-4 py-1`}>
                        {getScoreLabel(score.overall)}
                    </Badge>
                </div>
            </div>

            {/* 细项评分 */}
            <div className="space-y-4">
                <ScoreDetailCard
                    label="标题优化"
                    icon={<Type size={20} />}
                    item={score.breakdown.title}
                />
                <ScoreDetailCard
                    label="描述优化"
                    icon={<FileText size={20} />}
                    item={score.breakdown.description}
                />
                <ScoreDetailCard
                    label="关键词使用"
                    icon={<TrendingUp size={20} />}
                    item={score.breakdown.keywords}
                />
                <ScoreDetailCard
                    label="可读性"
                    icon={<Eye size={20} />}
                    item={score.breakdown.readability}
                />
                <ScoreDetailCard
                    label="结构完整性"
                    icon={<FileText size={20} />}
                    item={score.breakdown.structure}
                />
                <ScoreDetailCard
                    label="图片优化"
                    icon={<ImageIcon size={20} />}
                    item={score.breakdown.images}
                />
            </div>
        </div>
    );
}

interface ScoreDetailCardProps {
    label: string;
    icon: React.ReactNode;
    item: ScoreItem;
}

function ScoreDetailCard({ label, icon, item }: ScoreDetailCardProps) {
    return (
        <Card className="border-2 border-slate-100 rounded-xl p-6 hover:border-brand-primary/30 transition-all">
            {/* 标题行 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                    <div className="flex items-center gap-2">
                        {icon}
                        <h4 className="font-black text-sm">{label}</h4>
                    </div>
                    <Badge className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5">
                        {(item.weight * 100).toFixed(0)}% 权重
                    </Badge>
                </div>
                <div className={`text-2xl font-black ${getScoreColor(item.score)}`}>
                    {item.score}
                </div>
            </div>

            {/* 进度条 */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div
                    className={`h-full transition-all duration-700 ${getScoreBarColor(item.score)}`}
                    style={{ width: `${item.score}%` }}
                />
            </div>

            {/* 具体指标 */}
            {item.metrics && Object.keys(item.metrics).length > 0 && (
                <div className="flex flex-wrap gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
                    {Object.entries(item.metrics).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400 font-semibold">{formatMetricKey(key)}:</span>
                            <span className="font-bold text-slate-700">{String(value)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* 问题列表 */}
            {item.issues.length > 0 && (
                <div className="space-y-2 mb-4 p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 text-[10px] font-black text-red-600 uppercase">
                        <AlertCircle size={12} />
                        发现问题 ({item.issues.length})
                    </div>
                    {item.issues.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                            <span className="text-red-400 font-bold">•</span>
                            <span>{issue}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* 改进建议 */}
            {item.suggestions.length > 0 && (
                <div className="space-y-2 p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                        <Lightbulb size={12} />
                        改进建议 ({item.suggestions.length})
                    </div>
                    {item.suggestions.map((suggestion, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                            <span>{suggestion}</span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// 辅助函数
function getScoreColor(score: number): string {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
}

function getScoreBarColor(score: number): string {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
}

function getScoreBadgeColor(score: number): string {
    if (score >= 90) return 'bg-emerald-100 text-emerald-700 border border-emerald-300';
    if (score >= 70) return 'bg-amber-100 text-amber-700 border border-amber-300';
    if (score >= 50) return 'bg-orange-100 text-orange-700 border border-orange-300';
    return 'bg-red-100 text-red-700 border border-red-300';
}

function getScoreLabel(score: number): string {
    if (score >= 90) return '优秀';
    if (score >= 70) return '良好';
    if (score >= 50) return '需要改进';
    return '急需优化';
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'excellent': return 'bg-emerald-500';
        case 'good': return 'bg-amber-500';
        case 'needs-improvement': return 'bg-orange-500';
        case 'critical': return 'bg-red-500';
        default: return 'bg-slate-300';
    }
}

function formatMetricKey(key: string): string {
    const map: Record<string, string> = {
        length: '长度',
        keywordPosition: '关键词位置',
        density: '密度',
        count: '出现次数',
        inFirstParagraph: '首段包含',
        inHeadings: '标题中出现',
        fleschScore: 'Flesch评分',
        avgSentenceLength: '平均句长',
        avgSyllablesPerWord: '平均音节',
        h1Count: 'H1数量',
        h2Count: 'H2数量',
        imageCount: '图片数量',
        imagesWithAlt: 'Alt文本',
        total: '总计',
        withAlt: '已优化'
    };
    return map[key] || key;
}
