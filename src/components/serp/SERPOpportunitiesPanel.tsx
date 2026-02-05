/**
 * SERP Opportunities Panel
 * Displays SERP analysis results and SEO opportunities
 */

import React from 'react';
import { SERPAnalysis } from '@/lib/external/serp-analyzer';
import { Target, TrendingUp, Zap, AlertCircle, CheckCircle2, Circle } from 'lucide-react';

interface Props {
    analysis: SERPAnalysis;
}

export function SERPOpportunitiesPanel({ analysis }: Props) {
    const { featuredSnippet, peopleAlsoAsk, serpFeatures, recommendations } = analysis;

    return (
        <div className="space-y-6">
            {/* 标题 */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                    <Target className="text-purple-600" size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-brand-text-primary">
                        SERP机会洞察
                    </h3>
                    <p className="text-sm text-slate-500 font-semibold">
                        精准识别可抢占的SERP特征
                    </p>
                </div>
            </div>

            {/* Featured Snippet机会 */}
            {featuredSnippet && (
                <div className={`rounded-2xl p-6 border-2 ${featuredSnippet.opportunity === 'high'
                        ? 'bg-emerald-50 border-emerald-200'
                        : featuredSnippet.opportunity === 'medium'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                    }`}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${featuredSnippet.opportunity === 'high'
                                    ? 'bg-emerald-200'
                                    : featuredSnippet.opportunity === 'medium'
                                        ? 'bg-amber-200'
                                        : 'bg-slate-200'
                                }`}>
                                <TrendingUp className={
                                    featuredSnippet.opportunity === 'high'
                                        ? 'text-emerald-700'
                                        : featuredSnippet.opportunity === 'medium'
                                            ? 'text-amber-700'
                                            : 'text-slate-600'
                                } size={20} />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-800">
                                    Featured Snippet {featuredSnippet.exists ? '分析' : '机会'}
                                </h4>
                                <p className="text-xs text-slate-500 font-semibold">
                                    {featuredSnippet.exists ? '已存在' : '不存在 - 高价值机会！'}
                                </p>
                            </div>
                        </div>

                        <span className={`text-xs font-black px-3 py-1 rounded-full ${featuredSnippet.opportunity === 'high'
                                ? 'bg-emerald-200 text-emerald-800'
                                : featuredSnippet.opportunity === 'medium'
                                    ? 'bg-amber-200 text-amber-800'
                                    : 'bg-slate-200 text-slate-700'
                            }`}>
                            {featuredSnippet.opportunity === 'high' ? '高机会' :
                                featuredSnippet.opportunity === 'medium' ? '中机会' : '低机会'}
                        </span>
                    </div>

                    {featuredSnippet.exists && featuredSnippet.currentHolder && (
                        <div className="mb-4 p-3 bg-white/60 rounded-lg">
                            <p className="text-xs font-black text-slate-600 mb-1">当前持有者</p>
                            <p className="text-sm font-bold text-slate-800">{featuredSnippet.currentHolder.domain}</p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {featuredSnippet.currentHolder.content}
                            </p>
                        </div>
                    )}

                    <div className="mb-4">
                        <p className="text-sm font-semibold text-slate-700">{featuredSnippet.reason}</p>
                    </div>

                    <div className="mb-3">
                        <p className="text-xs font-black text-slate-600 mb-2">推荐格式</p>
                        <p className="text-sm text-slate-700">{featuredSnippet.recommendedFormat}</p>
                    </div>

                    <div>
                        <p className="text-xs font-black text-slate-600 mb-2">行动步骤</p>
                        <ul className="space-y-1.5">
                            {featuredSnippet.actionSteps.map((step, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className={`shrink-0 mt-0.5 ${featuredSnippet.opportunity === 'high'
                                            ? 'text-emerald-600'
                                            : 'text-amber-600'
                                        }`} size={14} />
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* People Also Ask问题 */}
            {peopleAlsoAsk.length > 0 && (
                <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center">
                            <AlertCircle className="text-blue-700" size={20} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-800">
                                People Also Ask 问题
                            </h4>
                            <p className="text-xs text-slate-500 font-semibold">
                                {peopleAlsoAsk.length} 个相关问题
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        {peopleAlsoAsk.slice(0, 6).map((q, i) => (
                            <div key={i} className="bg-white rounded-xl p-4">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <p className="text-sm font-bold text-slate-800 flex-1">
                                        {q.question}
                                    </p>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded shrink-0 ${q.priority === 'high'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : q.priority === 'medium'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {q.priority}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-xs">
                                    <span className={`font-semibold ${q.coveredByCompetitors ? 'text-orange-600' : 'text-emerald-600'
                                        }`}>
                                        {q.coveredByCompetitors ? '已被覆盖' : '未被覆盖 ✨'}
                                    </span>
                                    <span className="text-slate-500">
                                        难度: {q.difficulty}/100
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {peopleAlsoAsk.length > 6 && (
                        <p className="text-xs text-center text-blue-600 font-semibold mt-3">
                            还有 {peopleAlsoAsk.length - 6} 个问题未显示
                        </p>
                    )}
                </div>
            )}

            {/* SERP特征检测 */}
            <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200">
                <h4 className="text-lg font-black text-slate-800 mb-4">SERP特征检测</h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(serpFeatures).map(([key, value]) => {
                        const labels: Record<string, string> = {
                            hasVideo: '视频',
                            hasImages: '图片',
                            hasKnowledgePanel: '知识面板',
                            hasFAQ: 'FAQ',
                            hasLocalPack: '本地包',
                            hasShopping: '购物',
                            hasNewsResults: '新闻'
                        };

                        return (
                            <div key={key} className={`p-3 rounded-lg border-2 ${value ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-200'
                                }`}>
                                <div className="flex items-center gap-2">
                                    {value ? (
                                        <CheckCircle2 className="text-purple-600" size={16} />
                                    ) : (
                                        <Circle className="text-slate-300" size={16} />
                                    )}
                                    <span className={`text-xs font-bold ${value ? 'text-purple-800' : 'text-slate-400'
                                        }`}>
                                        {labels[key] || key}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 优先行动建议 */}
            {recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="text-purple-600" size={20} />
                        <h4 className="text-lg font-black text-purple-900">
                            优先行动建议
                        </h4>
                    </div>

                    <div className="space-y-3">
                        {recommendations.slice(0, 3).map((rec, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 border border-purple-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-black text-slate-800">
                                        {rec.targetFeature}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {rec.estimatedTraffic && (
                                            <span className="text-xs text-slate-500">
                                                预估流量: +{rec.estimatedTraffic}%
                                            </span>
                                        )}
                                        <span className={`text-xs font-black px-2 py-1 rounded ${rec.opportunity === 'high' ? 'bg-emerald-100 text-emerald-700' :
                                                rec.opportunity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {rec.opportunity}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-600 mb-3">{rec.reason}</p>

                                <ul className="space-y-1">
                                    {rec.actionSteps.slice(0, 3).map((step, j) => (
                                        <li key={j} className="text-xs text-slate-500 flex items-start gap-2">
                                            <span className="text-purple-500 mt-0.5">•</span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
