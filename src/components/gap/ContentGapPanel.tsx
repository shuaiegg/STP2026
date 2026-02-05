import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Plus, Search, Lightbulb, Users } from 'lucide-react';

interface ContentGapPanelProps {
    data: {
        score: number;
        missingKeywords: {
            term: string;
            volume: number;
            reason: string;
        }[];
        competitorTopics: {
            term: string;
            frequency: number;
            sources: string[];
        }[];
    };
    onAddTopic: (topic: string) => void;
}

export function ContentGapPanel({ data, onAddTopic }: ContentGapPanelProps) {
    if (!data) return null;

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500 bg-emerald-50';
        if (score >= 60) return 'text-amber-500 bg-amber-50';
        return 'text-rose-500 bg-rose-50';
    };

    return (
        <Card className="p-6 border-2 border-brand-border-heavy bg-white rounded-3xl animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                        <Lightbulb size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-brand-text-primary font-display uppercase tracking-tight">内容差距分析</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Topic Coverage:</span>
                            <Badge className={`${getScoreColor(data.score)} border-none`}>
                                {data.score}/100
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Missing Keywords Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Search size={14} className="text-slate-400" />
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">缺失的高流量关键词</h3>
                    </div>

                    {data.missingKeywords.length === 0 ? (
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600 text-sm flex items-center gap-2">
                            Perfect! You covered all top keywords.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {data.missingKeywords.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-purple-200 transition-colors group">
                                    <div>
                                        <div className="font-bold text-slate-700 text-sm">{item.term}</div>
                                        <div className="text-[10px] text-slate-400">Vol: {item.volume}</div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 rounded-full hover:bg-purple-100 hover:text-purple-600"
                                        onClick={() => onAddTopic(item.term)}
                                        title="Add to outline"
                                    >
                                        <Plus size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Competitor Angles Column */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={14} className="text-slate-400" />
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">竞品独有话题角度</h3>
                    </div>

                    {data.competitorTopics.length === 0 ? (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-sm italic">
                            No unique angles detected.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {data.competitorTopics.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl hover:border-amber-200 transition-colors group">
                                    <div>
                                        <div className="font-bold text-slate-700 text-sm">{item.term}</div>
                                        <div className="text-[10px] text-amber-600/70 flex items-center gap-1">
                                            <AlertTriangle size={10} />
                                            Used in {item.frequency} competitors
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 rounded-full hover:bg-amber-100 hover:text-amber-700"
                                        onClick={() => onAddTopic(item.term)}
                                        title="Add to outline"
                                    >
                                        <Plus size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
