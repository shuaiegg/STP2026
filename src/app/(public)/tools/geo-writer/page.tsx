"use client";

import React, { useState, useEffect } from 'react';
import { useCompletion } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Zap, MapPin, Type, Sparkles, Loader2, ArrowRight,
    CheckCircle2, Copy, LayoutDashboard, Undo,
    FileText, Image as ImageIcon, Link as LinkIcon,
    Users, BarChart3, ChevronRight, Globe, Info,
    Eye, Code, Database, Braces, RefreshCw,
    Search, TrendingUp, Target, MousePointer2,
    Lock, Check, ArrowLeft, ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SEOScorePanel } from '@/components/seo/SEOScorePanel';
import { KeywordOpportunityMatrix } from '@/components/charts/KeywordOpportunityMatrix';
import { SEOScoreDashboard } from '@/components/charts/SEOScoreDashboard';
import { CompetitorRadarChart } from '@/components/charts/CompetitorRadarChart';
import { SERPOpportunitiesPanel } from '@/components/serp/SERPOpportunitiesPanel';
import Link from 'next/link';
import { OutlineEditor, OutlineNode } from '@/components/editor/OutlineEditor';
import { EditableSection } from '@/components/editor/EditableSection';
import { parseMarkdownToSections, joinSectionsToMarkdown, ContentSection } from '@/lib/utils/markdown-sections';


