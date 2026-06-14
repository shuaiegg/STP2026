'use client';

import React, { useState } from 'react';
import { Save, RefreshCw, ChevronDown, ChevronUp, Sparkles, CheckCircle, AlertCircle, Lightbulb, Edit, Layout, List, Code as CodeIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateContentMetadata, updateSeoMetadata, analyzeContentSeo, associateTranslation, dissociateTranslation, createCategory, createAuthor } from '@/app/actions/content';
import { parseMarkdownToSections, joinSectionsToMarkdown, ContentSection } from '@/lib/utils/markdown-sections';
import { EditableSection } from '@/components/editor/EditableSection';
import { OutlineEditor, OutlineNode } from '@/components/editor/OutlineEditor';
import { uploadMediaAction } from '@/app/actions/media';
import { toast } from 'sonner';

interface SeoMeta {
    metaTitle?: string | null;
    metaDescription?: string | null;
    canonicalUrl?: string | null;
    noIndex?: boolean;
    // New SEO/GEO fields
    keywords?: string[];
    schemaJson?: string | null;
    geoScore?: number | null;
    geoAuditedAt?: Date | null;
    snippetLinkedIn?: string | null;
    snippetReddit?: string | null;
    snippetTwitter?: string | null;
    suggestedLinks?: string[];
}

interface Article {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    contentMd: string | null;
    status: string;
    locale: string;
    translationGroupId: string | null;
    categoryId: string | null;
    authorId: string | null;
    coverImageId: string | null;
    coverImage?: {
        storageUrl: string | null;
    } | null;
    seo?: SeoMeta | null;
}

interface Author {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
    locale?: string;
}

interface OtherArticle {
    id: string;
    title: string;
    locale: string;
    slug: string;
    translationGroupId: string | null;
}

interface AuditResult {
    score: number;
    passed: boolean;
    issues: string[];
    suggestions: string[];
    stats: {
        titleLength: number;
        descriptionLength: number;
        h1Count: number;
        h2Count: number;
        internalLinks: number;
        hasList: boolean;
        hasTable: boolean;
    };
}

interface OptimizationSnapshot {
    formData: {
        title: string;
        slug: string;
        summary: string;
        contentMd: string;
    };
    seoData: {
        metaTitle: string;
        metaDescription: string;
        keywords: string;
        schemaJson: string;
        snippetLinkedIn: string;
        snippetReddit: string;
        snippetTwitter: string;
    };
}

