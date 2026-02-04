"use client";

import React, { useState, useEffect } from 'react';
import { 
    Zap, MapPin, Type, Sparkles, Loader2, ArrowRight,
    CheckCircle2, Copy, LayoutDashboard, Undo, 
    FileText, Image as ImageIcon, Link as LinkIcon, 
    Users, BarChart3, ChevronRight, Globe, Info,
    Eye, Code, Database, Braces, RefreshCw,
    Search, TrendingUp, Target, MousePointer2,
    Lock, Check, ArrowLeft
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function GEOWriterPage() {
    const [step, setStep] = useState(1); // 1: Research, 2: Strategy, 3: Creation
    const [loading, setLoading] = useState(false);
    const [researchData, setResearchData] = useState<any[] | null>(null);
    const [auditResult, setAuditResult] = useState<any>(null);
    const [finalResult, setFinalResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'preview' | 'markdown' | 'schema'>('preview');
    const [showOriginal, setShowOriginal] = useState(false);

    const [form, setForm] = useState({
        keywords: '',
        location: '',
        tone: 'professional',
        type: 'blog',
        originalContent: ''
    });

    // 1. STEP 1: KEYWORD DISCOVERY (Step 1 -> 1.5)
    const handleResearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResearchData(null);

        try {
            // We'll use the stellar-writer skill in auditOnly mode to get keywords
            const response = await fetch('/api/skills/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skillName: 'stellar-writer',
                    input: { keywords: form.keywords, location: form.location, auditOnly: true }
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '研究失败');

            setResearchData(data.output.data.topics || []);
            setAuditResult(data.output.data); // Store preliminary audit
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 2. STEP 2: CONTENT STRATEGY (Step 1.5 -> 2)
    const proceedToStrategy = () => {
        setStep(2);
    };

    // 3. STEP 3: PAID REWRITE (Step 2 -> 3)
    const handleRewrite = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/skills/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skillName: 'stellar-writer',
                    input: { ...form, auditOnly: false }
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '优化失败');

            setFinalResult(data.output.data);
            setAuditResult(data.output.data); 
            setStep(3);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        if (typeof text === 'object') text = JSON.stringify(text, null, 2);
        navigator.clipboard.writeText(text);
        alert('已复制到剪贴板');
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-12 gap-4">
            {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                    <div className={`flex items-center gap-2 ${step === s ? 'text-brand-primary' : 'text-slate-300'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${step === s ? 'border-brand-primary bg-brand-primary text-white scale-110 shadow-lg' : 'border-slate-200 bg-white'}`}>
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
        <div className="container mx-auto py-16 px-6 max-w-7xl">
            {renderStepIndicator()}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Side: Sidebar / Controls */}
                <div className="lg:col-span-4">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div>
                                <h1 className="text-4xl font-black text-brand-text-primary mb-4 font-display italic leading-tight">
                                    StellarWriter <br />智作优化器
                                </h1>
                                <p className="text-brand-text-secondary leading-relaxed text-sm">
                                    输入关键词，阿拉丁将为您拆解全网竞品大纲并生成具有“引力”的 GEO 高权重内容。
                                </p>
                            </div>

                            {!researchData ? (
                                <form onSubmit={handleResearch} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-brand-text-primary flex items-center gap-2">
                                            <Zap size={16} className="text-brand-secondary" />
                                            核心关键词 / 业务主题
                                        </label>
                                        <input 
                                            required
                                            value={form.keywords}
                                            onChange={(e) => setForm({...form, keywords: e.target.value})}
                                            placeholder="例如: Best CRM for SaaS"
                                            className="w-full bg-white border-2 border-brand-border p-4 outline-none focus:border-brand-primary transition-all text-sm font-bold rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-brand-text-primary flex items-center gap-2">
                                            <Globe size={16} className="text-brand-primary" />
                                            目标市场 (地理位置)
                                        </label>
                                        <input 
                                            value={form.location}
                                            onChange={(e) => setForm({...form, location: e.target.value})}
                                            placeholder="London, New York (可选)"
                                            className="w-full bg-white border-2 border-brand-border p-4 outline-none focus:border-brand-primary transition-all text-sm rounded-xl"
                                        />
                                    </div>

                                    <Button 
                                        disabled={loading}
                                        type="submit" 
                                        className="w-full py-8 text-lg bg-brand-primary text-white border-b-4 border-black hover:translate-y-[2px] hover:border-b-0 transition-all font-black uppercase tracking-widest shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-none"
                                    >
                                        {loading ? <><Loader2 className="animate-spin mr-2" /> 正在侦察全网情报...</> : "开始全量调研"}
                                    </Button>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-6 bg-brand-primary/5 border-2 border-brand-primary/20 rounded-2xl">
                                        <h3 className="text-xs font-black text-brand-primary uppercase tracking-widest mb-4">调研已完成</h3>
                                        <p className="text-xs text-brand-text-secondary mb-6">
                                            我们在右侧为您生成了关键词意图矩阵和竞品分析报告。
                                        </p>
                                        <Button 
                                            onClick={proceedToStrategy}
                                            className="w-full py-6 bg-brand-secondary text-brand-text-primary border-2 border-brand-border-heavy font-black shadow-[4px_4px_0_0_rgba(10,10,10,1)] transition-all hover:shadow-none"
                                        >
                                            定策内容方案 <ArrowRight className="ml-2" size={18} />
                                        </Button>
                                    </div>
                                    <button 
                                        onClick={() => setResearchData(null)}
                                        className="w-full text-xs font-bold text-slate-400 hover:text-brand-primary flex items-center justify-center gap-2"
                                    >
                                        <Undo size={12} /> 重新调整关键词
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                            <Card className="p-8 border-2 border-brand-border-heavy bg-white">
                                <h3 className="text-sm font-black text-brand-text-primary uppercase tracking-widest mb-6 border-b pb-4">配置您的 Stellar 内容</h3>
                                
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">语气语调</label>
                                        <select 
                                            value={form.tone}
                                            onChange={(e) => setForm({...form, tone: e.target.value as any})}
                                            className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-brand-primary transition-all text-xs font-bold"
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
                                            onChange={(e) => setForm({...form, type: e.target.value as any})}
                                            className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-brand-primary transition-all text-xs font-bold"
                                        >
                                            <option value="blog">深度博客文章</option>
                                            <option value="landing_page">高转化落地页</option>
                                            <option value="guide">操作指南/白皮书</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">原始草稿 (可选优化)</label>
                                        <textarea 
                                            value={form.originalContent}
                                            onChange={(e) => setForm({...form, originalContent: e.target.value})}
                                            placeholder="粘贴内容即可进行'整容级'优化..."
                                            className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-brand-primary transition-all text-[10px] h-24"
                                        />
                                    </div>
                                </div>
                            </Card>

                            <div className="p-8 bg-brand-primary text-white rounded-2xl shadow-xl shadow-brand-primary/20 relative overflow-hidden">
                                <div className="absolute -right-4 -bottom-4 opacity-10">
                                    <Sparkles size={120} />
                                </div>
                                <h4 className="text-lg font-black italic mb-2">准备好起飞了吗？</h4>
                                <p className="text-xs text-white/70 mb-8 leading-relaxed">
                                    我们将结合右侧的竞品骨架和行业实体，为您生成一篇具有“绝对引力”的文案。
                                </p>
                                <Button 
                                    onClick={handleRewrite}
                                    disabled={loading}
                                    className="w-full py-6 bg-brand-secondary text-brand-text-primary border-2 border-black font-black shadow-[4px_4px_0_0_rgba(10,10,10,1)] transition-all active:scale-95 hover:shadow-none"
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : "支付 50 积分，启动智作"}
                                </Button>
                            </div>

                            <button onClick={() => setStep(1)} className="w-full text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                                <ArrowLeft size={12} /> 返回市场研究
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                            <Card className="p-8 bg-emerald-50 border-4 border-emerald-500/30 rounded-2xl flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg rotate-3">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h4 className="text-2xl font-black text-emerald-700 font-display italic">智作已送达！</h4>
                                <p className="text-sm text-emerald-600 mt-4 mb-8 leading-relaxed">
                                    这篇内容已经过全方位打磨，GEO 与 SEO 评分均已进入卓越区间。
                                </p>
                                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase">SEO</div>
                                        <div className="text-2xl font-black text-emerald-600">{auditResult?.scores?.seo}%</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                                        <div className="text-[10px] font-black text-slate-400 uppercase">GEO</div>
                                        <div className="text-2xl font-black text-brand-primary">{auditResult?.scores?.geo}%</div>
                                    </div>
                                </div>
                                <Link href="/dashboard" className="w-full">
                                    <Button className="w-full py-6 bg-brand-primary text-white font-black border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                                        前往仪表盘开启追踪
                                    </Button>
                                </Link>
                            </Card>
                            
                            <button 
                                onClick={() => { setStep(1); setResearchData(null); setFinalResult(null); }}
                                className="w-full text-xs font-bold text-slate-400 hover:text-brand-primary underline transition-colors"
                            >
                                开启新的创作旅程
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Side: Visual Data Area */}
                <div className="lg:col-span-8">
                    {loading && !finalResult && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[600px] text-center space-y-8 animate-pulse">
                            <div className="relative">
                                <Globe size={80} className="text-brand-primary animate-spin-slow" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Search size={32} className="text-brand-secondary animate-bounce" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-brand-text-primary italic font-display">阿拉丁正在施法...</h3>
                                <p className="text-brand-text-secondary font-bold uppercase tracking-[0.2em] text-xs">
                                    {step === 1 ? '正在同步全球搜索数据与实体仓库' : '正在逆向拆解竞品骨架并注入 GEO 增益'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-brand-primary animate-bounce delay-75"></div>
                                <div className="w-2 h-2 rounded-full bg-brand-secondary animate-bounce delay-150"></div>
                                <div className="w-2 h-2 rounded-full bg-brand-primary animate-bounce delay-300"></div>
                            </div>
                        </div>
                    )}

                    {step === 1 && !loading && researchData && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* Topic Intelligence Heatmap (Visual List) */}
                            <Card className="p-8 border-2 border-brand-border-heavy bg-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <BarChart3 size={120} />
                                </div>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
                                            <TrendingUp size={24} />
                                        </div>
                                        <h2 className="text-2xl font-black text-brand-text-primary font-display italic uppercase tracking-tighter">话题意图热力图 (Keyword Intelligence)</h2>
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] uppercase tracking-widest">
                                        基于 DataForSEO 实时数据
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {researchData.map((topic, i) => (
                                        <div key={i} className="flex flex-col p-5 bg-brand-surface/40 border-2 border-slate-50 rounded-2xl hover:border-brand-secondary transition-all group relative cursor-pointer active:scale-95">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-black text-brand-text-primary group-hover:text-brand-secondary transition-colors">{topic.keyword}</span>
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-secondary opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                    <MousePointer2 size={14} />
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-end justify-between gap-4">
                                                <div className="flex-1 space-y-1.5">
                                                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase">
                                                        <span>竞争程度</span>
                                                        <span>{topic.competition}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full transition-all duration-1000 ${topic.competition < 40 ? 'bg-emerald-400' : topic.competition < 70 ? 'bg-amber-400' : 'bg-red-400'}`} 
                                                            style={{width: `${topic.competition}%`}} 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[16px] font-black text-brand-text-primary leading-none">{topic.volume}</div>
                                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">月搜索量</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Preliminary Audit Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-8 border-2 border-brand-border-heavy bg-brand-primary/5">
                                    <h3 className="text-xs font-black text-brand-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Target size={16} /> 发现的流量缺口 (Traffic Gaps)
                                    </h3>
                                    <div className="space-y-4">
                                        {auditResult?.suggestions?.slice(0, 3).map((s: string, i: number) => (
                                            <div key={i} className="flex gap-4 items-start">
                                                <div className="w-5 h-5 rounded bg-brand-primary flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5">{i+1}</div>
                                                <p className="text-xs font-bold text-brand-text-primary leading-relaxed">{s}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                                <Card className="p-8 border-2 border-brand-border-heavy bg-white">
                                    <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Database size={16} className="text-brand-secondary" /> 相关的实体资产 (Real-world Entities)
                                    </h3>
                                    <div className="space-y-3">
                                        {auditResult?.entities?.slice(0, 3).map((e: any, i: number) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                                <div className="w-2 h-2 rounded-full bg-brand-secondary"></div>
                                                <span className="text-xs font-black text-brand-text-primary truncate">{e.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {step === 2 && auditResult && !loading && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                            {/* Competitor Analysis Section */}
                            <Card className="p-10 border-2 border-brand-border-heavy bg-white">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                            <Users size={28} />
                                        </div>
                                        <h2 className="text-2xl font-black text-brand-text-primary font-display italic uppercase tracking-tighter leading-none">
                                            竞品骨架拆解 <br />
                                            <span className="text-sm font-black text-slate-400 not-italic">Competitive Landscape (H1-H4 Layers)</span>
                                        </h2>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-8">
                                    {auditResult.competitors?.map((comp: any, i: number) => (
                                        <div key={i} className="border-2 border-slate-50 p-8 rounded-3xl bg-brand-surface/30 hover:border-brand-primary/20 transition-all group/comp">
                                            <div className="flex items-center gap-4 mb-6 border-b border-white pb-6">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-sm font-black shadow-sm">0{i+1}</div>
                                                <div className="flex-1 truncate">
                                                    <div className="text-sm font-black text-brand-text-primary truncate">{comp.title}</div>
                                                    <div className="text-[10px] text-brand-primary font-mono truncate hover:underline cursor-pointer">{comp.url}</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {comp.headings.map((h: any, j: number) => (
                                                    <div key={j} className={`px-4 py-3 bg-white border border-slate-100 rounded-xl text-[10px] font-bold truncate transition-all ${h.level > 2 ? 'opacity-60 pl-6' : 'shadow-sm'}`}>
                                                        <span className="text-brand-secondary mr-2">H{h.level}</span> {h.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Master Outline Suggestion */}
                            <Card className="p-12 border-4 border-brand-primary bg-white shadow-[16px_16px_0_0_rgba(151,71,255,0.08)] relative overflow-hidden rounded-3xl">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none rotate-12">
                                    <Sparkles size={240} />
                                </div>
                                <div className="flex items-center gap-4 mb-12">
                                    <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-xl shadow-brand-primary/30">
                                        <FileText size={32} />
                                    </div>
                                    <h2 className="text-3xl font-black text-brand-text-primary font-display italic uppercase tracking-tighter">阿拉丁·大师大纲 (Master Outline)</h2>
                                </div>
                                
                                <div className="space-y-6 relative z-10">
                                    {auditResult.masterOutline?.map((h: any, i: number) => (
                                        <div key={i} className={`flex items-start gap-6 ${h.level === 1 ? 'pb-4 border-b border-slate-100 mb-4' : ''}`}>
                                            <div className={`shrink-0 font-mono text-xs font-black p-1.5 rounded border-2 transition-all ${h.level === 1 ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-slate-300 border-slate-50'}`}>H{h.level}</div>
                                            <div className={`flex-1 ${h.level === 1 ? 'text-2xl font-black text-brand-text-primary italic' : h.level === 2 ? 'text-lg font-black text-slate-700' : 'text-sm font-bold text-slate-500 pl-4 border-l-2 border-slate-50 ml-4'}`}>
                                                {h.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 p-6 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl text-white shadow-lg">
                                    <div className="flex gap-4 items-center">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            <Zap size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase tracking-widest">核心增益逻辑 (Information Gain)</h4>
                                            <p className="text-xs font-medium text-white/80 mt-1">
                                                我们已识别竞品 1, 2, 3 的共通点，并在您的大纲中插入了对手均未涉及的“深度行业见解”模块。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {step === 3 && finalResult && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                            {/* Navigation Tabs */}
                            <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200 shadow-inner">
                                <button 
                                    onClick={() => setViewMode('preview')}
                                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-white text-brand-primary shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Eye size={14} /> 渲染预览
                                </button>
                                <button 
                                    onClick={() => setViewMode('markdown')}
                                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'markdown' ? 'bg-white text-brand-primary shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Code size={14} /> Markdown
                                </button>
                                <button 
                                    onClick={() => setViewMode('schema')}
                                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'schema' ? 'bg-white text-brand-primary shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Braces size={14} /> Schema 代码
                                </button>
                            </div>

                            {/* Output Area */}
                            <Card className="p-12 border-2 border-brand-border-heavy bg-white relative shadow-[20px_20px_0_0_rgba(10,10,10,0.03)] rounded-3xl">
                                {viewMode === 'preview' && (
                                    <div className="prose prose-brand max-w-none">
                                        <h1 className="text-4xl font-black mb-10 italic text-brand-text-primary leading-[1.1]">{finalResult.seoMetadata?.title}</h1>
                                        <div className="space-y-8 text-brand-text-secondary leading-relaxed text-lg font-normal">
                                            {finalResult.content?.split('\n').map((line: string, i: number) => {
                                                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-black text-brand-text-primary pt-8 border-b-4 border-slate-50 pb-2">{line.replace('## ', '')}</h2>;
                                                if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold text-brand-text-primary pt-4 italic">{line.replace('### ', '')}</h3>;
                                                if (line.startsWith('- ')) return <li key={i} className="ml-6 list-disc pl-2 marker:text-brand-secondary">{line.replace('- ', '')}</li>;
                                                if (!line.trim()) return <br key={i} />;
                                                return <p key={i}>{line}</p>;
                                            })}
                                        </div>

                                        {/* Attribution Section (New) */}
                                        <div className="mt-20 p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                                <Database size={16} /> 引用来源与数据审计 (Sources & Citations)
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-2">已绑定的地图实体</span>
                                                        <div className="space-y-1">
                                                            {auditResult.entities?.map((e: any, i: number) => (
                                                                <div key={i} className="text-xs font-bold text-brand-text-primary truncate flex items-center gap-2">
                                                                    <div className="w-1 h-1 rounded-full bg-brand-secondary" /> {e.title}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-2">已参考的竞品骨架</span>
                                                        <div className="space-y-1">
                                                            {auditResult.competitors?.map((c: any, i: number) => (
                                                                <div key={i} className="text-xs font-bold text-slate-500 truncate flex items-center gap-2">
                                                                    <div className="w-1 h-1 rounded-full bg-slate-300" /> {c.title.slice(0, 30)}...
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {viewMode === 'markdown' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                                            <span className="text-xs font-black text-slate-500">MARKDOWN 源代码</span>
                                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(finalResult.content)} className="bg-white border-slate-200 gap-2 font-bold">
                                                <Copy size={12} /> 复制代码
                                            </Button>
                                        </div>
                                        <textarea 
                                            readOnly
                                            value={finalResult.content}
                                            className="w-full h-[600px] p-8 bg-slate-900 text-slate-300 font-mono text-xs rounded-2xl outline-none border-none shadow-inner"
                                        />
                                    </div>
                                )}

                                {viewMode === 'schema' && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center bg-violet-50 p-6 rounded-2xl border-2 border-violet-100">
                                            <div className="flex gap-4 items-center">
                                                <Braces className="text-violet-600" size={32} />
                                                <div>
                                                    <span className="text-sm font-black text-violet-700 block">Schema.org (JSON-LD)</span>
                                                    <span className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">提升谷歌搜索点击率的关键代码</span>
                                                </div>
                                            </div>
                                            <Button size="sm" onClick={() => copyToClipboard(finalResult.schema)} className="bg-violet-600 hover:bg-violet-700 gap-2 font-black shadow-lg shadow-violet-200 px-6">
                                                <Copy size={12} /> 复制全文
                                            </Button>
                                        </div>
                                        <pre className="p-8 bg-slate-900 text-violet-300 font-mono text-xs rounded-2xl overflow-auto h-[450px] shadow-inner">
                                            {JSON.stringify(finalResult.schema, null, 2)}
                                        </pre>
                                        <Card className="p-4 bg-brand-surface border-none flex items-start gap-4">
                                            <Info className="text-brand-primary mt-1" size={16} />
                                            <p className="text-[10px] font-bold text-brand-text-muted leading-relaxed uppercase">
                                                将此代码块插入网页的 &lt;head&gt; 部分。它会告诉 Google 这是一个高质量的 Article，并显著增加获得精选摘要（Rich Snippets）的机会。
                                            </p>
                                        </Card>
                                    </div>
                                )}
                            </Card>

                            {/* Additional Intelligence Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="p-10 border-2 border-brand-border bg-white rounded-3xl">
                                    <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <ImageIcon className="text-brand-secondary" size={20} /> 视觉配图方案建议
                                    </h3>
                                    <div className="space-y-4">
                                        {finalResult.imageSuggestions?.map((img: string, i: number) => (
                                            <div key={i} className="p-5 bg-brand-surface border border-brand-border rounded-2xl text-xs font-bold text-brand-text-secondary flex gap-4 hover:bg-white transition-all">
                                                <div className="w-6 h-6 rounded-full bg-brand-secondary text-white flex items-center justify-center shrink-0 text-[10px] font-black shadow-sm">{i+1}</div>
                                                {img}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                                <Card className="p-10 border-2 border-brand-border bg-white rounded-3xl">
                                    <h3 className="text-xs font-black text-brand-text-muted uppercase tracking-widest mb-8 flex items-center gap-3">
                                        <LinkIcon className="text-brand-primary" size={20} /> 智能内部链接建议
                                    </h3>
                                    <div className="space-y-4">
                                        {finalResult.internalLinks?.map((link: string, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-brand-primary transition-all group cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-brand-primary group-hover:scale-150 transition-transform" />
                                                    <span className="text-xs font-mono font-bold text-slate-600 truncate">/{link}</span>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
