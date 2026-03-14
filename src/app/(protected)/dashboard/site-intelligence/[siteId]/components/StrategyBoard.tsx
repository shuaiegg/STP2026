'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GripVertical, Zap, CheckCircle2, Clock, PlayCircle, Loader2, RefreshCw, Layers, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PlannedArticle {
    id: string;
    contentPlanId: string;
    title: string;
    keyword: string;
    kanbanOrder: number;
    status: 'IDEATION' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED' | 'REFACTORING_NEEDED';
    targetChannel: 'SEO' | 'GOOGLE_ADS' | 'META_ADS';
}

interface ContentPlan {
    id: string;
    title: string;
    description: string;
    theme: string;
    priority: number;
    articles: PlannedArticle[];
}

export function StrategyBoard({ siteId }: { siteId: string }) {
    const [plans, setPlans] = useState<ContentPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchStrategies();
    }, [siteId]);

    const fetchStrategies = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/strategy`);
            const data = await res.json();
            if (data.success) {
                setPlans(data.data);
            } else {
                toast.error(data.error || '获取战略管线失败');
            }
        } catch (e) {
            toast.error('网络错误');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (override: any = false) => {
        // Prevent event being passed as override if called from onClick without args
        const isOverride = typeof override === 'boolean' ? override : false;
        setGenerating(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/strategy/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ override: isOverride })
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success('基于高优语义债的战略计划生成完毕！');
                await fetchStrategies();
            } else if (data.conflict) {
                if (window.confirm(data.message || '已存在进行中的计划，是否归档并重新生成？')) {
                    handleGenerate(true);
                } else {
                    setGenerating(false);
                }
            } else {
                toast.error(data.error || '生成失败');
                setGenerating(false);
            }
        } catch (e) {
            toast.error('生成过程中发生网络错误');
            setGenerating(false);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        // Dropped outside the list or didn't move
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // --- Optimistic UI Update ---
        const newPlans = [...plans];
        const sourcePlanIndex = newPlans.findIndex(p => p.id === source.droppableId);
        const destPlanIndex = newPlans.findIndex(p => p.id === destination.droppableId);

        const sourcePlan = newPlans[sourcePlanIndex];
        const destPlan = newPlans[destPlanIndex];

        const [movedArticle] = sourcePlan.articles.splice(source.index, 1);
        movedArticle.contentPlanId = destPlan.id; // Update parent id 

        // Insert into new position
        destPlan.articles.splice(destination.index, 0, movedArticle);

        // Update kanbanOrder for destination items to ensure array index matches order
        destPlan.articles.forEach((art, index) => {
            art.kanbanOrder = index;
        });

        // Also update source items if we moved within the same list, or out of it
        if (sourcePlanIndex !== destPlanIndex) {
            sourcePlan.articles.forEach((art, index) => {
                art.kanbanOrder = index;
            });
        }

        setPlans(newPlans);

        // --- API Call ---
        try {
            // Collect all updates from affected columns
            const updates: any[] = [];
            
            // Items from destination plan
            destPlan.articles.forEach((art, index) => {
                updates.push({
                    id: art.id,
                    kanbanOrder: index,
                    contentPlanId: destPlan.id
                });
            });

            // If moving between different plans, also update source plan items
            if (sourcePlanIndex !== destPlanIndex) {
                sourcePlan.articles.forEach((art, index) => {
                    updates.push({
                        id: art.id,
                        kanbanOrder: index,
                        contentPlanId: sourcePlan.id
                    });
                });
            }

            const res = await fetch(`/api/dashboard/sites/${siteId}/strategy/articles/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });

            if (!res.ok) throw new Error('Failed to save reorder');

        } catch (e) {
            toast.error('保存拖拽排序失败，已自动回滚');
            fetchStrategies(); // revert by fetching fresh state from server
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 size={12} className="text-emerald-500" />;
            case 'IN_PROGRESS': return <Loader2 size={12} className="text-blue-500 animate-spin" />;
            case 'PLANNED': return <PlayCircle size={12} className="text-amber-500" />;
            case 'REFACTORING_NEEDED': return <AlertCircle size={12} className="text-rose-500" />;
            default: return <Clock size={12} className="text-slate-400" />;
        }
    };

    if (loading) {
        return (
            <div className="flex gap-6 animate-pulse p-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-[350px] space-y-4">
                        <div className="h-16 w-full rounded-2xl bg-slate-200" />
                        <div className="h-24 w-full rounded-2xl bg-slate-200" />
                        <div className="h-24 w-full rounded-2xl bg-slate-200" />
                    </div>
                ))}
            </div>
        );
    }

    if (plans.length === 0) {
        return (
            <div className="text-center py-24 px-6 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="mx-auto w-20 h-20 bg-white shadow-sm rounded-2xl flex items-center justify-center text-brand-primary mb-6 rotate-3">
                    <Layers size={32} />
                </div>
                <h3 className="text-2xl font-black font-display tracking-tight text-slate-800 mb-2">未发现主题战略大纲</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
                    引擎可以通过分析您的“高优语义债”，为您自动编排以抢占流量为目标的主题支柱 (Pillar) 以及下辖的集群文章 (Cluster)。
                </p>
                <Button
                    onClick={() => handleGenerate()}
                    disabled={generating}
                    size="lg"
                    className="bg-brand-primary text-white hover:bg-brand-primary-light shadow-xl shadow-brand-primary/20 font-black rounded-xl px-8"
                >
                    {generating ? (
                        <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> 正在根据语义债重写战略图谱...</>
                    ) : (
                        <><Zap className="mr-2 h-4 w-4" /> 一键生成内容战略计划</>
                    )}
                </Button>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto pb-8 -mx-6 px-6">
            <div className="flex justify-between items-center mb-6 min-w-[800px]">
                <div>
                    <h2 className="text-xl font-black font-display text-slate-800 flex items-center gap-2">
                        <Layers className="text-brand-primary" />
                        内容战略实施看板 (Omnichannel Kanban)
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                        拖拽文章卡片调整执行优先级。每一个垂直泳道代表一个旨在吃透特定语义流量的主题支柱。
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchStrategies} className="border-slate-200 text-slate-600 font-bold rounded-lg shadow-sm">
                    <RefreshCw size={14} className="mr-2" /> 强制刷新
                </Button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-6 items-start">
                    {plans.map((plan) => (
                        <div key={plan.id} className="w-[360px] min-w-[360px] flex flex-col bg-slate-100/50 rounded-3xl p-3 border border-slate-200/60 shadow-inner">
                            {/* Pillar Header */}
                            <div className="px-4 py-3 mb-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-brand-primary/10 to-transparent rounded-bl-3xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex justify-between items-start">
                                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-brand-primary/20 bg-brand-primary/5 text-brand-primary">
                                        PILLAR {plan.priority + 1}
                                    </span>
                                    <Badge className="bg-white border text-xs text-slate-500 truncate max-w-[120px]">
                                        {plan.theme || '核心支柱'}
                                    </Badge>
                                </div>
                                <h3 className="font-bold text-slate-800 leading-snug">
                                    {plan.title}
                                </h3>
                                <div className="text-xs text-slate-400 font-medium line-clamp-2">
                                    {plan.description}
                                </div>
                            </div>

                            {/* Cards Droppable Area */}
                            <Droppable droppableId={plan.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 transition-colors rounded-2xl min-h-[150px] ${snapshot.isDraggingOver ? 'bg-brand-primary/5' : ''
                                            }`}
                                    >
                                        <div className="flex flex-col gap-3">
                                            {plan.articles.map((article, index) => (
                                                <Draggable key={article.id} draggableId={article.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 group transition-all
                                                                ${snapshot.isDragging ? 'shadow-xl scale-[1.02] rotate-1 ring-2 ring-brand-primary/30' : 'hover:border-brand-primary/30'}
                                                            `}
                                                            style={provided.draggableProps.style}
                                                        >
                                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                                <h4 className="font-bold text-sm text-slate-800 leading-snug line-clamp-2">
                                                                    {article.title}
                                                                </h4>
                                                                <div
                                                                    {...provided.dragHandleProps}
                                                                    className="text-slate-300 hover:text-brand-primary cursor-grab active:cursor-grabbing p-1 -mr-2 -mt-1 rounded-md"
                                                                >
                                                                    <GripVertical size={16} />
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 mb-3">
                                                                <span className="bg-slate-50 text-slate-500 px-2 py-1 rounded-md text-[10px] font-bold font-mono tracking-tight flex items-center gap-1">
                                                                    🎯 {article.keyword}
                                                                </span>
                                                                <span className="bg-indigo-50 text-indigo-500 px-2 py-1 rounded-md text-[10px] font-bold tracking-tight">
                                                                    {article.targetChannel}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                                <div className={`flex items-center gap-1.5 text-xs font-bold ${article.status === 'REFACTORING_NEEDED' ? 'text-rose-600' : 'text-slate-500'}`}>
                                                                    {getStatusIcon(article.status)}
                                                                    <span>{article.status === 'REFACTORING_NEEDED' ? '需要重构' : article.status.replace('_', ' ')}</span>
                                                                </div>
                                                                {article.status !== 'COMPLETED' && (
                                                                    <Button size="sm" variant="ghost" className={`h-7 text-[10px] font-black tracking-widest ml-auto px-2 ${article.status === 'REFACTORING_NEEDED' ? 'text-rose-600 hover:bg-rose-50' : 'text-brand-primary hover:bg-brand-primary/10'}`}>
                                                                        {article.status === 'REFACTORING_NEEDED' ? '立即优化' : '交给 AI 撰写'} <Zap size={10} className="ml-1" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
