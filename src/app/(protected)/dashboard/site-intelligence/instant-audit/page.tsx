'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import GalaxyMap from '@/components/dashboard/site-intelligence/GalaxyMap';
import HealthReport from '@/components/dashboard/site-intelligence/HealthReport';
import Link from 'next/link';
import { authClient } from "@/lib/auth-client";
import { Wallet } from 'lucide-react';

interface PageMeta {
    url?: string;
    title?: string;
    description?: string;
    h1?: string;
    loadTime?: number;
    wordCount?: number;
    internalLinks?: number;
    hasOgImage?: boolean;
}

interface GraphNode {
    id: string;
    name: string;
    val: number;
    color: string;
    type: string;
    meta?: PageMeta;
}

interface GraphData {
    nodes: GraphNode[];
    links: { source: string; target: string }[];
}

interface AuditHistoryItem {
    id: string;
    createdAt: string;
    pageCount: number;
    techScore: number | null;
    graphData: GraphData | null;
    issueReport: any | null;
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} 小时前`;
    return `${Math.floor(hrs / 24)} 天前`;
}

function InstantAuditInner() {
    const searchParams = useSearchParams();

    const [domain, setDomain] = useState(searchParams.get('site') ?? '');
    const [loading, setLoading] = useState(false);
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [businessDna, setBusinessDna] = useState<any>(null);
    const [issueReport, setIssueReport] = useState<any>(null);
    const [status, setStatus] = useState('READY_FOR_SCAN');
    const [scanned, setScanned] = useState(0);
    const [total, setTotal] = useState(0);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

    // Persistence state
    const [savedSiteId, setSavedSiteId] = useState<string | null>(null);
    const [justSaved, setJustSaved] = useState(false);
    const [auditHistory, setAuditHistory] = useState<AuditHistoryItem[]>([]);
    const [activeAuditId, setActiveAuditId] = useState<string | null>(null);

    // New manual save states
    const [isSaving, setIsSaving] = useState(false);
    const [techScore, setTechScore] = useState<number | null>(null);
    const [showInlineReport, setShowInlineReport] = useState(false);

    const auditIdToLoad = searchParams.get('auditId');
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [insufficientCredits, setInsufficientCredits] = useState(false);
    const [auditCost, setAuditCost] = useState(5);

    // Fetch actual cost from skills list
    useEffect(() => {
        fetch('/api/skills/list')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.skills) {
                    const auditSkill = data.skills.find((s: any) => s.name === 'SITE_AUDIT_BASIC');
                    if (auditSkill?.cost) {
                        setAuditCost(auditSkill.cost);
                    }
                }
            })
            .catch(console.error);
    }, []);

    // 1. Initial Load Logic — only triggers when a specific auditId is requested via URL
    //    (e.g. navigating from audit history list). Plain ?site= just pre-fills the input.
    useEffect(() => {
        if (!auditIdToLoad || !domain) return;

        const loadSpecificAudit = async () => {
            setLoading(true);
            setStatus('LOADING_HISTORY');
            try {
                const sitesRes = await fetch('/api/dashboard/sites');
                const sitesData = await sitesRes.json();
                const site = sitesData.sites?.find((s: any) => s.domain === domain);
                if (!site) { setStatus('HISTORY_LOAD_FAILED'); return; }

                setSavedSiteId(site.id);

                const auditRes = await fetch(`/api/dashboard/sites/${site.id}/audits/${auditIdToLoad}`);
                const auditData = await auditRes.json();

                if (auditData.success && auditData.data.graphData) {
                    setGraphData(auditData.data.graphData);
                    setActiveAuditId(auditData.data.id);
                    setTechScore(auditData.data.techScore);
                    setIssueReport(auditData.data.issueReport);
                    setStatus('GALAXY_CONSTRUCTED');
                } else {
                    setStatus('HISTORY_LOAD_FAILED');
                }
            } catch (e) {
                console.error("Failed to load audit history:", e);
                setStatus('SYSTEM_ERROR');
            } finally {
                setLoading(false);
            }
        };

        loadSpecificAudit();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auditIdToLoad, domain]);

    // 2. Load audit history list for the sidebar
    useEffect(() => {
        if (!savedSiteId) return;
        fetch(`/api/dashboard/sites/${savedSiteId}/audits`)
            .then((r) => r.json())
            .then((data) => setAuditHistory(data.audits ?? []))
            .catch(console.error);
    }, [savedSiteId]);

    const handleStartAudit = async () => {
        if (!domain) return;

        // Check credits before starting
        const currentCredits = (session?.user as any)?.credits ?? 0;
        if (currentCredits < auditCost) {
            setInsufficientCredits(true);
            // Scroll to the warning
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setInsufficientCredits(false);
        setLoading(true);
        setGraphData({ nodes: [], links: [] });
        setSelectedNode(null);
        setScanned(0);
        setTotal(0);
        setBusinessDna(null);
        setJustSaved(false);
        setSavedSiteId(null);
        setAuditHistory([]);
        setActiveAuditId(null);
        setStatus('INITIALIZING_PROBE');

        try {
            const response = await fetch('/api/dashboard/site-intelligence/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain }),
            });

            if (!response.ok || !response.body) {
                setStatus('PROBE_FAILED');
                setLoading(false);
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            setStatus('SCANNING_GALAXY');

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const event = JSON.parse(line.slice(6));
                        if (event.type === 'discovery') {
                            // 初始渲染全量骨架图
                            if (event.graphData) {
                                setGraphData(event.graphData);
                            }
                            setTotal(event.urls?.length || 0);
                            setStatus('SITE_STRUCTURE_DISCOVERED');
                        } else if (event.type === 'dna_extracted') {
                            setBusinessDna(event.dna);
                        } else if (event.type === 'progress') {
                            setScanned(event.scanned);
                            setTotal(event.total);
                            setStatus('SCANNING_GALAXY');
                            // 可选：在这里可以根据 event.page 更新 graphData 中的单个节点状态
                        } else if (event.type === 'done') {
                            setGraphData(event.graphData);
                            setScanned(event.scanned);
                            setTotal(event.total);
                            setTechScore(event.techScore ?? null);
                            setIssueReport(event.issueReport ?? null);
                            setStatus('GALAXY_CONSTRUCTED');
                            setLoading(false);
                        } else if (event.type === 'error') {
                            setStatus('PROBE_FAILED');
                            setLoading(false);
                        }
                    } catch { }
                }
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
            setStatus('SYSTEM_ERROR');
        }
    };

    const handleNodeClick = useCallback((node: any) => {
        setSelectedNode(node as GraphNode);
    }, []);

    const handleSaveSite = async () => {
        if (!domain || graphData.nodes.length === 0) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/dashboard/site-intelligence/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain,
                    graphData,
                    techScore,
                    businessDna,
                    issueReport
                })
            });
            const data = await res.json();
            if (data.success) {
                setSavedSiteId(data.siteId);
                setActiveAuditId(data.auditId);
                setJustSaved(true);
                setTimeout(() => setJustSaved(false), 4000);
            } else {
                alert("Failed to save: " + data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Error saving site to dashboard.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleHistoryClick = (audit: AuditHistoryItem) => {
        if (!audit.graphData) return;

        // Clean up URL so it matches the newly selected audit
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('auditId', audit.id);
        newUrl.searchParams.delete('rescan');
        router.push(newUrl.pathname + newUrl.search);

        setGraphData(audit.graphData);
        setActiveAuditId(audit.id);
        setTechScore(audit.techScore);
        setIssueReport(audit.issueReport);
        setSelectedNode(null);
        setStatus('GALAXY_CONSTRUCTED');
    };

    const progressPercent = total > 0 ? Math.round((scanned / total) * 100) : 0;

    return (
        <div className="p-6 space-y-6 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Link
                            href={savedSiteId ? `/dashboard/site-intelligence/${savedSiteId}` : "/dashboard/site-intelligence"}
                            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            返回
                        </Link>
                        <span className="text-slate-300">/</span>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">即时审计</h1>
                        <Badge variant="default" className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border-0">公测版</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                        主题权威度可视化与技术 SEO 审计
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-start md:items-center">
                    <div className="flex gap-2 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="例如: scaletotop.com"
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 w-full md:w-64 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none shadow-sm transition-all"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !loading && handleStartAudit()}
                        />
                        {Number((session?.user as any)?.credits || 0) < auditCost ? (
                            <Link href="/dashboard/billing" className="flex-shrink-0">
                                <Button
                                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm px-6 font-bold"
                                >
                                    积分不足，点击充值
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                onClick={handleStartAudit}
                                disabled={loading || !domain.trim()}
                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm px-6 font-bold flex-shrink-0"
                            >
                                {loading ? '扫描中...' : '发起扫描'}
                            </Button>
                        )}
                    </div>
                    <div className="hidden sm:flex flex-col items-end shrink-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">本次审计消耗</span>
                        <span className="text-xs font-bold text-slate-500">{auditCost} 积分</span>
                    </div>
                </div>
            </div>

            {/* Saved notification */}
            {justSaved && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm w-fit animate-pulse">
                    <span>✓</span>
                    <span>审计已保存至您的站点列表</span>
                </div>
            )}

            {/* Insufficient Credits Message */}
            {insufficientCredits && (
                <Card className="bg-rose-50 border-rose-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top duration-300 rounded-3xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <h3 className="text-rose-900 font-black italic font-display italic tracking-tight">您的积分不足</h3>
                            <p className="text-rose-600 text-sm font-medium">本次审计需要 <span className="font-black">{auditCost}</span> 积分，您当前只有 <span className="font-black">{ (session?.user as any)?.credits ?? 0 }</span> 积分。</p>
                        </div>
                    </div>
                    <Link href="/dashboard/billing">
                        <Button className="bg-rose-600 hover:bg-rose-700 text-white font-black px-8 py-6 shadow-xl shadow-rose-200 rounded-2xl">
                            立即前往充值
                        </Button>
                    </Link>
                </Card>
            )}

            {/* 进度条 */}
            {loading && total > 0 && (
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        <span>正在扫描页面</span>
                        <span>{scanned} / {total} &nbsp;({progressPercent}%)</span>
                    </div>
                    <div className="w-full bg-zinc-800/60 rounded-full h-1">
                        <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* 核心展示区 */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    {graphData.nodes.length === 0 && !loading ? (
                        <Card className="bg-white border-slate-200 shadow-sm flex flex-col items-center justify-center py-24 px-8 text-center min-h-[480px]">
                            <div className="w-16 h-16 rounded-2xl bg-brand-primary/8 flex items-center justify-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">输入域名，开始即时审计</h2>
                            <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
                                在顶部输入框中填写要审计的域名（如 <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">scaletotop.com</span>），然后点击「发起扫描」。
                            </p>
                            <div className="flex gap-2 w-full max-w-sm">
                                <input
                                    type="text"
                                    placeholder="例如: scaletotop.com"
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 flex-1 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none shadow-sm transition-all"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !loading && handleStartAudit()}
                                    autoFocus
                                />
                                <Button
                                    onClick={handleStartAudit}
                                    disabled={loading || !domain.trim()}
                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm px-5 font-bold flex-shrink-0"
                                >
                                    扫描
                                </Button>
                            </div>
                        </Card>
                    ) : (
                    <Card className="bg-white border-slate-200 p-0 overflow-hidden shadow-sm">
                        <GalaxyMap
                            siteId={savedSiteId || ''}
                            data={graphData}
                            isLoading={loading}
                            onNodeClick={handleNodeClick}
                        />
                    </Card>
                    )}
                </div>

                {/* 侧边 HUD */}
                <div className="space-y-4">
                    {/* System Status */}
                    <Card className="bg-white border-slate-200 p-5 shadow-sm">
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">系统状态</h3>
                            <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${loading ? 'bg-amber-500 animate-pulse' : status === 'GALAXY_CONSTRUCTED' ? 'bg-green-500' : status.includes('FAILED') || status.includes('ERROR') ? 'bg-red-500' : 'bg-slate-300'}`} />
                                <span className="font-mono text-[11px] text-slate-600 break-all">{status}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Pages Detected */}
                    <Card className="bg-gradient-to-br from-brand-primary/5 to-indigo-50 border-brand-primary/10 p-5 shadow-sm">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-bold tracking-widest text-brand-primary uppercase">探明页面数</h3>
                            <div className="text-4xl font-bold text-slate-900 tracking-tight">{graphData.nodes.length}</div>
                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">已确认的节点</p>
                        </div>
                    </Card>

                    {/* Issue Summary */}
                    {(status === 'GALAXY_CONSTRUCTED' || activeAuditId) && issueReport && (
                        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-5 space-y-3">
                                <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">发现问题</h3>
                                {issueReport.issues.length > 0 ? (
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <div className="flex flex-col items-center px-2 py-1 bg-red-50 rounded-lg min-w-[32px]">
                                                <span className="text-[10px] font-bold text-red-600">{issueReport.stats.critical}</span>
                                                <span className="text-[8px] text-red-400 uppercase">严重</span>
                                            </div>
                                            <div className="flex flex-col items-center px-2 py-1 bg-amber-50 rounded-lg min-w-[32px]">
                                                <span className="text-[10px] font-bold text-amber-600">{issueReport.stats.warning}</span>
                                                <span className="text-[8px] text-amber-400 uppercase">警告</span>
                                            </div>
                                            <div className="flex flex-col items-center px-2 py-1 bg-blue-50 rounded-lg min-w-[32px]">
                                                <span className="text-[10px] font-bold text-blue-600">{issueReport.stats.info}</span>
                                                <span className="text-[8px] text-blue-400 uppercase">提示</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowInlineReport(v => !v)}
                                            className="text-[10px] font-bold text-brand-primary hover:underline"
                                        >
                                            {showInlineReport ? '收起' : '查看详情'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-green-600 py-1">
                                        <span className="text-sm font-bold">✓</span>
                                        <span className="text-xs font-bold">未发现问题</span>
                                    </div>
                                )}
                                {savedSiteId && (
                                    <Link
                                        href={`/dashboard/site-intelligence/${savedSiteId}`}
                                        className="block text-[10px] text-slate-400 hover:text-brand-primary hover:underline"
                                    >
                                        前往站点控制台查看完整报告 →
                                    </Link>
                                )}
                            </div>
                            {showInlineReport && (
                                <div className="border-t border-slate-100 p-4">
                                    <HealthReport issueReport={issueReport} />
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Audit History */}
                    {auditHistory.length > 0 && (
                        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-3">
                            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">历史审计</h3>
                            <div className="space-y-1.5">
                                {auditHistory.slice(0, 5).map((audit) => (
                                    <button
                                        key={audit.id}
                                        onClick={() => handleHistoryClick(audit)}
                                        disabled={!audit.graphData}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all
                                            ${activeAuditId === audit.id
                                                ? 'bg-brand-primary/5 border border-brand-primary/20 ring-1 ring-brand-primary/10'
                                                : 'bg-slate-50 hover:bg-slate-100 border border-transparent'}
                                            ${!audit.graphData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-mono">{timeAgo(audit.createdAt)}</p>
                                            <p className="text-[11px] font-medium text-slate-700">{audit.pageCount} 页面</p>
                                        </div>
                                        {audit.techScore !== null && (
                                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${audit.techScore >= 80 ? 'bg-green-100 text-green-700' :
                                                audit.techScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {audit.techScore}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Node Details */}
                    {selectedNode ? (
                        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-3">
                            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">节点详情</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">标题</p>
                                    <p className="text-sm text-slate-900 font-semibold leading-snug line-clamp-2">{selectedNode.meta?.title || selectedNode.name}</p>
                                </div>
                                {selectedNode.meta?.h1 && (
                                    <div>
                                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">一级标题 (H1)</p>
                                        <p className="text-xs text-slate-700 leading-snug line-clamp-2">{selectedNode.meta.h1}</p>
                                    </div>
                                )}
                                {selectedNode.meta?.description && (
                                    <div>
                                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">元描述 (Meta Description)</p>
                                        <p className="text-xs text-slate-500 leading-snug line-clamp-3">{selectedNode.meta.description}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                                    {selectedNode.meta?.loadTime !== undefined && (
                                        <div>
                                            <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">加载耗时</p>
                                            <p className="text-xs text-slate-700 font-mono font-medium">{selectedNode.meta.loadTime}ms</p>
                                        </div>
                                    )}
                                    {selectedNode.meta?.wordCount !== undefined && (
                                        <div>
                                            <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">字词数</p>
                                            <p className="text-xs text-slate-700 font-mono font-medium">{selectedNode.meta.wordCount.toLocaleString()}</p>
                                        </div>
                                    )}
                                    {selectedNode.meta?.internalLinks !== undefined && (
                                        <div>
                                            <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">页面内链数</p>
                                            <p className="text-xs text-slate-700 font-mono font-medium">{selectedNode.meta.internalLinks}</p>
                                        </div>
                                    )}
                                    {selectedNode.meta?.hasOgImage !== undefined && (
                                        <div>
                                            <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">社交分享缩略图 (OG Image)</p>
                                            <p className={`text-xs font-mono font-medium ${selectedNode.meta.hasOgImage ? 'text-green-600' : 'text-red-500'}`}>
                                                {selectedNode.meta.hasOgImage ? '✓ 包含' : '✗ 缺失'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {selectedNode.meta?.url && (
                                    <a
                                        href={selectedNode.meta.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block pt-2 text-[10px] text-brand-primary hover:text-brand-primary/80 font-mono break-all truncate transition-colors"
                                    >
                                        {selectedNode.meta.url}
                                    </a>
                                )}
                            </div>
                        </Card>
                    ) : (
                        <Card className="bg-slate-50 border-slate-200 border-dashed p-8 shadow-sm flex items-center justify-center">
                            <p className="text-xs text-slate-400 font-medium text-center">
                                点击星图中的任意节点<br />以查看其页面详情
                            </p>
                        </Card>
                    )}

                    {/* Export and Save */}
                    <div className="space-y-4 pt-2">
                        {status === 'GALAXY_CONSTRUCTED' && !savedSiteId && (
                            <Button
                                onClick={handleSaveSite}
                                disabled={isSaving || !graphData.nodes.length}
                                variant="primary"
                                className={`w-full font-bold tracking-widest uppercase py-6 ${isSaving ? 'bg-zinc-600' : 'bg-emerald-600 hover:bg-emerald-500'
                                    }`}
                            >
                                {isSaving ? '保存中...' : '💾 保存到控制台'}
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            disabled={!graphData.nodes.length}
                            className="w-full border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold tracking-widest uppercase py-6"
                        >
                            导出星图数据
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// useSearchParams needs Suspense boundary
export default function InstantAuditPage() {
    return (
        <Suspense fallback={
            <div className="p-6 space-y-6 min-h-screen animate-pulse">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-12 bg-slate-200 rounded"></div>
                            <div className="h-8 w-32 bg-slate-200 rounded-md"></div>
                            <div className="h-5 w-16 bg-brand-primary/20 rounded"></div>
                        </div>
                        <div className="h-4 w-64 bg-slate-100 rounded"></div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="h-10 w-full md:w-64 bg-slate-100 rounded-xl"></div>
                        <div className="h-10 w-24 bg-slate-800 rounded-xl shrink-0"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm min-h-[480px]"></div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl h-24 shadow-sm"></div>
                        <div className="bg-white border border-slate-200 rounded-xl h-24 shadow-sm"></div>
                        <div className="bg-white border border-slate-200 rounded-xl h-32 shadow-sm"></div>
                    </div>
                </div>
            </div>
        }>
            <InstantAuditInner />
        </Suspense>
    );
}
