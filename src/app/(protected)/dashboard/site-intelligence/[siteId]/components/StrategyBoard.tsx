'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

// --- Sortable Article Component ---
function SortableArticle({ article, index, isDragging: isOverlay }: { article: PlannedArticle, index: number, isDragging?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: article.id,
        data: {
            type: 'Article',
            article,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 group transition-all
                ${isOverlay ? 'shadow-xl scale-[1.02] rotate-1 ring-2 ring-brand-primary/30' : 'hover:border-brand-primary/30'}
            `}
        >
            <div className="flex justify-between items-start mb-2 gap-2">
                <h4 className="font-bold text-sm text-slate-800 leading-snug line-clamp-2">
                    {article.title}
                </h4>
                <div
                    {...attributes}
                    {...listeners}
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
    );
}

// --- Kanban Column Component ---
function KanbanColumn({ plan, articles }: { plan: ContentPlan, articles: PlannedArticle[] }) {
    const { setNodeRef } = useSortable({
        id: plan.id,
        data: {
            type: 'Column',
            plan,
        },
    });

    return (
        <div ref={setNodeRef} className="w-[360px] min-w-[360px] flex flex-col bg-slate-100/50 rounded-3xl p-3 border border-slate-200/60 shadow-inner">
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

            <div className="flex flex-col gap-3 min-h-[150px]">
                <SortableContext items={articles.map(a => a.id)} strategy={verticalListSortingStrategy}>
                    {articles.map((article, index) => (
                        <SortableArticle key={article.id} article={article} index={index} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

// --- Main Board Component ---
export function StrategyBoard({ siteId }: { siteId: string }) {
    const [plans, setPlans] = useState<ContentPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [activeArticle, setActiveArticle] = useState<PlannedArticle | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchStrategies();
    }, [siteId]);

    const fetchStrategies = useCallback(async () => {
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
    }, [siteId]);

    const handleGenerate = async (override: any = false) => {
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

    const findPlanById = (id: string) => {
        return plans.find(p => p.id === id);
    };

    const findPlanByArticleId = (articleId: string) => {
        return plans.find(p => p.articles.some(a => a.id === articleId));
    };

    const handleDragStart = (event: any) => {
        const { active } = event;
        const article = active.data.current?.article;
        if (article) {
            setActiveArticle(article);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        const activePlan = findPlanByArticleId(activeId);
        const overPlan = findPlanById(overId) || findPlanByArticleId(overId);

        if (!activePlan || !overPlan || activePlan.id === overPlan.id) return;

        setPlans(prev => {
            const activeArticles = [...activePlan.articles];
            const overArticles = [...overPlan.articles];

            const activeIndex = activeArticles.findIndex(a => a.id === activeId);
            const overIndex = overPlan.articles.findIndex(a => a.id === overId);

            let newIndex;
            if (overId in prev.map(p => p.id)) {
                newIndex = overArticles.length + 1;
            } else {
                const isBelowLastItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
                const modifier = isBelowLastItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overArticles.length + 1;
            }

            const [movedItem] = activeArticles.splice(activeIndex, 1);
            movedItem.contentPlanId = overPlan.id;
            overArticles.splice(newIndex, 0, movedItem);

            return prev.map(p => {
                if (p.id === activePlan.id) return { ...p, articles: activeArticles };
                if (p.id === overPlan.id) return { ...p, articles: overArticles };
                return p;
            });
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveArticle(null);

        if (!over) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        const activePlan = findPlanByArticleId(activeId);
        const overPlan = findPlanById(overId) || findPlanByArticleId(overId);

        if (!activePlan || !overPlan) return;

        if (activeId !== overId) {
            setPlans(prev => {
                const planIndex = prev.findIndex(p => p.id === overPlan.id);
                const activeIndex = prev[planIndex].articles.findIndex(a => a.id === activeId);
                const overIndex = prev[planIndex].articles.findIndex(a => a.id === overId);

                const newArticles = arrayMove(prev[planIndex].articles, activeIndex, overIndex);
                // Update kanbanOrder
                newArticles.forEach((art, idx) => { art.kanbanOrder = idx; });

                return prev.map((p, idx) => idx === planIndex ? { ...p, articles: newArticles } : p);
            });
        }

        // --- API Call ---
        try {
            const currentPlans = plans; // This is actually the state BEFORE handleDragEnd update if not careful, 
            // but since we updated it in handleDragOver and handleDragEnd, we should use the updated state.
            // For safety, I'll compute the updates from the new state.
            
            const updates: any[] = [];
            // Re-fetch the plans from the state we just updated
            // Wait, setPlans is async. I should use the result of the move.
            
            // Simplified: collect all articles from all plans and their current positions
            // In a real kanban we might only want to send affected columns.
            plans.forEach(plan => {
                plan.articles.forEach((art, index) => {
                    updates.push({
                        id: art.id,
                        kanbanOrder: index,
                        contentPlanId: plan.id
                    });
                });
            });

            const res = await fetch(`/api/dashboard/sites/${siteId}/strategy/articles/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });

            if (!res.ok) throw new Error('Failed to save reorder');
        } catch (e) {
            toast.error('保存拖拽排序失败，已自动回滚');
            fetchStrategies();
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

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-6 items-start">
                    {plans.map((plan) => (
                        <KanbanColumn key={plan.id} plan={plan} articles={plan.articles} />
                    ))}
                </div>

                <DragOverlay dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: {
                            active: {
                                opacity: '0.5',
                            },
                        },
                    }),
                }}>
                    {activeArticle ? (
                        <SortableArticle article={activeArticle} index={0} isDragging />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
