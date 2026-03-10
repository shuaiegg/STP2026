'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import GalaxyMap from '@/components/dashboard/site-intelligence/GalaxyMap';
import Link from 'next/link';

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

    // Auto-trigger rescan if ?rescan=1
    const shouldRescan = searchParams.get('rescan') === '1';
    const auditIdToLoad = searchParams.get('auditId');
    const router = useRouter();

    // 1. Initial Load Logic
    useEffect(() => {
        if (!domain) return;

        const loadHistoricalData = async () => {
            setLoading(true);
            try {
                // First, we need to find the siteId for this domain
                const sitesRes = await fetch('/api/dashboard/sites');
                const sitesData = await sitesRes.json();
                const site = sitesData.sites?.find((s: any) => s.domain === domain);

                if (!site) {
                    // Site doesn't exist yet, we must scan
                    if (shouldRescan) handleStartAudit();
                    else setLoading(false);
                    return;
                }

                setSavedSiteId(site.id);

                if (shouldRescan) {
                    handleStartAudit();
                    return;
                }

                if (auditIdToLoad) {
                    // Load specific historical audit
                    setStatus('LOADING_HISTORY');
                    const auditRes = await fetch(`/api/dashboard/sites/${site.id}/audits/${auditIdToLoad}`);
                    const auditData = await auditRes.json();

                    if (auditData.success && auditData.data.graphData) {
                        setGraphData(auditData.data.graphData);
                        setActiveAuditId(auditData.data.id);
                        setTechScore(auditData.data.techScore);
                        setStatus('GALAXY_CONSTRUCTED');
                    } else {
                        setStatus('HISTORY_LOAD_FAILED');
                    }
                } else {
                    // Try to load the most recent audit for this site
                    setStatus('CHECKING_HISTORY');
                    const auditsRes = await fetch(`/api/dashboard/sites/${site.id}/audits`);
                    const auditsData = await auditsRes.json();

                    if (auditsData.audits && auditsData.audits.length > 0 && auditsData.audits[0].graphData) {
                        const latest = auditsData.audits[0];
                        setGraphData(latest.graphData);
                        setActiveAuditId(latest.id);
                        setTechScore(latest.techScore);
                        setStatus('GALAXY_CONSTRUCTED');
                    } else {
                        // No history, prompt user to scan
                        setStatus('READY_FOR_SCAN');
                    }
                }
            } catch (e) {
                console.error("Failed to load history:", e);
                setStatus('SYSTEM_ERROR');
            } finally {
                setLoading(false);
            }
        };

        loadHistoricalData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [domain, shouldRescan, auditIdToLoad]);

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
        setLoading(true);
        setGraphData({ nodes: [], links: [] });
        setSelectedNode(null);
        setScanned(0);
        setTotal(0);
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
                    techScore
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
                            href="/dashboard/site-intelligence"
                            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            返回工具箱
                        </Link>
                        <span className="text-slate-300">/</span>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">即时审计</h1>
                        <Badge variant="default" className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border-0">公测版</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                        主题权威度可视化与技术 SEO 审计
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="例如: scaletotop.com"
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 w-full md:w-64 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none shadow-sm transition-all"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !loading && handleStartAudit()}
                    />
                    <Button
                        onClick={handleStartAudit}
                        disabled={loading || !domain.trim()}
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm px-6 font-bold flex-shrink-0"
                    >
                        {loading ? '扫描中...' : '发起扫描'}
                    </Button>
                </div>
            </div>

            {/* Saved notification */}
            {justSaved && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm w-fit animate-pulse">
                    <span>✓</span>
                    <span>审计已保存至您的站点列表</span>
                </div>
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
                    <Card className="bg-white border-slate-200 p-0 overflow-hidden shadow-sm">
                        <GalaxyMap
                            data={graphData}
                            isLoading={loading}
                            onNodeClick={handleNodeClick}
                        />
                    </Card>
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
        <Suspense fallback={<div className="p-6 text-slate-500 text-sm">加载中...</div>}>
            <InstantAuditInner />
        </Suspense>
    );
}