export default function GEOWriterPage() {
    const [step, setStep] = useState(1); // 1: Research, 2: Strategy, 3: Creation
    const [loading, setLoading] = useState(false);
    const [researchData, setResearchData] = useState<any[] | null>(null);
    const [auditResult, setAuditResult] = useState<any>(null);
    const [finalResult, setFinalResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'preview' | 'markdown' | 'schema' | 'article'>('preview');
    const [showOriginal, setShowOriginal] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [selectedKeyword, setSelectedKeyword] = useState<string>(''); // 选中的主关键词
    const [cachedIntelligence, setCachedIntelligence] = useState<any>(null); // Cached intelligence data from Step 1
    const [editableOutline, setEditableOutline] = useState<OutlineNode[]>([]); // Editable outline state
    const [contentSections, setContentSections] = useState<ContentSection[]>([]); // Step 3 editable sections


    const [form, setForm] = useState({
        keywords: '',
        location: '',
        brandName: '',
        tone: 'professional',
        type: 'blog',
        originalContent: ''
    });

    // Sync finalResult to contentSections if needed (e.g. on load)
    useEffect(() => {
        if (finalResult?.content && contentSections.length === 0) {
            const sections = parseMarkdownToSections(finalResult.content);
            setContentSections(sections);
        }
    }, [finalResult, contentSections.length]);

    // Function to proceed from research phase to strategy phase
    const proceedToStrategy = () => {
        setStep(2);
    };

    // 1. RESEARCH & AUDIT (Step 1 -> 2)
    const handleResearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResearchData(null);

        try {
            // MOCKUP DATA MODE
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate loading

            const mockOutputData = {
                topics: [
                    { keyword: "best crm for startups", volume: 12500, competition: 45 },
                    { keyword: "crm software comparison 2024", volume: 8900, competition: 65 },
                    { keyword: "affordable crm solutions", volume: 5400, competition: 30 },
                    { keyword: "crm implementation guide", volume: 3200, competition: 25 },
                    { keyword: "marketing automation integration", volume: 7600, competition: 55 }
                ],
                entities: [
                    { title: "Salesforce", type: "Organization", rating: "4.5", address: "San Francisco, CA" },
                    { title: "HubSpot", type: "Organization", rating: "4.6", address: "Cambridge, MA" },
                    { title: "Zoho CRM", type: "Organization", rating: "4.3", address: "Pleasanton, CA" }
                ],
                competitors: [
                    {
                        title: "10 Best CRM for Small Business (2024 Review)",
                        url: "https://example.com/best-crm",
                        headings: [
                            { level: 1, text: "Top CRM Picks" },
                            { level: 2, text: "Why you need a CRM" },
                            { level: 2, text: "Pricing Comparison" }
                        ]
                    },
                    {
                        title: "How to Choose the Right CRM",
                        url: "https://example.com/guide",
                        headings: [
                            { level: 1, text: "CRM Buying Guide" },
                            { level: 2, text: "Features to Look For" }
                        ]
                    }
                ],
                serpAnalysis: {
                    userIntent: "Commercial Investigation",
                    dominantContent: "Listicles and Reviews",
                    missingTopics: ["AI Integration", "Mobile Usability"],
                    avgWordCount: 2500,
                    // Detailed fields required by SERPOpportunitiesPanel
                    featuredSnippet: {
                        exists: true,
                        type: "paragraph",
                        content: "The best CRM for startups usually combines affordability with scalability...",
                        url: "https://example.com/snippet",
                        opportunity: "medium",
                        reason: "Current snippet is outdated.",
                        recommendedFormat: "Bulleted list",
                        actionSteps: ["Answer 'What is best CRM' in first paragraph"]
                    },
                    peopleAlsoAsk: [
                        { question: "What is the cheapest CRM for startups?", difficulty: 45, coveredByCompetitors: true, priority: "high" },
                        { question: "Do startups need Salesforce?", difficulty: 60, coveredByCompetitors: false, priority: "medium" }
                    ],
                    serpFeatures: {
                        hasVideo: true,
                        hasImages: false,
                        hasKnowledgePanel: false,
                        hasFAQ: true,
                        hasLocalPack: false,
                        hasShopping: false,
                        hasNewsResults: false
                    },
                    recommendations: [
                        {
                            targetFeature: "People Also Ask",
                            opportunity: "high",
                            reason: "High search volume, low competition answers",
                            actionSteps: ["Add FAQ section"],
                            estimatedTraffic: 15
                        }
                    ]
                },
                masterOutline: [
                    { level: 1, text: "The Ultimate Guide to CRM for Startups in 2024" },
                    { level: 2, text: "What is a CRM and Why Do Startups Need One?" },
                    { level: 2, text: "Top 5 CRM Platforms Ranked" },
                    { level: 3, text: "1. HubSpot - Best for Scaling" },
                    { level: 3, text: "2. Salesforce - Best for Enterprise Future-Proofing" },
                    { level: 2, text: "Key Features to Look For: AI & Automation" },
                    { level: 2, text: "Implementation Checklist" }
                ],
                scores: { seo: 78, geo: 65 }
            };

            const data: any = { success: true, isRepeat: false, output: { success: true, data: mockOutputData } };

            /* 
            // REAL API CALL (Commented out for Mockup Mode)
            const response = await fetch('/api/skills/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skillName: 'stellar-writer',
                    input: { ...form, auditOnly: true }
                })
            });
 
            const data = await response.json(); 
 
            if (!response.ok) {
                 throw new Error(data.error || '请求失败');
            }
            */

            if (!data.success || !data.output || !data.output.success) {
                throw new Error(data.output?.error || data.error || '研究逻辑执行失败');
            }

            const outputData = data.output.data;
            if (!outputData) {
                throw new Error('未返回有效的研究数据');
            }

            setResearchData(outputData.topics || []);
            setAuditResult(outputData);
            setEditableOutline(outputData.masterOutline || []);
            setIsPaid(data.isRepeat || false);

            // Cache intelligence data for Step 2 reuse
            setCachedIntelligence({
                entities: outputData.entities || [],
                topics: outputData.topics || [],
                serpAnalysis: outputData.serpAnalysis,
                competitors: outputData.competitors || [],
                timestamp: Date.now()
            });
            console.log('💾 Cached intelligence data for reuse in Step 2');

            // 智能默认：选择机会评分最高的关键词
            const topics = outputData.topics || [];
            if (topics.length > 0) {
                const calculateOpportunityScore = (kw: any) => {
                    const volumeScore = Math.min(100, (kw.volume / 10000) * 100);
                    const competitionScore = 100 - kw.competition;
                    return volumeScore * 0.6 + competitionScore * 0.4;
                };

                const bestKeyword = [...topics]
                    .sort((a, b) => calculateOpportunityScore(b) - calculateOpportunityScore(a))[0];

                setSelectedKeyword(bestKeyword.keyword);
            } else {
                setSelectedKeyword(form.keywords);
            }

            setStep(1); // Stay on step 1 to show the research data
        } catch (err: any) {
            console.error('Research error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 2. PAID REWRITE (Step 2 -> 3)
    // Streaming Logic
    const { complete, completion, isLoading: isStreaming } = useCompletion({
        api: '/api/generate-stream',
        streamProtocol: 'text',
        onFinish: (prompt, result) => {
            console.log('Streaming Finished. Result length:', result?.length);

            // Construct the final result structure
            const finalData = {
                content: result,
                summary: "AI Generated Content",
                seoMetadata: {
                    title: selectedKeyword || form.keywords,
                    description: "AI Generated Guide to " + (selectedKeyword || form.keywords),
                    keywords: [selectedKeyword || form.keywords, "guide", "2024"],
                    slug: (selectedKeyword || form.keywords).toLowerCase().replace(/\s+/g, '-')
                },
                schema: {
                    "@context": "https://schema.org",
                    "@type": "Article",
                    "headline": selectedKeyword || form.keywords,
                    "description": "Comprehensive guide about " + (selectedKeyword || form.keywords),
                    "author": { "@type": "Person", "name": "AI Writer" },
                    "datePublished": new Date().toISOString()
                },
                // Preserve Step 1 data
                entities: cachedIntelligence?.entities || [],
                topics: cachedIntelligence?.topics || [],
                competitors: cachedIntelligence?.competitors || [],
                serpAnalysis: cachedIntelligence?.serpAnalysis || null,
                scores: { seo: 88, geo: 92 },
                detailedSEOScore: {
                    overall: 88,
                    breakdown: {
                        title: { score: 95, weight: 0.25, status: 'excellent', issues: [], suggestions: [] },
                        description: { score: 90, weight: 0.15, status: 'excellent', issues: [], suggestions: [] },
                        keywords: { score: 85, weight: 0.20, status: 'good', issues: ["Keyword density slightly low"], suggestions: ["Increase keyword frequency"] },
                        readability: { score: 92, weight: 0.15, status: 'excellent', issues: [], suggestions: [] },
                        structure: { score: 80, weight: 0.20, status: 'good', issues: ["Add more images"], suggestions: ["Include 2 more images"] },
                        images: { score: 70, weight: 0.05, status: 'good', issues: ["Missing Alt text"], suggestions: ["Add Alt text to images"] }
                    }
                },
                suggestions: ["Add more internal links", "Include an FAQ schema"],
                internalLinks: ["related-post-1", "service-page-crm"],
                imageSuggestions: ["Hero image: Dashboard screenshot", "Diagram: CRM workflow"],
                distribution: {}
            };
            setFinalResult(finalData);
            // DO NOT overwrite auditResult here, as it contains the original research data
            // setAuditResult(finalData);
            setIsPaid(true); // Unlock "Paid" view
            setLoading(false);

            // Initialize editable sections
            const sections = parseMarkdownToSections(result);
            setContentSections(sections);
            setStep(3); // Explicitly move to step 3
        },
        onError: (err) => {
            console.error('Streaming error:', err);
            setError(err.message);
            setLoading(false);
        }
    });

    // 2. PAID REWRITE (Step 2 -> 3)
    const handleRewrite = async () => {
        // Do NOT set global loading state to true, relies on isStreaming
        // setLoading(true);
        setError(null);
        // completion reset is handled by useCompletion automatically

        try {
            console.log('🚀 Starting Streaming Generation...');

            setStep(3); // Move to result view immediately to show stream

            // Trigger the stream
            complete('', {
                body: {
                    input: {
                        ...form,
                        keywords: selectedKeyword || form.keywords,
                        auditOnly: false
                    },
                    cachedIntelligence: {
                        ...cachedIntelligence,
                        masterOutline: editableOutline // Use the user-edited outline
                    }
                }
            });
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        }
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        if (typeof text === 'object') text = JSON.stringify(text, null, 2);
        navigator.clipboard.writeText(text);
        alert('已复制到剪贴板');
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-12 gap-4">
            {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                    <div className={`flex items-center gap-2 ${step >= s ? 'text-brand-primary' : 'text-slate-300'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${step >= s ? 'border-brand-primary bg-brand-primary text-white scale-110 shadow-lg' : 'border-slate-200 bg-white'}`}>
                            {step > s ? <CheckCircle2 size={16} /> : s}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
                            {s === 1 ? '市场研究' : s === 2 ? '内容策略' : '智作完成'}
                        </span>
                    </div>
                    {s < 3 && <div className={`w-12 h-0.5 rounded ${step > s ? 'bg-brand-primary' : 'bg-slate-100'}`} />}
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className="container mx-auto py-16 px-6 max-w-7xl min-h-[90vh]">
            {renderStepIndicator()}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Side: Controls */}
                <div className="lg:col-span-4">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div>
                                <h1 className="text-4xl font-black text-brand-text-primary mb-4 font-display italic leading-tight">
                                    StellarWriter <br />智作优化器
                                </h1>
                                <p className="text-brand-text-secondary leading-relaxed text-sm">
                                    输入关键词，我们将为您拆解全网竞品大纲并生成具有“引力”的 GEO 高权重内容。
                                </p>
                            </div>

                            <form onSubmit={handleResearch} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-brand-text-primary flex items-center gap-2">
                                        <Zap size={16} className="text-brand-secondary" />
                                        核心关键词 / 业务主题
                                    </label>
                                    <input
                                        required
                                        value={form.keywords}
                                        onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                                        placeholder="例如: Best CRM for SaaS"
                                        className="w-full bg-white border-2 border-brand-border p-4 outline-none focus:border-brand-primary transition-all text-sm font-bold rounded-xl shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-brand-text-primary flex items-center gap-2">
                                        <Globe size={16} className="text-brand-primary" />
                                        目标市场 (地理位置)
                                    </label>
                                    <input
                                        value={form.location}
                                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                                        placeholder="London, New York (可选)"
                                        className="w-full bg-white border-2 border-brand-border p-4 outline-none focus:border-brand-primary transition-all text-sm rounded-xl shadow-sm"
                                    />
                                </div>

                                <Button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-8 text-lg bg-brand-primary text-white border-b-4 border-black hover:translate-y-[2px] hover:border-b-0 transition-all font-black uppercase tracking-widest shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-none"
                                >
                                    {loading ? <><Loader2 className="animate-spin mr-2" /> 正在侦察全网情报...</> : "开启侦察与诊断"}
                                </Button>
                            </form>
                        </div>
                    )}

                    {(step === 2 || step === 3) && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                            <Card className="p-6 border-2 border-brand-border-heavy bg-white">
                                <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-widest mb-4">当前配置</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">主题</span>
                                        <span className="text-xs font-black text-brand-text-primary truncate ml-4">{form.keywords}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">模式</span>
                                        <span className="text-xs font-black text-brand-secondary">{form.originalContent ? '优化模式' : '从零创作'}</span>
                                    </div>
                                </div>
                            </Card>

                            {step === 2 && (
                                <div className="p-8 bg-brand-secondary/10 border-2 border-brand-secondary/30 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-brand-secondary flex items-center justify-center text-white shadow-sm">
                                            <Sparkles size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-brand-text-primary">准备好见证奇迹了吗？</h4>
                                            <p className="text-[10px] text-brand-text-secondary">AI 将基于右侧的竞争情报进行降维打击。</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">语气语调</label>
                                            <select
                                                value={form.tone}
                                                onChange={(e) => setForm({ ...form, tone: e.target.value as any })}
                                                className="w-full bg-white border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-brand-primary transition-all text-xs font-bold shadow-sm"
                                            >
                                                <option value="professional">专业权威</option>
                                                <option value="educational">知识分享</option>
                                                <option value="casual">亲切随性</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">内容类型</label>
                                            <select
                                                value={form.type}
                                                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                                                className="w-full bg-white border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-brand-primary transition-all text-xs font-bold shadow-sm"
                                            >
                                                <option value="blog">深度博客文章</option>
                                                <option value="landing_page">高转化落地页</option>
                                                <option value="guide">操作指南/白皮书</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">选择地理位置（可选）</label>
                                            <input
                                                type="text"
                                                value={form.location}
                                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                                placeholder="如：北京、上海、全球"
                                                className="w-full bg-white border-2 border-slate-100 p-5 rounded-2xl text-sm font-bold text-brand-text-primary placeholder:text-slate-300 focus:outline-none focus:border-brand-primary transition-all shadow-sm hover:shadow-md"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">品牌名称（可选）</label>
                                            <input
                                                type="text"
                                                value={form.brandName}
                                                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                                                placeholder="如：阿里巴巴、ScaletoTop、您的品牌"
                                                className="w-full bg-white border-2 border-slate-100 p-5 rounded-2xl text-sm font-bold text-brand-text-primary placeholder:text-slate-300 focus:outline-none focus:border-brand-primary transition-all shadow-sm hover:shadow-md"
                                            />
                                            <p className="text-[10px] text-slate-400 font-semibold">将在内容中使用您的品牌名，留空则使用通用表述</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">原始草稿 (可选)</label>
                                            <textarea
                                                value={form.originalContent}
                                                onChange={(e) => setForm({ ...form, originalContent: e.target.value })}
                                                placeholder="粘贴内容即可进行优化..."
                                                className="w-full bg-white border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-brand-primary transition-all text-[10px] h-20 shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleRewrite}
                                        disabled={loading}
                                        className="w-full py-6 bg-brand-primary text-white border-2 border-black font-black shadow-[4px_4px_0_0_rgba(10,10,10,1)] transition-all active:scale-95 hover:shadow-none"
                                    >
                                        {loading ? <><Loader2 className="animate-spin mr-2" /> 正在智作...</> : isPaid ? "重新生成 (已授权)" : "支付 50 积分，启动智作"}
                                    </Button>
                                    {!isPaid && <p className="text-center text-[10px] font-bold text-brand-text-muted mt-4 uppercase tracking-widest">扣除 50 积分一次，永久无限次优化</p>}
                                </div>
                            )}

                            {step === 3 && (
                                <div className="p-8 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-emerald-700 uppercase">智作已送达！</h4>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-emerald-600">内容质量评分:</p>
                                                <span className="text-xs font-black text-emerald-700">{finalResult?.scores?.seo || 85}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <Card className="p-4 bg-white border-emerald-100 flex flex-col items-center shadow-sm">
                                            <span className="text-[10px] font-black text-slate-400 uppercase mb-1">SEO</span>
                                            <span className="text-2xl font-black text-emerald-600">{auditResult?.scores?.seo}%</span>
                                        </Card>
                                        <Card className="p-4 bg-white border-emerald-100 flex flex-col items-center shadow-sm">
                                            <span className="text-[10px] font-black text-slate-400 uppercase mb-1">GEO</span>
                                            <span className="text-2xl font-black text-brand-primary">{auditResult?.scores?.geo}%</span>
                                        </Card>
                                    </div>
                                    <Link href="/dashboard" className="w-full">
                                        <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 font-bold bg-white hover:bg-emerald-50 transition-colors text-xs">
                                            前往控制台追踪引用
                                        </Button>
                                    </Link>
                                </div>
                            )}

                            <button
                                onClick={() => { setStep(1); setAuditResult(null); setFinalResult(null); setResearchData(null); }}
                                className="w-full text-xs font-bold text-slate-400 hover:text-brand-primary underline transition-colors"
                            >
                                开启新任务
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border-2 border-red-100 text-red-600 text-xs font-bold flex items-center gap-3 rounded-xl animate-shake">
                            <Zap size={16} />
                            {error}
                        </div>
                    )}
                </div>

                {/* Right Side: Display Area */}
                <div className="lg:col-span-8">
                    {/* Only show Big Loader for Step 1 Research */}
                    {loading && step === 1 && !finalResult && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[600px] text-center space-y-8 animate-pulse bg-brand-surface/20 rounded-3xl border-2 border-dashed border-brand-border">
                            <div className="relative">
                                <Globe size={80} className="text-brand-primary animate-spin-slow opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-brand-text-primary italic font-display">智作引擎正在分析...</h3>
                                <p className="text-brand-text-secondary font-bold uppercase tracking-[0.2em] text-[10px]">
                                    {step === 1 ? '正在同步全球搜索数据与实时意图热力图' : '正在执行竞品逆向工程并注入 GEO 增益'}
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 1 && !loading && !researchData && (
                        <div className="border-2 border-dashed border-brand-border p-20 flex flex-col items-center justify-center text-center bg-brand-surface h-full min-h-[600px] rounded-3xl">
                            <div className="w-24 h-24 bg-white border-2 border-brand-border flex items-center justify-center text-brand-border mb-8 rotate-3 shadow-sm">
                                <Search size={48} className="text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-brand-text-muted mb-4 font-display">情报中心待命</h3>
                            <p className="text-brand-text-muted max-w-md text-sm leading-relaxed">
                                输入关键词并点击侦察，我们将连接 Google 实时数据库，<br />
                                探测竞争对手、热门话题及流量机会。
                            </p>
                        </div>
                    )}

                    {step === 1 && !loading && researchData && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                            <Card className="p-8 border-2 border-brand-border-heavy bg-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <BarChart3 size={120} />
                                </div>
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary shadow-sm">
                                            <TrendingUp size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-brand-text-primary font-display italic uppercase tracking-tighter leading-none">市场洞察：SEO/GEO 可行性</h2>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">总体可行性分数:</span>
                                                <span className={`text-xs font-black ${auditResult.scores?.geo > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>{auditResult.scores?.geo}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-slate-50 text-slate-400 border border-slate-100 font-black text-[9px] uppercase tracking-widest px-3 py-1">
                                            Real-time SERP Data
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {researchData.length > 0 ? researchData.map((topic, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedKeyword(topic.keyword)}
                                            className={`flex flex-col p-6 border-2 rounded-2xl hover:shadow-md transition-all group cursor-pointer active:scale-[0.98] ${selectedKeyword === topic.keyword
                                                ? 'bg-brand-primary/5 border-brand-primary shadow-lg shadow-brand-primary/10'
                                                : 'bg-brand-surface/40 border-slate-50 hover:border-brand-secondary'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    {selectedKeyword === topic.keyword && (
                                                        <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                                                    )}
                                                    <span className={`text-sm font-black transition-colors ${selectedKeyword === topic.keyword
                                                        ? 'text-brand-primary'
                                                        : 'text-brand-text-primary group-hover:text-brand-secondary'
                                                        }`}>
                                                        {topic.keyword}
                                                    </span>
                                                    {selectedKeyword === topic.keyword && (
                                                        <span className="text-[9px] font-black text-brand-primary uppercase tracking-wider ml-2">
                                                            ✓ 主
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                    <MousePointer2 size={12} />
                                                </div>
                                            </div>

                                            <div className="flex items-end justify-between gap-6">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                        <span>竞争程度</span>
                                                        <span className={topic.competition > 70 ? 'text-red-500' : 'text-emerald-500'}>{topic.competition}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${topic.competition < 40 ? 'bg-emerald-400' : topic.competition < 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                                                            style={{ width: `${topic.competition}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-black text-brand-text-primary leading-none font-mono">{topic.volume || '--'}</div>
                                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">月搜索量</div>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-full py-16 text-center text-slate-300 italic text-sm border-2 border-dashed border-slate-100 rounded-3xl">
                                            未发现相关的低竞争关键词建议，AI 将基于行业常识进行策略规划。
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* 关键词机会矩阵可视化 */}
                            {researchData && researchData.length > 0 && (
                                <KeywordOpportunityMatrix topics={researchData} />
                            )}

                            {/* SERP Opportunities Panel (Step 1) */}
                            {auditResult?.serpAnalysis && (
                                <div className="mt-8">
                                    <SERPOpportunitiesPanel analysis={auditResult.serpAnalysis} />
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button onClick={proceedToStrategy} className="px-10 py-6 bg-brand-secondary text-brand-text-primary border-2 border-brand-border-heavy font-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                                    进入策略定策 <ArrowRight className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && auditResult && !loading && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                            {/* Competitor Analysis Section */}
                            <Card className="p-10 border-2 border-brand-border-heavy bg-white rounded-3xl">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shadow-sm">
                                        <Users size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-brand-text-primary font-display italic uppercase tracking-tighter leading-none">竞品骨架拆解</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">Competitive Landscape (H1-H4 Layers)</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {auditResult.competitors && auditResult.competitors.length > 0 ? auditResult.competitors.map((comp: any, i: number) => (
                                        <div key={i} className="border-2 border-slate-50 p-6 rounded-2xl bg-brand-surface/20 hover:border-brand-primary/20 transition-all group/comp">
                                            <div className="flex items-center gap-4 mb-6 border-b border-white pb-6">
                                                <div className="text-xs font-black text-brand-text-primary truncate flex-1">{comp.title}</div>
                                                <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-brand-primary font-mono truncate max-w-[200px] flex items-center gap-1 hover:underline">
                                                    {comp.url} <ExternalLink size={10} />
                                                </a>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {comp.headings.slice(0, 12).map((h: any, j: number) => (
                                                    <div key={j} className={`px-3 py-2 bg-white/80 border border-slate-100 rounded-xl text-[9px] font-bold truncate ${h.level > 2 ? 'opacity-50 pl-4' : 'shadow-sm text-slate-700'}`}>
                                                        <span className="text-brand-secondary mr-1.5 opacity-50">H{h.level}</span> {h.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-12 text-center text-slate-300 italic text-sm">
                                            暂无竞品数据，我们将直接进行大师级大纲规划。
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <Card className="p-12 border-4 border-brand-primary bg-white shadow-[16px_16px_0_0_rgba(151,71,255,0.08)] relative overflow-hidden rounded-3xl">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none rotate-12">
                                    <Sparkles size={240} />
                                </div>
                                <div className="flex items-center gap-4 mb-12">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-xl shadow-brand-primary/30">
                                        <FileText size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-brand-text-primary font-display italic uppercase tracking-tighter">大师大纲 · 策略规划</h2>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-primary/10 rounded-full">
                                                <span className="text-[10px] font-black text-brand-primary uppercase">内容质量预估:</span>
                                                <span className="text-xs font-black text-brand-primary">待生成</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    {/* Interactive Outline Editor */}
                                    {editableOutline.length > 0 ? (
                                        <OutlineEditor
                                            initialData={editableOutline}
                                            onChange={setEditableOutline}
                                            key={JSON.stringify(auditResult.masterOutline)} // Reset when new research arrives
                                        />
                                    ) : (
                                        <div className="text-center text-slate-400">Loading outline...</div>
                                    )}
                                </div>

                                <div className="mt-12 p-6 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl text-white shadow-lg flex gap-4 items-center">
                                    <div className="p-3 bg-white/20 rounded-xl"><Zap size={28} /></div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-widest">核心增益逻辑 (Information Gain)</h4>
                                        <p className="text-xs font-medium text-white/80 mt-1 leading-relaxed">
                                            已自动识别竞品的共通点，并为您的大纲插入了对手缺失的“独家行业见解”模块。
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* SERP Opportunities Panel - Phase 2 Module 2.1 */}
                            {auditResult?.serpAnalysis && (
                                <Card className="p-8 bg-white border-2 border-purple-100 shadow-lg rounded-2xl">
                                    <SERPOpportunitiesPanel analysis={auditResult.serpAnalysis} />
                                </Card>
                            )}
                        </div>
                    )}

                    {step === 3 && (finalResult || isStreaming) && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                            {/* Navigation Tabs */}
                            <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200 shadow-inner">
                                <button onClick={() => setViewMode('preview')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-white text-brand-primary shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <Eye size={14} /> 交互编辑
                                </button>
                                <button onClick={() => setViewMode('article')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'article' ? 'bg-white text-brand-primary shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <FileText size={14} /> 阅读全文
                                </button>
                                <button onClick={() => setViewMode('markdown')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'markdown' ? 'bg-white text-brand-primary shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <Code size={14} /> Markdown
                                </button>
                                <button onClick={() => setViewMode('schema')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'schema' ? 'bg-white text-brand-primary shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <Braces size={14} /> Schema 代码
                                </button>
                            </div>

                            {/* Main Display Area */}
                            <Card className="p-12 border-2 border-brand-border-heavy bg-white relative shadow-[20px_20px_0_0_rgba(10,10,10,0.03)] rounded-3xl min-h-[600px]">
                                {viewMode === 'preview' && (
                                    <div className="prose prose-brand max-w-none">
                                        <h1 className="text-4xl font-black mb-10 italic text-brand-text-primary leading-tight">{finalResult?.seoMetadata?.title || selectedKeyword || form.keywords}</h1>
                                        <div className="space-y-8 text-brand-text-secondary leading-relaxed text-lg">
                                            {(finalResult?.content || completion)?.split('\n').map((line: string, i: number) => {
                                                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-black text-brand-text-primary pt-8 border-b-4 border-slate-50 pb-2">{line.replace('## ', '')}</h2>;
                                                if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold text-brand-text-primary pt-4">{line.replace('### ', '')}</h3>;
                                                if (line.startsWith('- ')) return <li key={i} className="ml-6 list-disc marker:text-brand-secondary">{line.replace('- ', '')}</li>;
                                                return <p key={i}>{line}</p>;
                                            })}
                                            {isStreaming && (
                                                <div className="flex items-center gap-2 text-brand-primary animate-pulse pt-4">
                                                    <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                                                    <span className="text-xs font-black uppercase tracking-widest">Writing...</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Reference Sources Section */}
                                        <div className="mt-24 pt-12 border-t-2 border-dashed border-slate-100">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                                <Database size={16} /> 引用来源与数据审计 (Sources & Citations)
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                <div className="space-y-4">
                                                    <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest block">已绑定的地图实体</span>
                                                    <div className="space-y-3">
                                                        {auditResult.entities?.map((e: any, i: number) => (
                                                            <div key={i} className="flex items-start gap-3 group">
                                                                <div className="w-1 h-1 rounded-full bg-brand-primary mt-1.5 group-hover:scale-150 transition-transform" />
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-black text-brand-text-primary">{e.title}</span>
                                                                    {e.website && (
                                                                        <a href={e.website} target="_blank" rel="noopener noreferrer" className="text-[9px] text-slate-400 font-mono mt-0.5 hover:underline flex items-center gap-1">
                                                                            查看网站 <ExternalLink size={8} />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">已参考的竞品骨架</span>
                                                    <div className="space-y-3">
                                                        {auditResult.competitors?.map((c: any, i: number) => (
                                                            <div key={i} className="flex items-start gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                                                <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5" />
                                                                <div className="flex flex-col truncate">
                                                                    <span className="text-xs font-bold text-slate-600 truncate">{c.title}</span>
                                                                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-brand-primary font-mono mt-0.5 truncate italic hover:underline flex items-center gap-1">
                                                                        查看原文 <ExternalLink size={8} />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {viewMode === 'article' && (
                                    <div className="space-y-4 h-full">
                                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                                            <span className="text-xs font-black text-slate-500">全文预览 (FINAL PREVIEW)</span>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => copyToClipboard(finalResult?.content || completion)} className="bg-white gap-2 font-bold shadow-sm text-xs border-slate-200">
                                                    <Copy size={12} /> 一键复制全文
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="prose prose-brand max-w-none p-12 bg-white rounded-2xl border border-slate-100 min-h-[800px]">
                                            <ReactMarkdown
                                                components={{
                                                    blockquote: ({ node, ...props }) => (
                                                        <div className="border-l-4 border-brand-primary bg-brand-surface/50 p-4 rounded-r-xl my-4 not-italic">
                                                            <div className="flex gap-2">
                                                                <div className="text-brand-primary font-bold">💡</div>
                                                                <div className="text-slate-700">{props.children}</div>
                                                            </div>
                                                        </div>
                                                    )
                                                }}
                                                remarkPlugins={[remarkGfm]}
                                            >
                                                {finalResult?.content || completion}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                {viewMode === 'markdown' && (
                                    <div className="space-y-4 h-full">
                                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                                            <span className="text-xs font-black text-slate-500">MARKDOWN 源代码</span>
                                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(finalResult?.content || completion)} className="bg-white gap-2 font-bold shadow-sm text-xs">
                                                <Copy size={12} /> 复制代码
                                            </Button>
                                        </div>
                                        <textarea readOnly value={finalResult?.content || completion} className="w-full h-[550px] p-8 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl outline-none shadow-inner" />
                                    </div>
                                )}

                                {viewMode === 'schema' && (
                                    <div className="space-y-6 h-full">
                                        <div className="flex justify-between items-center bg-violet-50 p-6 rounded-2xl border-2 border-violet-100">
                                            <div className="flex gap-4 items-center">
                                                <Braces className="text-violet-600" size={32} />
                                                <div>
                                                    <span className="text-sm font-black text-violet-700 block uppercase tracking-widest">Schema.org Article 代码</span>
                                                    <span className="text-[10px] text-violet-400 font-bold">用于提升 Google 搜索展示效果的 JSON-LD 代码</span>
                                                </div>
                                            </div>
                                            <Button size="sm" onClick={() => finalResult?.schema && copyToClipboard(finalResult.schema)} className="bg-violet-600 hover:bg-violet-700 font-black shadow-lg shadow-violet-200 text-xs">
                                                复制 JSON-LD
                                            </Button>
                                        </div>
                                        <pre className="p-8 bg-slate-900 text-violet-300 font-mono text-xs rounded-2xl overflow-auto h-[450px] shadow-inner">
                                            {JSON.stringify(finalResult?.schema || {}, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </Card>

                            {/* Recommendations Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="p-10 border-2 border-brand-border bg-white rounded-3xl relative overflow-hidden shadow-sm">
                                    <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <ImageIcon className="text-brand-secondary" size={20} /> 视觉配图策略
                                    </h3>
                                    <div className="space-y-4">
                                        {finalResult?.imageSuggestions?.map((img: string, i: number) => (
                                            <div key={i} className="p-5 bg-brand-surface border border-brand-border rounded-2xl text-xs font-bold text-brand-text-secondary flex gap-4 hover:bg-white transition-all shadow-sm">
                                                <div className="w-6 h-6 rounded-full bg-brand-secondary text-white flex items-center justify-center shrink-0 text-[10px] font-black">{i + 1}</div>
                                                {img}
                                            </div>
                                        ))}
                                        {!finalResult?.imageSuggestions?.length && (
                                            <div className="text-slate-400 text-xs italic">智作完成后显示配图建议...</div>
                                        )}
                                    </div>
                                </Card>
                                <Card className="p-10 border-2 border-brand-border bg-white rounded-3xl relative overflow-hidden shadow-sm">
                                    <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <LinkIcon className="text-brand-primary" size={20} /> 建议内部链接
                                    </h3>
                                    <div className="space-y-4">
                                        {finalResult?.internalLinks?.map((link: string, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-brand-primary transition-all group">
                                                <div className="flex items-center gap-3 truncate">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary group-hover:scale-150 transition-transform" />
                                                    <span className="text-xs font-mono font-bold text-slate-600 truncate">/{link}</span>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-300" />
                                            </div>
                                        ))}
                                        {!finalResult?.internalLinks?.length && (
                                            <div className="text-slate-400 text-xs italic">智作完成后显示内链建议...</div>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            {/* SEO Score Detailed Breakdown */}
                            {finalResult?.detailedSEOScore && (
                                <div className="mt-8">
                                    <Card className="p-10 border-4 border-brand-primary/20 bg-gradient-to-br from-white to-brand-primary/5 rounded-3xl">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-xl">
                                                    <TrendingUp size={28} />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-brand-text-primary">详细SEO评分分析</h3>
                                                    <p className="text-xs text-slate-500 font-bold">可操作的优化建议与评分细项</p>
                                                </div>
                                            </div>
                                            {/* 当前关键词显示 */}
                                            {selectedKeyword && (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 border-2 border-brand-primary/30 rounded-xl">
                                                    <Search size={14} className="text-brand-primary" />
                                                    <div>
                                                        <div className="text-[9px] font-black text-brand-primary/60 uppercase tracking-wider">目标关键词</div>
                                                        <div className="text-sm font-black text-brand-primary">{selectedKeyword}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* 可视化图表集合 */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                            <SEOScoreDashboard score={finalResult.detailedSEOScore} />
                                            <CompetitorRadarChart
                                                myScore={finalResult.detailedSEOScore}
                                                competitors={finalResult.competitors || []}
                                            />
                                        </div>

                                        {/* 详细评分面板 */}
                                        <SEOScorePanel score={finalResult.detailedSEOScore} />
                                    </Card>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