function FieldComparisonControl({
    label,
    current,
    original,
    ai,
    onSelect
}: {
    label: string;
    current: string;
    original: string;
    ai: string;
    onSelect: (val: string) => void;
}) {
    // If AI value is empty or same as original, no need to show toggle
    if (!ai || ai === original) return null;

    // Check if current matches one of them to highlight
    const isOriginal = current === original;
    const isAi = current === ai;

    return (
        <div className="flex items-center justify-between mb-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{label} 更新建议</span>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => onSelect(original)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isOriginal
                        ? 'bg-white text-slate-700 shadow-sm border border-slate-200'
                        : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    保留原版
                </button>
                <button
                    type="button"
                    onClick={() => onSelect(ai)}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${isAi
                        ? 'bg-violet-100 text-violet-700 shadow-sm border border-violet-200'
                        : 'text-violet-400 hover:text-violet-600'
                        }`}
                >
                    <Sparkles size={10} />
                    使用 AI
                </button>
            </div>
        </div>
    );
}

export function EditForm({
    article,
    otherArticles = [],
    authors = [],
    categories = []
}: {
    article: Article;
    otherArticles?: OtherArticle[];
    authors?: Author[];
    categories?: Category[];
}) {
    const router = useRouter();
    const [isPending, setIsPending] = React.useState(false);
    const [isSeoSaving, setIsSeoSaving] = React.useState(false);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [isOptimizing, setIsOptimizing] = React.useState(false);
    // 新文章（正文为空）默认进「源码」模式，给一个能立刻打字的入口；有内容则进分段
    const [editorMode, setEditorMode] = React.useState<'sections' | 'outline' | 'raw'>(
        article.contentMd && article.contentMd.trim() ? 'sections' : 'raw'
    );
    const [seoExpanded, setSeoExpanded] = React.useState(true);
    const [auditResult, setAuditResult] = React.useState<AuditResult | null>(null);
    const [optimizationResult, setOptimizationResult] = React.useState<any>(null);
    const [contentType, setContentType] = React.useState<'TOFU' | 'MOFU' | 'BOFU'>('MOFU');

    const [originalSnapshot, setOriginalSnapshot] = React.useState<OptimizationSnapshot | null>(null);
    const [aiSnapshot, setAiSnapshot] = React.useState<OptimizationSnapshot | null>(null);

    const [formData, setFormData] = React.useState({
        title: article.title || '',
        slug: article.slug || '',
        summary: article.summary || '',
        contentMd: article.contentMd || '',
        locale: article.locale || 'zh',
        categoryId: article.categoryId || '',
        authorId: article.authorId || '',
        coverImageId: article.coverImageId || '',
    });

    const [contentSections, setContentSections] = React.useState<ContentSection[]>(() =>
        parseMarkdownToSections(article.contentMd || '')
    );

    // 分类/作者：本地镜像 props，内联创建后即时追加（无需刷新页面）
    const [categoryList, setCategoryList] = React.useState<Category[]>(categories);
    const [authorList, setAuthorList] = React.useState<Author[]>(authors);
    const [newCategoryName, setNewCategoryName] = React.useState('');
    const [newAuthorName, setNewAuthorName] = React.useState('');
    const [showNewCategory, setShowNewCategory] = React.useState(false);
    const [showNewAuthor, setShowNewAuthor] = React.useState(false);

    const handleCreateCategory = async () => {
        const res = await createCategory(newCategoryName, formData.locale);
        if (res.success && res.category) {
            setCategoryList(prev => [...prev, res.category!]);
            setFormData(prev => ({ ...prev, categoryId: res.category!.id }));
            setNewCategoryName('');
            setShowNewCategory(false);
            toast.success(`分类「${res.category.name}」已创建（${formData.locale === 'en' ? 'EN' : 'ZH'}）`);
        } else {
            toast.error(res.error || '创建分类失败');
        }
    };

    const handleCreateAuthor = async () => {
        const res = await createAuthor(newAuthorName);
        if (res.success && res.author) {
            setAuthorList(prev => [...prev, res.author!]);
            setFormData(prev => ({ ...prev, authorId: res.author!.id }));
            setNewAuthorName('');
            setShowNewAuthor(false);
            toast.success(`作者「${res.author.name}」已创建`);
        } else {
            toast.error(res.error || '创建作者失败');
        }
    };

    // contentMd 是唯一真相源；sections 是它的派生视图。
    // 切换模式时双向转换，避免"源码输入后切回分段被空 sections 覆盖"的数据丢失。
    const switchEditorMode = (mode: 'sections' | 'outline' | 'raw') => {
        if (mode === editorMode) return;
        if (mode === 'raw') {
            // 离开分段/结构 → 把 sections 合成回 contentMd
            setFormData(prev => ({ ...prev, contentMd: joinSectionsToMarkdown(contentSections) }));
        } else {
            // 进入分段/结构 → 从当前 contentMd 重新解析（含刚在源码里写的内容）
            setContentSections(parseMarkdownToSections(formData.contentMd || ''));
        }
        setEditorMode(mode);
    };

    // sections 变更后立即同步回 contentMd，保证保存时拿到最新内容
    const applySections = (next: ContentSection[]) => {
        setContentSections(next);
        setFormData(prev => ({ ...prev, contentMd: joinSectionsToMarkdown(next) }));
    };

    const handleSectionSave = (id: string, newBody: string) => {
        applySections(contentSections.map(s => s.id === id ? { ...s, body: newBody } : s));
    };

    const handleOutlineChange = (nodes: OutlineNode[]) => {
        // Map outline nodes to existing or new sections
        applySections(nodes.map((node) => {
            const existing = contentSections.find(s => s.heading === node.text);
            if (existing) return existing;
            if (node.text === 'Intro' && contentSections[0]?.heading === '__intro__') return contentSections[0];
            return {
                id: crypto.randomUUID(),
                heading: node.text,
                body: "",
                fullText: `## ${node.text}\n\n`
            };
        }));
    };

    const handleImageUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const result = await uploadMediaAction(formData);
        if (result.success && result.data) {
            return { mediaId: result.data.mediaId, storageUrl: result.data.storageUrl };
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    };

    // 新上传封面的即时预览（已存封面用 article.coverImage.storageUrl）
    const [coverPreview, setCoverPreview] = React.useState<string>('');

    const [seoData, setSeoData] = React.useState({
        metaTitle: article.seo?.metaTitle || '',
        metaDescription: article.seo?.metaDescription || '',
        canonicalUrl: article.seo?.canonicalUrl || '',
        noIndex: article.seo?.noIndex || false,
        keywords: article.seo?.keywords?.join(', ') || '',
        schemaJson: article.seo?.schemaJson || '',
        snippetLinkedIn: article.seo?.snippetLinkedIn || '',
        snippetReddit: article.seo?.snippetReddit || '',
        snippetTwitter: article.seo?.snippetTwitter || '',
    });
    const [advancedExpanded, setAdvancedExpanded] = React.useState(false);

    const pairedArticles = otherArticles.filter(
        x => x.translationGroupId && x.translationGroupId === article.translationGroupId
    );

    const oppositeLocaleArticles = otherArticles.filter(
        x => x.locale !== formData.locale
    );

    const handleLinkTranslation = async (targetId: string) => {
        if (!targetId) return;
        setIsPending(true);
        try {
            const res = await associateTranslation(article.id, targetId);
            if (res.success) {
                toast.success('翻译关联成功');
                router.refresh();
            } else {
                toast.error('关联失败：' + res.error);
            }
        } catch (err) {
            toast.error('发生错误');
        } finally {
            setIsPending(false);
        }
    };

    const handleUnlinkTranslation = async () => {
        if (!confirm('确定要解除与该翻译的关联吗？')) return;
        setIsPending(true);
        try {
            const res = await dissociateTranslation(article.id);
            if (res.success) {
                toast.success('已解除关联');
                router.refresh();
            } else {
                toast.error('解除关联失败：' + res.error);
            }
        } catch (err) {
            toast.error('发生错误');
        } finally {
            setIsPending(false);
        }
    };

    // Use content fields as fallback for SEO preview
    const effectiveTitle = seoData.metaTitle || formData.title;
    const effectiveDescription = seoData.metaDescription || formData.summary;

    // 统一的保存函数：同时保存文章内容和 SEO 数据
    const handleUnifiedSave = async (statusOverride?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
        setIsPending(true);
        setIsSeoSaving(true);
        try {
            // 1. 保存文章基本信息 (Title, Slug, Summary, Content, etc.)
            const contentResult = await updateContentMetadata(article.id, {
                title: formData.title,
                slug: formData.slug,
                summary: formData.summary,
                contentMd: formData.contentMd,
                locale: formData.locale,
                categoryId: formData.categoryId || null,
                authorId: formData.authorId || null,
                coverImageId: formData.coverImageId || null,
                ...(statusOverride && { status: statusOverride }),
            });

            if (!contentResult.success) {
                throw new Error('保存文章内容失败: ' + contentResult.error);
            }

            // 2. 保存 SEO 数据
            const keywordsArray = seoData.keywords
                ? seoData.keywords.split(',').map(k => k.trim()).filter(Boolean)
                : [];

            const seoResult = await updateSeoMetadata(article.id, {
                metaTitle: seoData.metaTitle || undefined,
                metaDescription: seoData.metaDescription || undefined,
                canonicalUrl: seoData.canonicalUrl || undefined,
                noIndex: seoData.noIndex,
                keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
                schemaJson: seoData.schemaJson || undefined,
                snippetLinkedIn: seoData.snippetLinkedIn || undefined,
                snippetReddit: seoData.snippetReddit || undefined,
                snippetTwitter: seoData.snippetTwitter || undefined,
                geoScore: auditResult?.score,
            });

            if (!seoResult.success) {
                throw new Error('保存 SEO 数据失败: ' + seoResult.error);
            }

            // 成功提示
            router.refresh();
            toast.success('保存成功：文章内容、SEO 与元数据已更新');

        } catch (error) {
            console.error('Save error:', error);
            toast.error('保存失败：' + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsPending(false);
            setIsSeoSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleUnifiedSave();
    };

    const handleSeoSave = async () => {
        await handleUnifiedSave();
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeContentSeo(article.id);
            if (result.success && result.data) {
                setAuditResult(result.data);
            } else {
                toast.error('分析失败：' + result.error);
            }
        } catch (error) {
            toast.error('发生意外错误');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAIOptimize = async () => {
        if (!formData.contentMd) {
            toast.error('请先填写文章内容');
            return;
        }

        setIsOptimizing(true);
        try {
            const response = await fetch('/api/skills/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skillName: 'stellar-writer',
                    input: {
                        keywords: formData.title, // Use title as base keywords
                        originalContent: formData.contentMd,
                        industry: 'General', // Could be dynamic
                        brandName: 'ScaletoTop',
                        url: `https://scaletotop.com/blog/${formData.slug}`,
                        auditOnly: false
                    }
                })
            });

            const result = await response.json();

            if (result.success && result.output.success) {
                const data = result.output.data;

                // 1. 创建 AI 数据快照
                const newAiSnapshot: OptimizationSnapshot = {
                    formData: {
                        title: data.seoMetadata.title || formData.title,
                        slug: data.seoMetadata.slug || formData.slug,
                        summary: data.summary || formData.summary,
                        contentMd: data.content || formData.contentMd,
                    },
                    seoData: {
                        metaTitle: data.seoMetadata.title || seoData.metaTitle,
                        metaDescription: data.seoMetadata.description || seoData.metaDescription,
                        keywords: data.seoMetadata.keywords?.join(', ') || seoData.keywords,
                        schemaJson: data.schema ? JSON.stringify(data.schema, null, 2) : seoData.schemaJson,
                        snippetLinkedIn: data.distribution?.linkedin?.post || seoData.snippetLinkedIn,
                        snippetReddit: seoData.snippetReddit,
                        snippetTwitter: data.distribution?.twitter?.thread?.join('\\n\\n') || seoData.snippetTwitter,
                    }
                };

                // 2. 保存原版快照 (如果还没有保存过)
                if (!originalSnapshot) {
                    setOriginalSnapshot({
                        formData: { ...formData },
                        seoData: { ...seoData }
                    });
                }

                // 3. 保存 AI 快照
                setAiSnapshot(newAiSnapshot);

                // 4. 应用 AI 数据 (默认全部应用)

                // 自动填充 SEO 字段
                setSeoData({
                    ...seoData,
                    metaTitle: newAiSnapshot.seoData.metaTitle,
                    metaDescription: newAiSnapshot.seoData.metaDescription,
                    keywords: newAiSnapshot.seoData.keywords,
                    schemaJson: newAiSnapshot.seoData.schemaJson,
                    snippetLinkedIn: newAiSnapshot.seoData.snippetLinkedIn,
                    snippetReddit: newAiSnapshot.seoData.snippetReddit,
                    snippetTwitter: newAiSnapshot.seoData.snippetTwitter,
                });

                // 更新文章字段
                setFormData(prev => ({
                    ...prev,
                    title: newAiSnapshot.formData.title,
                    slug: newAiSnapshot.formData.slug,
                    summary: newAiSnapshot.formData.summary,
                    contentMd: newAiSnapshot.formData.contentMd,
                }));

                setOptimizationResult(data);
                setAuditResult({
                    score: data.scores?.seo || 0,
                    passed: (data.scores?.seo || 0) >= 70,
                    issues: [],
                    suggestions: data.suggestions || [],
                    stats: {
                        titleLength: data.seoMetadata.title?.length || 0,
                        descriptionLength: data.seoMetadata.description?.length || 0,
                        h1Count: (data.content?.match(/^# /gm) || []).length,
                        h2Count: (data.content?.match(/^## /gm) || []).length,
                        internalLinks: data.internalLinks?.length || 0,
                        hasList: data.content?.includes('- ') || false,
                        hasTable: data.content?.includes('|') || false,
                    }
                });

                toast.success(`AI 优化完成 · SEO ${data.scores?.seo}/100 · GEO ${data.scores?.geo}/100`);
            } else {
                toast.error('优化失败：' + (result.error || result.output.error));
            }
        } catch (error) {
            console.error('AI 优化错误:', error);
            toast.error('优化过程中发生错误');
        } finally {
            setIsOptimizing(false);
        }
    };

    const getTitleColor = (length: number) => {
        if (length === 0) return 'text-slate-400';
        if (length < 30) return 'text-amber-500';
        if (length <= 60) return 'text-emerald-500';
        return 'text-red-500';
    };

    const getDescColor = (length: number) => {
        if (length === 0) return 'text-slate-400';
        if (length < 80) return 'text-amber-500';
        if (length <= 160) return 'text-emerald-500';
        return 'text-red-500';
    };

    return (
        <div className="space-y-6">
            {/* Main Content Form */}
            <Card className="p-8 border-none shadow-sm bg-white">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        {originalSnapshot && aiSnapshot && (
                            <FieldComparisonControl
                                label="标题"
                                current={formData.title}
                                original={originalSnapshot.formData.title}
                                ai={aiSnapshot.formData.title}
                                onSelect={(val) => setFormData({ ...formData, title: val })}
                            />
                        )}
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">文章标题</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 transition-all"
                            placeholder="输入文章标题..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        {originalSnapshot && aiSnapshot && (
                            <FieldComparisonControl
                                label="Slug"
                                current={formData.slug}
                                original={originalSnapshot.formData.slug}
                                ai={aiSnapshot.formData.slug}
                                onSelect={(val) => setFormData({ ...formData, slug: val })}
                            />
                        )}
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">URL Slug</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">/blog/</span>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 pl-[3.8rem] pr-4 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 transition-all font-mono"
                                placeholder="my-cool-article"
                                required
                            />
                        </div>
                    </div>

                    {/* Language, Category and Author controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">文章语言 (Locale)</label>
                            <select
                                value={formData.locale}
                                onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                                className="w-full bg-white border-slate-200 rounded-xl py-2.5 px-3 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 transition-all text-sm shadow-sm"
                            >
                                <option value="zh">🇨🇳 中文 (ZH)</option>
                                <option value="en">🇺🇸 English (EN)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">所属分类（{formData.locale === 'en' ? 'EN' : 'ZH'}）</label>
                                <button type="button" onClick={() => setShowNewCategory(v => !v)} className="text-[10px] font-bold text-brand-primary hover:underline">+ 新建</button>
                            </div>
                            {showNewCategory ? (
                                <div className="flex gap-2">
                                    <input
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } }}
                                        placeholder={`新分类名（${formData.locale === 'en' ? 'EN' : 'ZH'}）`}
                                        autoFocus
                                        className="flex-1 bg-white border-slate-200 rounded-xl py-2.5 px-3 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 text-sm shadow-sm"
                                    />
                                    <button type="button" onClick={handleCreateCategory} className="px-3 rounded-xl bg-brand-primary text-white text-xs font-bold">创建</button>
                                </div>
                            ) : (
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    className="w-full bg-white border-slate-200 rounded-xl py-2.5 px-3 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 transition-all text-sm shadow-sm"
                                >
                                    <option value="">未分类</option>
                                    {categoryList.filter(c => !c.locale || c.locale === formData.locale).map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">发布作者</label>
                                <button type="button" onClick={() => setShowNewAuthor(v => !v)} className="text-[10px] font-bold text-brand-primary hover:underline">+ 新建</button>
                            </div>
                            {showNewAuthor ? (
                                <div className="flex gap-2">
                                    <input
                                        value={newAuthorName}
                                        onChange={(e) => setNewAuthorName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateAuthor(); } }}
                                        placeholder="作者名"
                                        autoFocus
                                        className="flex-1 bg-white border-slate-200 rounded-xl py-2.5 px-3 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 text-sm shadow-sm"
                                    />
                                    <button type="button" onClick={handleCreateAuthor} className="px-3 rounded-xl bg-brand-primary text-white text-xs font-bold">创建</button>
                                </div>
                            ) : (
                                <select
                                    value={formData.authorId}
                                    onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                                    className="w-full bg-white border-slate-200 rounded-xl py-2.5 px-3 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 transition-all text-sm shadow-sm"
                                >
                                    <option value="">默认作者 (Team)</option>
                                    {authorList.map(author => (
                                        <option key={author.id} value={author.id}>{author.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Translation Pairing */}
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                        {article.translationGroupId ? (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 font-sans">已关联翻译</label>
                                {pairedArticles.length > 0 ? (
                                    pairedArticles.map(p => (
                                        <div key={p.id} className="flex items-center justify-between bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs shadow-sm">
                                            <span className="font-semibold text-slate-700">{p.locale === 'en' ? '🇺🇸 英文' : '🇨🇳 中文'} ({p.slug})</span>
                                            <div className="flex gap-2">
                                                <Link href={`/dashboard/admin/content/${p.id}`} className="text-brand-secondary hover:underline font-bold">
                                                    编辑
                                                </Link>
                                                <button type="button" onClick={handleUnlinkTranslation} className="text-red-500 hover:underline font-bold">
                                                    解绑
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-between bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs shadow-sm">
                                        <span className="text-slate-400 font-medium italic">无其它配对</span>
                                        <button type="button" onClick={handleUnlinkTranslation} className="text-red-500 hover:underline font-bold">
                                            清除ID
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 font-sans">关联现有翻译</label>
                                <select
                                    onChange={(e) => handleLinkTranslation(e.target.value)}
                                    defaultValue=""
                                    className="w-full bg-white border-slate-200 rounded-xl py-2 px-3 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 transition-all text-xs shadow-sm"
                                >
                                    <option value="" disabled>选择要配对的{formData.locale === 'zh' ? '英文' : '中文'}文章...</option>
                                    {oppositeLocaleArticles.map(p => (
                                        <option key={p.id} value={p.id}>
                                            [{p.locale.toUpperCase()}] {p.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Cover Image */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">封面图片</label>
                        <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-32 aspect-video bg-white rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 relative group">
                                {formData.coverImageId ? (
                                    <img
                                        src={coverPreview || (article.coverImageId === formData.coverImageId ? article.coverImage?.storageUrl || '' : '')}
                                        alt="Cover"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Edit size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="text-xs text-slate-500">建议尺寸: 1200x630px. 支持拖拽或粘贴到下方编辑器上传后复制 ID，或直接在此上传。</div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.coverImageId}
                                        onChange={(e) => setFormData({ ...formData, coverImageId: e.target.value })}
                                        className="flex-1 bg-white border-slate-200 rounded-lg py-2 px-3 text-xs font-mono"
                                        placeholder="Media ID (e.g. uuid)"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="text-xs py-2 px-4 rounded-lg bg-white"
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/*';
                                            input.onchange = async (e) => {
                                                const file = (e.target as HTMLInputElement).files?.[0];
                                                if (file) {
                                                    try {
                                                        const res = await handleImageUpload(file);
                                                        setFormData(prev => ({ ...prev, coverImageId: res.mediaId }));
                                                        setCoverPreview(res.storageUrl);
                                                        toast.success('封面已上传，点击下方保存生效');
                                                    } catch (err) {
                                                        toast.error('封面上传失败：' + (err instanceof Error ? err.message : String(err)));
                                                    }
                                                }
                                            };
                                            input.click();
                                        }}
                                    >
                                        上传图片
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {originalSnapshot && aiSnapshot && (
                            <FieldComparisonControl
                                label="摘要"
                                current={formData.summary}
                                original={originalSnapshot.formData.summary}
                                ai={aiSnapshot.formData.summary}
                                onSelect={(val) => setFormData({ ...formData, summary: val })}
                            />
                        )}
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">文章摘要</label>
                        <textarea
                            rows={3}
                            value={formData.summary}
                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-semibold focus:ring-2 focus:ring-brand-primary/20 transition-all min-h-[80px]"
                            placeholder="输入文章摘要..."
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">文章正文</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => switchEditorMode('sections')}
                                    className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${editorMode === 'sections' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Layout size={12} /> 分段编辑
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchEditorMode('outline')}
                                    className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${editorMode === 'outline' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <List size={12} /> 结构
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchEditorMode('raw')}
                                    className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${editorMode === 'raw' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <CodeIcon size={12} /> 源码
                                </button>
                            </div>
                        </div>

                        {editorMode === 'sections' && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                {contentSections.length > 0 ? (
                                    contentSections.map(section => (
                                        <EditableSection
                                            key={section.id}
                                            section={section}
                                            onSave={handleSectionSave}
                                            onImageUpload={handleImageUpload}
                                        />
                                    ))
                                ) : (
                                    <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm">
                                        正文为空，请切换到源码模式输入或在结构模式添加段落
                                    </div>
                                )}
                            </div>
                        )}

                        {editorMode === 'outline' && (
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in duration-300">
                                <OutlineEditor
                                    initialData={contentSections.map(s => ({ 
                                        level: s.heading === '__intro__' ? 1 : 2, 
                                        text: s.heading === '__intro__' ? 'Intro' : s.heading 
                                    }))}
                                    onChange={handleOutlineChange}
                                />
                                <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase text-center italic">
                                    拖拽调整顺序，点击 H2/H3 切换层级
                                </p>
                            </div>
                        )}

                        {editorMode === 'raw' && (
                            <div className="animate-in fade-in duration-300">
                                <textarea
                                    rows={25}
                                    value={formData.contentMd}
                                    onChange={(e) => setFormData({ ...formData, contentMd: e.target.value })}
                                    className="w-full bg-slate-900 border-0 rounded-2xl p-6 text-slate-100 font-mono text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all min-h-[500px]"
                                    placeholder="输入 Markdown 源码..."
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 gap-2 font-bold py-4 rounded-xl shadow-lg shadow-brand-primary/20"
                        >
                            {isPending ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                            {isPending ? '正在保存...' : '保存更新'}
                        </Button>
                        {article.status === 'PUBLISHED' ? (
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleUnifiedSave('DRAFT')}
                                className="px-6 font-bold rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                            >
                                下架
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleUnifiedSave('PUBLISHED')}
                                className="px-6 gap-2 font-bold py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <Save size={18} /> 保存并发布
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            className="px-8 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                        >
                            返回
                        </Button>
                    </div>
                </form>
            </Card>

            {/* SEO Section */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <button
                    type="button"
                    onClick={() => setSeoExpanded(!seoExpanded)}
                    className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">智作 (StellarWriter) 引擎</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">AI 驱动的 SEO & GEO 深度优化</p>
                        </div>
                    </div>
                    {seoExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </button>

                {seoExpanded && (
                    <div className="px-6 pb-6 space-y-6 border-t border-slate-100 pt-6">
                        {/* Scores Ribbon */}
                        <div className="flex gap-4 mb-2">
                            <div className="flex-1 bg-violet-50/50 border border-violet-100 p-4 rounded-2xl flex flex-col items-center">
                                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">SEO 评分</span>
                                <span className="text-2xl font-black text-violet-600">{auditResult?.score || '--'}</span>
                            </div>
                            <div className="flex-1 bg-brand-primary/5 border border-brand-primary/10 p-4 rounded-2xl flex flex-col items-center">
                                <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1">GEO 评分</span>
                                <span className="text-2xl font-black text-brand-text-primary">{optimizationResult?.scores?.geo || '--'}</span>
                            </div>
                        </div>

                        {/* Google Preview */}
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Google 搜索预览</div>
                            <div className="space-y-1">
                                <div className="text-lg text-blue-600 hover:underline cursor-pointer font-medium truncate">
                                    {effectiveTitle || '文章标题'}
                                </div>
                                <div className="text-xs text-emerald-700 truncate">
                                    scaletotop.com/blog/{formData.slug || 'article-slug'}
                                </div>
                                <div className="text-sm text-slate-600 line-clamp-2">
                                    {effectiveDescription || '文章描述将显示在这里...'}
                                </div>
                            </div>
                        </div>

                        {/* Meta Title */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                    SEO 标题
                                </label>
                                <span className={`text-xs font-mono ${getTitleColor(effectiveTitle.length)}`}>
                                    {effectiveTitle.length}/60
                                </span>
                            </div>
                            {originalSnapshot && aiSnapshot && (
                                <FieldComparisonControl
                                    label="SEO 标题"
                                    current={seoData.metaTitle}
                                    original={originalSnapshot.seoData.metaTitle}
                                    ai={aiSnapshot.seoData.metaTitle}
                                    onSelect={(val) => setSeoData({ ...seoData, metaTitle: val })}
                                />
                            )}
                            <input
                                type="text"
                                value={seoData.metaTitle}
                                onChange={(e) => setSeoData({ ...seoData, metaTitle: e.target.value })}
                                placeholder={formData.title || '留空则使用文章标题'}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-semibold focus:ring-2 focus:ring-violet-500/20 transition-all"
                            />
                            <p className="text-[10px] text-slate-400 ml-1">建议 50-60 字符，关键词前置</p>
                        </div>

                        {/* Meta Description */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                    SEO 描述
                                </label>
                                <span className={`text-xs font-mono ${getDescColor(effectiveDescription.length)}`}>
                                    {effectiveDescription.length}/160
                                </span>
                            </div>
                            {originalSnapshot && aiSnapshot && (
                                <FieldComparisonControl
                                    label="SEO 描述"
                                    current={seoData.metaDescription}
                                    original={originalSnapshot.seoData.metaDescription}
                                    ai={aiSnapshot.seoData.metaDescription}
                                    onSelect={(val) => setSeoData({ ...seoData, metaDescription: val })}
                                />
                            )}
                            <textarea
                                rows={3}
                                value={seoData.metaDescription}
                                onChange={(e) => setSeoData({ ...seoData, metaDescription: e.target.value })}
                                placeholder={formData.summary || '留空则使用文章摘要'}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-semibold focus:ring-2 focus:ring-violet-500/20 transition-all"
                            />
                            <p className="text-[10px] text-slate-400 ml-1">建议 120-160 字符，包含 CTA</p>
                        </div>

                        {/* Canonical URL */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                Canonical URL (可选)
                            </label>
                            <input
                                type="url"
                                value={seoData.canonicalUrl}
                                onChange={(e) => setSeoData({ ...seoData, canonicalUrl: e.target.value })}
                                placeholder="https://..."
                                className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-semibold focus:ring-2 focus:ring-violet-500/20 transition-all font-mono text-sm"
                            />
                            <p className="text-[10px] text-slate-400 ml-1">用于防止重复内容，通常留空</p>
                        </div>

                        {/* noIndex */}
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                            <input
                                type="checkbox"
                                id="noIndex"
                                checked={seoData.noIndex}
                                onChange={(e) => setSeoData({ ...seoData, noIndex: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                            />
                            <label htmlFor="noIndex" className="flex-1">
                                <div className="text-sm font-bold text-slate-700">阻止搜索引擎索引</div>
                                <div className="text-xs text-slate-400">勾选后搜索引擎将不收录此页面</div>
                            </label>
                        </div>

                        {/* Keywords */}
                        <div className="space-y-2">
                            {originalSnapshot && aiSnapshot && (
                                <FieldComparisonControl
                                    label="关键词"
                                    current={seoData.keywords}
                                    original={originalSnapshot.seoData.keywords}
                                    ai={aiSnapshot.seoData.keywords}
                                    onSelect={(val) => setSeoData({ ...seoData, keywords: val })}
                                />
                            )}
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                目标关键词
                            </label>
                            <input
                                type="text"
                                value={seoData.keywords}
                                onChange={(e) => setSeoData({ ...seoData, keywords: e.target.value })}
                                placeholder="关键词1, 关键词2, 关键词3"
                                className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-semibold focus:ring-2 focus:ring-violet-500/20 transition-all"
                            />
                            <p className="text-[10px] text-slate-400 ml-1">用逗号分隔多个关键词</p>
                        </div>

                        {/* Advanced Section Toggle */}
                        <button
                            type="button"
                            onClick={() => setAdvancedExpanded(!advancedExpanded)}
                            className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">高级选项（Schema / 分发摘要）</span>
                            {advancedExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </button>

                        {advancedExpanded && (
                            <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                                {/* Schema JSON-LD */}
                                <div className="space-y-2">
                                    {originalSnapshot && aiSnapshot && (
                                        <FieldComparisonControl
                                            label="Schema"
                                            current={seoData.schemaJson || ''}
                                            original={originalSnapshot.seoData.schemaJson || ''}
                                            ai={aiSnapshot.seoData.schemaJson || ''}
                                            onSelect={(val) => setSeoData({ ...seoData, schemaJson: val })}
                                        />
                                    )}
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                        Schema JSON-LD
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={seoData.schemaJson}
                                        onChange={(e) => setSeoData({ ...seoData, schemaJson: e.target.value })}
                                        placeholder='{"@context": "https://schema.org", ...}'
                                        className="w-full bg-white border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-violet-500/20 transition-all"
                                    />
                                </div>

                                {/* LinkedIn Snippet */}
                                <div className="space-y-2">
                                    {originalSnapshot && aiSnapshot && (
                                        <FieldComparisonControl
                                            label="LinkedIn"
                                            current={seoData.snippetLinkedIn || ''}
                                            original={originalSnapshot.seoData.snippetLinkedIn || ''}
                                            ai={aiSnapshot.seoData.snippetLinkedIn || ''}
                                            onSelect={(val) => setSeoData({ ...seoData, snippetLinkedIn: val })}
                                        />
                                    )}
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                        LinkedIn 分发摘要
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={seoData.snippetLinkedIn}
                                        onChange={(e) => setSeoData({ ...seoData, snippetLinkedIn: e.target.value })}
                                        placeholder="专业框架导向的 LinkedIn 帖子..."
                                        className="w-full bg-white border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:ring-2 focus:ring-violet-500/20 transition-all"
                                    />
                                </div>

                                {/* Reddit Snippet */}
                                <div className="space-y-2">
                                    {originalSnapshot && aiSnapshot && (
                                        <FieldComparisonControl
                                            label="Reddit"
                                            current={seoData.snippetReddit || ''}
                                            original={originalSnapshot.seoData.snippetReddit || ''}
                                            ai={aiSnapshot.seoData.snippetReddit || ''}
                                            onSelect={(val) => setSeoData({ ...seoData, snippetReddit: val })}
                                        />
                                    )}
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                        Reddit 分发摘要
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={seoData.snippetReddit}
                                        onChange={(e) => setSeoData({ ...seoData, snippetReddit: e.target.value })}
                                        placeholder="真实经验分享的 Reddit 帖子..."
                                        className="w-full bg-white border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:ring-2 focus:ring-violet-500/20 transition-all"
                                    />
                                </div>

                                {/* Twitter Snippet */}
                                <div className="space-y-2">
                                    {originalSnapshot && aiSnapshot && (
                                        <FieldComparisonControl
                                            label="Twitter"
                                            current={seoData.snippetTwitter || ''}
                                            original={originalSnapshot.seoData.snippetTwitter || ''}
                                            ai={aiSnapshot.seoData.snippetTwitter || ''}
                                            onSelect={(val) => setSeoData({ ...seoData, snippetTwitter: val })}
                                        />
                                    )}
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                        Twitter/X 分发摘要
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={seoData.snippetTwitter}
                                        onChange={(e) => setSeoData({ ...seoData, snippetTwitter: e.target.value })}
                                        placeholder="简洁有力的 Twitter Thread..."
                                        className="w-full bg-white border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm focus:ring-2 focus:ring-violet-500/20 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Content Type Selector */}
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                            <span className="text-xs font-bold text-slate-500">内容类型:</span>
                            <select
                                value={contentType}
                                onChange={(e) => setContentType(e.target.value as 'TOFU' | 'MOFU' | 'BOFU')}
                                className="text-xs bg-white border-slate-200 rounded px-2 py-1 font-semibold"
                            >
                                <option value="TOFU">TOFU (认知阶段)</option>
                                <option value="MOFU">MOFU (考虑阶段)</option>
                                <option value="BOFU">BOFU (决策阶段)</option>
                            </select>
                        </div>

                        {/* Loading State */}
                        {isOptimizing && (
                            <div className="p-3 bg-violet-50 rounded-xl border border-violet-200 flex items-center gap-3">
                                <RefreshCw size={16} className="animate-spin text-violet-600" />
                                <div className="text-sm text-violet-900">
                                    <div className="font-bold">正在使用 DeepSeek AI 优化...</div>
                                    <div className="text-xs text-violet-600">预计需要 30-60 秒</div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                            <Button
                                type="button"
                                onClick={handleAIOptimize}
                                disabled={isOptimizing || !formData.contentMd}
                                className="flex-1 gap-2 font-bold py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                            >
                                {isOptimizing ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {isOptimizing ? '正在优化中...' : 'AI 一键优化'}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSeoSave}
                                disabled={isSeoSaving}
                                className="gap-2 font-bold py-3 rounded-xl bg-violet-600 hover:bg-violet-700"
                            >
                                {isSeoSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                保存
                            </Button>
                        </div>

                        {/* Audit Results */}
                        {auditResult && (
                            <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-white space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {auditResult.passed ? (
                                            <CheckCircle size={20} className="text-emerald-500" />
                                        ) : (
                                            <AlertCircle size={20} className="text-amber-500" />
                                        )}
                                        <span className="font-bold text-slate-900">
                                            GEO 评分: {auditResult.score}/100
                                        </span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${auditResult.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {auditResult.passed ? '通过' : '需优化'}
                                    </span>
                                </div>

                                {auditResult.issues.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            问题
                                        </div>
                                        <ul className="space-y-1">
                                            {auditResult.issues.map((issue, i) => (
                                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                    <span className="text-red-400 mt-1">•</span>
                                                    {issue}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {auditResult.suggestions.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                                            <Lightbulb size={12} />
                                            建议
                                        </div>
                                        <ul className="space-y-1">
                                            {auditResult.suggestions.map((suggestion, i) => (
                                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                    <span className="text-amber-400 mt-1">•</span>
                                                    {suggestion}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="pt-3 border-t border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">统计</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">H1 标题</span>
                                            <span className="font-mono text-slate-600">{auditResult.stats.h1Count}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">H2 标题</span>
                                            <span className="font-mono text-slate-600">{auditResult.stats.h2Count}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">内链数量</span>
                                            <span className="font-mono text-slate-600">{auditResult.stats.internalLinks}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">结构化元素</span>
                                            <span className="font-mono text-slate-600">
                                                {auditResult.stats.hasList ? '列表 ' : ''}
                                                {auditResult.stats.hasTable ? '表格' : ''}
                                                {!auditResult.stats.hasList && !auditResult.stats.hasTable && '无'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Optimization Success Result */}
                        {optimizationResult && (
                            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle size={16} className="text-emerald-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-emerald-900">AI 优化成功</div>
                                        <p className="text-xs text-emerald-600 mt-1">
                                            已自动填充 SEO 元数据和 Schema。GEO 评分: {optimizationResult.geoScore}/100
                                        </p>
                                        {optimizationResult.internalLinks && optimizationResult.internalLinks.length > 0 && (
                                            <div className="mt-2 text-xs text-emerald-700">
                                                <span className="font-bold">推荐内链:</span> {optimizationResult.internalLinks.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI Optimization Tip */}
                        <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                    <Sparkles size={16} className="text-violet-600" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-violet-900">AI 深度优化提示</div>
                                    <p className="text-xs text-violet-600 mt-1">
                                        点击"AI 一键优化"按钮，使用 DeepSeek AI 自动生成 SEO 元数据、Schema 结构化数据。
                                        成本仅需 ~$0.001/篇，性价比超高！
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
