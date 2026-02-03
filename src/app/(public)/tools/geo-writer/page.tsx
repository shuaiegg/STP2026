"use client";

import React, { useState } from 'react';
import { 
    Zap, 
    MapPin, 
    MessageSquare, 
    Type, 
    Sparkles, 
    Loader2, 
    ArrowRight,
    CheckCircle2,
    Copy,
    LayoutDashboard,
    Undo,
    ChevronDown,
    ChevronUp,
    FileText,
    Image as ImageIcon,
    Link as LinkIcon,
    Users
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function GEOWriterPage() {
    const [loading, setLoading] = useState(false);
    const [auditResult, setAuditResult] = useState<any>(null);
    const [finalResult, setFinalResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showOriginal, setShowOriginal] = useState(false);

    const [form, setForm] = useState({
        keywords: '',
        location: '',
        tone: 'professional',
        type: 'blog',
        originalContent: ''
    });

    // 1. FREE AUDIT
    const handleAudit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFinalResult(null);

        try {
            const response = await fetch('/api/skills/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skillName: 'stellar-writer',
                    input: { ...form, industry: 'General', auditOnly: true }
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '体检失败');

            setAuditResult(data.output.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 2. PAID REWRITE
    const handleRewrite = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/skills/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skillName: 'stellar-writer',
                    input: { ...form, industry: 'General', auditOnly: false }
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || '优化失败');

            setFinalResult(data.output.data);
            setAuditResult(data.output.data); // Update audit stats with final ones
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('已复制到剪贴板');
    };

    return (
        <div className="container mx-auto py-16 px-6 max-w-6xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/tools">
                    <Button variant="ghost" size="sm" className="text-brand-text-muted hover:text-brand-primary">
                        <ArrowRight className="rotate-180 mr-2" size={16} />
                        返回工具包
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Side: Form */}
                <div className="lg:col-span-5">
                    <div className="mb-10">
                        <div className="w-16 h-16 bg-brand-primary/10 border-2 border-brand-primary/20 flex items-center justify-center text-brand-primary mb-6 rounded-2xl">
                            <Sparkles size={32} />
                        </div>
                        <h1 className="text-4xl font-black text-brand-text-primary mb-4 font-display italic">
                            StellarWriter <br />智作优化器
                        </h1>
                        <p className="text-brand-text-secondary leading-relaxed">
                            B2B & SaaS 通用 SEO/GEO 引擎。先体检，后优化，让您的每一段话都具有引力。
                        </p>
                    </div>

                    <form onSubmit={handleAudit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-text-primary flex items-center gap-2">
                                <Zap size={16} className="text-brand-secondary" />
                                核心关键词 / 业务主题
                            </label>
                            <input 
                                required
                                value={form.keywords}
                                onChange={(e) => setForm({...form, keywords: e.target.value})}
                                placeholder="例如: dental clinic, CRM software"
                                className="w-full bg-white border-2 border-brand-border p-4 outline-none focus:border-brand-primary transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-brand-text-primary flex items-center gap-2">
                                <FileText size={16} className="text-brand-primary" />
                                原始文案 (可选，若需优化旧文)
                            </label>
                            <textarea 
                                value={form.originalContent}
                                onChange={(e) => setForm({...form, originalContent: e.target.value})}
                                placeholder="粘贴您现有的文章或段落..."
                                className="w-full bg-white border-2 border-brand-border p-4 h-32 outline-none focus:border-brand-primary transition-all text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-brand-text-primary">内容类型</label>
                                <select 
                                    value={form.type}
                                    onChange={(e) => setForm({...form, type: e.target.value as any})}
                                    className="w-full bg-white border-2 border-brand-border p-3 outline-none focus:border-brand-primary transition-all text-sm"
                                >
                                    <option value="blog">博客文章</option>
                                    <option value="landing_page">落地页文案</option>
                                    <option value="review_summary">深度分析</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-brand-text-primary">地理位置 (可选)</label>
                                <input 
                                    value={form.location}
                                    onChange={(e) => setForm({...form, location: e.target.value})}
                                    placeholder="London, etc."
                                    className="w-full bg-white border-2 border-brand-border p-3 outline-none focus:border-brand-primary transition-all text-sm"
                                />
                            </div>
                        </div>

                        {!auditResult ? (
                            <Button 
                                disabled={loading}
                                type="submit" 
                                className="w-full py-8 text-lg bg-brand-primary text-white border-b-4 border-black hover:translate-y-[2px] hover:border-b-0 transition-all font-black uppercase tracking-widest shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-none"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "立即执行 360° 诊断 (免费)"}
                            </Button>
                        ) : !finalResult ? (
                            <div className="space-y-4">
                                <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-black text-amber-700 uppercase tracking-widest">诊断得分: {auditResult.geoScore}</span>
                                        <span className="px-2 py-1 bg-amber-200 text-amber-800 text-[10px] font-black rounded">建议优化</span>
                                    </div>
                                    <ul className="text-xs text-amber-800 space-y-2 mb-6">
                                        {auditResult.suggestions.slice(0, 3).map((s: string, i: number) => (
                                            <li key={i} className="flex gap-2">
                                                <Zap size={12} className="shrink-0" /> {s}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button 
                                        onClick={handleRewrite}
                                        disabled={loading}
                                        className="w-full py-6 bg-brand-secondary text-brand-text-primary border-2 border-brand-border-heavy font-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                    >
                                        {loading ? <Loader2 className="animate-spin mr-2" /> : "支付 50 积分，启动魔法重写"}
                                    </Button>
                                </div>
                                <button onClick={() => setAuditResult(null)} className="w-full text-xs font-bold text-brand-text-muted hover:underline">重新诊断</button>
                            </div>
                        ) : (
                            <div className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-xl flex flex-col items-center">
                                <CheckCircle2 className="text-emerald-500 mb-2" size={32} />
                                <span className="text-lg font-black text-emerald-700">优化已完成！</span>
                                <p className="text-xs text-emerald-600 text-center mt-2 mb-4">
                                    文案已升级至 {finalResult.geoScore} 分。您可以将其发布并开启闭环监控。
                                </p>
                                <Button 
                                    onClick={() => setFinalResult(null)}
                                    variant="outline"
                                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                >
                                    开启闭环引用监控 (研发中)
                                </Button>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 border-2 border-red-100 text-red-600 text-sm font-bold flex items-center gap-3">
                                <Zap size={16} />
                                {error}
                            </div>
                        )}
                    </form>
                </div>

                {/* Right Side: Content Area */}
                <div className="lg:col-span-7">
                    {!auditResult && !finalResult ? (
                        <div className="border-2 border-dashed border-brand-border p-20 flex flex-col items-center justify-center text-center bg-brand-surface h-full min-h-[500px]">
                            <div className="w-20 h-20 bg-white border-2 border-brand-border flex items-center justify-center text-brand-border mb-6 rotate-3">
                                <Type size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-brand-text-muted mb-2">等待输入</h3>
                            <p className="text-brand-text-muted max-w-sm text-sm">
                                请在左侧填写核心信息。您可以选择输入已有文章进行优化，或输入关键词从零开始。
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* Score & Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="p-4 bg-white border-2 border-brand-border-heavy flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">GEO Score</span>
                                    <span className={`text-3xl font-black ${auditResult.scores?.geo > 80 ? 'text-emerald-600' : 'text-brand-primary'}`}>{auditResult.scores?.geo || auditResult.geoScore}%</span>
                                </Card>
                                <Card className="p-4 bg-white border-2 border-brand-border-heavy flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Entities</span>
                                    <span className="text-3xl font-black text-brand-text-primary">{auditResult.entities?.length || 0}</span>
                                </Card>
                                <Card className="p-4 bg-white border-2 border-brand-border-heavy flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">SEO Score</span>
                                    <span className="text-3xl font-black text-violet-600">{auditResult.scores?.seo || '--'}%</span>
                                </Card>
                            </div>

                            {/* Content Viewer */}
                            <Card className="p-8 border-2 border-brand-border-heavy bg-white relative shadow-[12px_12px_0_0_rgba(10,10,10,0.05)]">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-black text-brand-text-primary italic">
                                        {finalResult ? (showOriginal ? '原始文案预览' : 'AI 魔法优化版') : '诊断参考数据'}
                                    </h2>
                                    <div className="flex gap-2">
                                        {finalResult && (
                                            <button 
                                                onClick={() => setShowOriginal(!showOriginal)}
                                                className={`px-3 py-1 text-[10px] font-black border-2 transition-all flex items-center gap-1 ${showOriginal ? 'bg-brand-primary text-white border-black' : 'bg-white text-brand-text-primary border-brand-border'}`}
                                            >
                                                <Undo size={12} /> {showOriginal ? '查看优化版' : '恢复原稿'}
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => copyToClipboard(showOriginal ? form.originalContent : (finalResult?.content || ""))}
                                            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600"
                                            title="复制"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="prose prose-sm prose-brand max-w-none min-h-[300px]">
                                    {finalResult ? (
                                        <div className="space-y-8">
                                            <div className="whitespace-pre-wrap text-brand-text-secondary leading-relaxed">
                                                {showOriginal ? form.originalContent : finalResult.content.replace(/^# .*\n/, '')}
                                            </div>
                                            
                                            {auditResult.topics?.length > 0 && (
                                                <div className="pt-8 border-t border-brand-border">
                                                    <h4 className="text-xs font-black text-brand-text-primary uppercase mb-3 flex items-center gap-2">
                                                        <Sparkles size={14} className="text-brand-primary" /> 下一篇文章建议 (相关高搜索词)
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {auditResult.topics.map((t: string, i: number) => (
                                                            <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200 uppercase tracking-tighter">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-xs font-black text-brand-text-primary uppercase mb-2 flex items-center gap-2">
                                                    <Zap size={14} className="text-brand-secondary" /> 核心策略建议
                                                </h4>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {auditResult.suggestions.map((s: string, i: number) => (
                                                        <div key={i} className="p-3 bg-brand-surface border border-brand-border text-xs text-brand-text-secondary rounded-lg">
                                                            {s}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {auditResult.topics?.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-black text-brand-text-primary uppercase mb-2 flex items-center gap-2">
                                                        <Sparkles size={14} className="text-brand-primary" /> 话题探测器 (相关高搜索词)
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {auditResult.topics.map((t: string, i: number) => (
                                                            <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200 uppercase tracking-tighter">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {auditResult.competitors?.length > 0 && (
                                                <div className="pt-6 border-t border-brand-border">
                                                    <h4 className="text-xs font-black text-brand-text-primary uppercase mb-4 flex items-center gap-2">
                                                        <Users size={14} className="text-brand-secondary" /> 竞品骨架拆解 (Reverse Engineering)
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {auditResult.competitors.map((comp: any, i: number) => (
                                                            <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl group/comp">
                                                                <div className="text-[10px] font-bold text-slate-400 truncate mb-2">{comp.url}</div>
                                                                <div className="text-xs font-bold text-slate-700 mb-3">{comp.title}</div>
                                                                <div className="flex flex-wrap gap-1.5 opacity-60 group-hover/comp:opacity-100 transition-opacity">
                                                                    {comp.headings.slice(0, 6).map((h: any, j: number) => (
                                                                        <span key={j} className="px-2 py-0.5 bg-white border border-slate-200 text-[9px] text-slate-500 rounded whitespace-nowrap">
                                                                            H{h.level}: {h.text.slice(0, 20)}...
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="mt-4 text-[10px] italic text-brand-text-muted">
                                                        * 阿拉丁已自动分析以上竞品的逻辑漏洞，并将在重写时为您填入独家“信息增益”点。
                                                    </p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="text-xs font-black text-brand-text-primary uppercase mb-2 flex items-center gap-2">
                                                        <LinkIcon size={14} className="text-brand-primary" /> 推荐内链
                                                    </h4>
                                                    <div className="space-y-1">
                                                        {auditResult.recommendedInternalLinks?.map((l: string, i: number) => (
                                                            <div key={i} className="text-[10px] font-mono text-brand-text-muted truncate">/{l}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-brand-text-primary uppercase mb-2 flex items-center gap-2">
                                                        <ImageIcon size={14} className="text-emerald-500" /> 配图建议
                                                    </h4>
                                                    <div className="space-y-1">
                                                        {auditResult.imageSuggestions?.map((s: string, i: number) => (
                                                            <div key={i} className="text-[10px] italic text-brand-text-muted leading-tight">{s}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Entity List */}
                            {auditResult.entities?.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-brand-text-primary flex items-center gap-2 italic">
                                        <MapPin size={20} className="text-brand-secondary" />
                                        探测到的真实实体 (Entities Found)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {auditResult.entities.map((entity: any, idx: number) => (
                                            <div key={idx} className="border-2 border-brand-border p-4 bg-white hover:border-brand-primary transition-colors">
                                                <div className="font-bold text-brand-text-primary mb-1">{entity.title}</div>
                                                <div className="text-[10px] text-brand-text-muted truncate mb-2">{entity.address}</div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex text-amber-400">
                                                        {"★".repeat(Math.round(entity.rating || 0))}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-brand-text-muted">({entity.reviews_count})</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
