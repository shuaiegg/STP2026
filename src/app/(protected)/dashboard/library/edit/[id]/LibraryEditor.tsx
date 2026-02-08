"use client";

import React, { useState, useEffect } from 'react';
import { 
    Save, ArrowLeft, Wand2, Globe, TrendingUp, 
    ChevronRight, Loader2, Sparkles, AlertCircle,
    LayoutDashboard, Library, CheckCircle2, Copy
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EditableSection } from '@/components/editor/EditableSection';
import { parseMarkdownToSections, joinSectionsToMarkdown, ContentSection } from '@/lib/utils/markdown-sections';
import { calculateHumanScore } from '@/lib/utils/ai-detection';
import { updateTrackedArticle } from '@/app/actions/update-article';

export function LibraryEditor({ initialArticle }: { initialArticle: any }) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState(initialArticle.title);
    const [contentSections, setContentSections] = useState<ContentSection[]>([]);
    const [liveHumanScore, setLiveHumanScore] = useState<number | null>(null);

    // Rehydration: Turn static markdown into editable sections
    useEffect(() => {
        if (initialArticle.optimizedContent) {
            const sections = parseMarkdownToSections(initialArticle.optimizedContent);
            setContentSections(sections);
        }
    }, [initialArticle.optimizedContent]);

    // Live scoring logic
    useEffect(() => {
        if (contentSections.length > 0) {
            const fullText = joinSectionsToMarkdown(contentSections);
            const score = calculateHumanScore(fullText);
            setLiveHumanScore(score);
        }
    }, [contentSections]);

    const handleSectionSave = (id: string, newBody: string) => {
        const updated = contentSections.map(s => 
            s.id === id ? { ...s, body: newBody } : s
        );
        setContentSections(updated);
        toast.info("段落已在内存中更新，别忘了点击顶部保存按钮。");
    };

    const handleRegenerate = async (section: ContentSection, instruction: string) => {
        const loadingId = toast.loading('AI 正在重塑段落...');
        try {
            const response = await fetch('/api/skills/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skillName: 'stellar-writer',
                    input: {
                        researchMode: 'section_regenerate',
                        sectionHeading: section.heading,
                        sectionContent: section.body,
                        sectionInstruction: instruction,
                        keywords: initialArticle.keywords?.[0] || 'SEO Content'
                    }
                })
            });

            const data = await response.json();
            if (!data.success || !data.output?.data?.content) {
                throw new Error(data.error || 'AI 重写失败');
            }

            // Note: Per user's direction, we could add a preview here. 
            // For MVP re-use, we directly update but we could add a "Apply" step.
            const newContent = data.output.data.content;
            const updated = contentSections.map(s => 
                s.id === section.id ? { ...s, body: newContent } : s
            );
            setContentSections(updated);
            
            toast.success('AI 段落刷新成功！', { id: loadingId });
            return true;
        } catch (error: any) {
            toast.error(error.message, { id: loadingId });
            return false;
        }
    };

    const handleFinalSave = async () => {
        setIsSaving(true);
        try {
            const fullContent = joinSectionsToMarkdown(contentSections);
            const result = await updateTrackedArticle({
                id: initialArticle.id,
                title: title,
                optimizedContent: fullContent,
            });

            if (result.success) {
                toast.success("改动已永久存入资产库！");
                router.refresh();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("保存过程中出现异常");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border-2 border-slate-100 sticky top-24 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/library">
                        <Button variant="ghost" size="sm" className="rounded-xl text-slate-400 hover:text-slate-600">
                            <ArrowLeft size={18} />
                        </Button>
                    </Link>
                    <div className="h-8 w-px bg-slate-100 mx-1" />
                    <div>
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-xl font-black text-slate-800 bg-transparent border-none outline-none focus:ring-0 w-full md:w-[400px]"
                            placeholder="文章标题..."
                        />
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 text-[9px] uppercase font-black tracking-widest">
                                Editing Asset
                            </Badge>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {initialArticle.id.split('-')[0]}...</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={handleFinalSave}
                        disabled={isSaving}
                        className="bg-brand-primary text-white font-black px-8 py-6 border-2 border-black shadow-[6px_6px_0_0_rgba(10,10,10,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                        {isSaving ? '正在加固中...' : '提交修改并入库'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content: 70% */}
                <div className="lg:col-span-8 space-y-4">
                    <Card className="p-10 bg-white border-2 border-slate-100 rounded-[32px] min-h-[800px] shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                            <Sparkles size={180} />
                        </div>
                        
                        <div className="space-y-6 relative z-10">
                            {contentSections.map((section) => (
                                <EditableSection 
                                    key={section.id}
                                    section={section}
                                    onSave={handleSectionSave}
                                    onRegenerate={(inst) => handleRegenerate(section, inst)}
                                />
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Sidebar Stats: 30% */}
                <div className="lg:col-span-4 space-y-8">
                    {/* SEO Radar */}
                    <Card className="p-8 border-2 border-slate-100 bg-white rounded-3xl shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                            <TrendingUp size={16} className="text-brand-secondary" /> 实时内容健康度 (Radar)
                        </h3>
                        
                        <div className="space-y-8">
                            <div className="flex flex-col items-center">
                                <div className={`text-6xl font-black mb-2 font-display italic ${liveHumanScore && liveHumanScore > 80 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                    {liveHumanScore || '--'}%
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Human-Like Score</span>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50 text-[11px] font-medium text-slate-500 leading-relaxed italic">
                                “杰克，目前的文本读起来非常像真人撰写。如果你继续增加案例研究，GEO 权重还会进一步提升。”
                            </div>
                        </div>
                    </Card>

                    {/* Keywords */}
                    <Card className="p-8 border-2 border-slate-100 bg-white rounded-3xl shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Globe size={16} className="text-brand-primary" /> 核心关键词
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {initialArticle.keywords?.map((kw: string, i: number) => (
                                <Badge key={i} className="bg-slate-50 text-slate-500 border-slate-100 px-3 py-1.5 font-black uppercase text-[10px]">
                                    #{kw}
                                </Badge>
                            ))}
                        </div>
                    </Card>

                    <div className="p-6 bg-brand-primary/5 rounded-3xl border-2 border-dashed border-brand-primary/20">
                        <div className="flex gap-4 items-start">
                            <div className="mt-1"><AlertCircle size={20} className="text-brand-primary" /></div>
                            <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                                请注意：修改正文可能会影响到搜索引擎的引用检测。建议每次大幅修改后，在 24 小时后查看最新的流量轨迹。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
