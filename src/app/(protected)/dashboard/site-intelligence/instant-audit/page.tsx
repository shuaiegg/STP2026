'use client';

import React, { useState, useCallback, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import GalaxyMap from '@/components/dashboard/site-intelligence/GalaxyMap';
import HealthReport from '@/components/dashboard/site-intelligence/HealthReport';
import Link from 'next/link';
import { authClient } from "@/lib/auth-client";
import { Wallet, Globe, ShieldCheck, ChevronDown, Plus, Trash2, Copy, Check, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

interface Site {
    id: string;
    domain: string;
    name: string | null;
    isCompetitor: boolean;
    latestAudit?: {
        id: string;
        techScore: number | null;
        pageCount: number;
    } | null;
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
    const router = useRouter();
    const { data: session } = authClient.useSession();

    // Site & Data states
    const [sites, setSites] = useState<Site[]>([]);
    const [activeSiteId, setActiveSiteId] = useState<string | null>(searchParams.get('siteId'));
    const [domain, setDomain] = useState('');
    const [loading, setLoading] = useState(false);
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [businessDna, setBusinessDna] = useState<any>(null);
    const [issueReport, setIssueReport] = useState<any>(null);
    const [status, setStatus] = useState('READY_FOR_SCAN');
    const [scanned, setScanned] = useState(0);
    const [total, setTotal] = useState(0);
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

    // Persistence & History
    const [auditHistory, setAuditHistory] = useState<AuditHistoryItem[]>([]);
    const [activeAuditId, setActiveAuditId] = useState<string | null>(searchParams.get('auditId'));
    const [techScore, setTechScore] = useState<number | null>(null);

    // UI States
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [showInlineReport, setShowInlineReport] = useState(false);
    const [insufficientCredits, setInsufficientCredits] = useState(false);
    const [auditCost, setAuditCost] = useState(5);
    const [showAddSiteModal, setShowAddSiteModal] = useState(false);
    const [newSiteDomain, setNewSiteDomain] = useState('');
    const [isAddingSite, setIsAddingSite] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    // Fetch sites and cost on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sitesRes, skillsRes] = await Promise.all([
                    fetch('/api/dashboard/sites'),
                    fetch('/api/skills/list')
                ]);

                const sitesData = await sitesRes.json();
                if (sitesData.sites) {
                    setSites(sitesData.sites);
                    // If no activeSiteId from URL, try to pick the first one or from localStorage
                    if (!activeSiteId && sitesData.sites.length > 0) {
                        const lastId = localStorage.getItem('last_active_site_id');
                        const defaultId = sitesData.sites.find((s: Site) => s.id === lastId)?.id || sitesData.sites[0].id;
                        setActiveSiteId(defaultId);
                        
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('siteId', defaultId);
                        router.replace(`/dashboard/site-intelligence/instant-audit?${params.toString()}`, { scroll: false });
                    }
                }

                const skillsData = await skillsRes.json();
                if (skillsData.success && skillsData.skills) {
                    const auditSkill = skillsData.skills.find((s: any) => s.name === 'SITE_AUDIT_BASIC');
                    if (auditSkill?.cost) setAuditCost(auditSkill.cost);
                }
            } catch (e) {
                console.error("Initialization error:", e);
            }
        };
        fetchData();
    }, []);

    // Load active site details when activeSiteId changes
    useEffect(() => {
        if (!activeSiteId) return;
        const site = sites.find(s => s.id === activeSiteId);
        if (site) {
            setDomain(site.domain);
            localStorage.setItem('last_active_site_id', site.id);
            
            // If no specific auditId in URL, fetch latest audit
            if (!activeAuditId) {
                fetchLatestAudit(site.id);
            } else {
                fetchSpecificAudit(site.id, activeAuditId);
            }
        }
    }, [activeSiteId, sites]);

    const fetchLatestAudit = async (siteId: string) => {
        setLoading(true);
        setStatus('LOADING_LATEST_AUDIT');
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/audits`);
            const data = await res.json();
            const history = data.audits ?? [];
            setAuditHistory(history);
            
            if (history.length > 0) {
                const latest = history[0];
                // Fetch full report for the latest audit
                const auditRes = await fetch(`/api/dashboard/sites/${siteId}/audits/${latest.id}`);
                const auditData = await auditRes.json();
                if (auditData.success && auditData.data.graphData) {
                    setGraphData(auditData.data.graphData);
                    setActiveAuditId(auditData.data.id);
                    setTechScore(auditData.data.techScore);
                    setIssueReport(auditData.data.issueReport);
                    setStatus('GALAXY_CONSTRUCTED');
                } else {
                    setStatus('READY_FOR_SCAN');
                }
            } else {
                setStatus('READY_FOR_SCAN');
                setGraphData({ nodes: [], links: [] });
                setIssueReport(null);
                setTechScore(null);
            }
        } catch (e) {
            console.error("Error loading history:", e);
            setStatus('SYSTEM_ERROR');
        } finally {
            setLoading(false);
        }
    };

    const fetchSpecificAudit = async (siteId: string, auditId: string) => {
        setLoading(true);
        setStatus('LOADING_HISTORY');
        try {
            const auditRes = await fetch(`/api/dashboard/sites/${siteId}/audits/${auditId}`);
            const auditData = await auditRes.json();

            if (auditData.success && auditData.data.graphData) {
                setGraphData(auditData.data.graphData);
                setTechScore(auditData.data.techScore);
                setIssueReport(auditData.data.issueReport);
                setStatus('GALAXY_CONSTRUCTED');
                
                // Refresh history list too
                const historyRes = await fetch(`/api/dashboard/sites/${siteId}/audits`);
                const historyData = await historyRes.json();
                setAuditHistory(historyData.audits ?? []);
            } else {
                setStatus('HISTORY_LOAD_FAILED');
            }
        } catch (e) {
            console.error("Failed to load specific audit:", e);
            setStatus('SYSTEM_ERROR');
        } finally {
            setLoading(false);
        }
    };

    const handleStartAudit = async () => {
        if (!domain || !activeSiteId) return;

        const currentCredits = (session?.user as any)?.credits ?? 0;
        if (currentCredits < auditCost) {
            setInsufficientCredits(true);
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
                            if (event.graphData) setGraphData(event.graphData);
                            setTotal(event.urls?.length || 0);
                            setStatus('SITE_STRUCTURE_DISCOVERED');
                        } else if (event.type === 'dna_extracted') {
                            setBusinessDna(event.dna);
                        } else if (event.type === 'progress') {
                            setScanned(event.scanned);
                            setTotal(event.total);
                        } else if (event.type === 'done') {
                            setGraphData(event.graphData);
                            setTechScore(event.techScore ?? null);
                            setIssueReport(event.issueReport ?? null);
                            setStatus('GALAXY_CONSTRUCTED');
                            setLoading(false);
                            // Auto save for bound sites? Let's stick to manual for now as per previous behavior
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
                setActiveAuditId(data.auditId);
                setJustSaved(true);
                // Refresh history
                if (activeSiteId) fetchLatestAudit(activeSiteId);

                // Update URL
                const params = new URLSearchParams(searchParams.toString());
                params.set('auditId', data.auditId);
                params.set('siteId', activeSiteId!);
                router.replace(`/dashboard/site-intelligence/instant-audit?${params.toString()}`, { scroll: false });

                setTimeout(() => setJustSaved(false), 4000);
            }
 else {
                alert("Failed to save: " + data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Error saving site to dashboard.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSite = async () => {
        if (!newSiteDomain.trim()) return;
        setIsAddingSite(true);
        try {
            const res = await fetch('/api/dashboard/sites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain: newSiteDomain
                })
            });
            const data = await res.json();
            if (data.success) {
                const newSite = data.site;
                setSites(prev => [newSite, ...prev]);
                setActiveSiteId(newSite.id);
                setShowAddSiteModal(false);
                setNewSiteDomain('');
                
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('siteId', newSite.id);
                newUrl.searchParams.delete('auditId');
                router.push(newUrl.pathname + newUrl.search);
            } else {
                alert(data.error || "添加站点失败");
            }
        } catch (e) {
            console.error(e);
            alert("系统错误");
        } finally {
            setIsAddingSite(false);
        }
    };

    const handleDeleteSite = async () => {
        if (!activeSiteId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${activeSiteId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                const remaining = sites.filter(s => s.id !== activeSiteId);
                setSites(remaining);
                setShowDeleteConfirm(false);
                if (remaining.length > 0) {
                    setActiveSiteId(remaining[0].id);
                } else {
                    setActiveSiteId(null);
                    setGraphData({ nodes: [], links: [] });
                    setStatus('READY_FOR_SCAN');
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExportMarkdown = () => {
        if (!graphData.nodes.length || !issueReport) return;

        const criticalCount = issueReport.stats.critical;
        const warningCount = issueReport.stats.warning;
        const infoCount = issueReport.stats.info;
        
        const topNodes = graphData.nodes
            .sort((a, b) => b.val - a.val)
            .slice(0, 10)
            .map(n => `- **${n.name}**: (Weight: ${n.val.toFixed(1)}) ${n.meta?.title ? `\n  - Title: ${n.meta.title}` : ''}`)
            .join('\n');

        const issuesMarkdown = issueReport.issues.length > 0 
            ? issueReport.issues.map((i: any) => 
                `### [${i.code}] ${i.title}\n` +
                `**Severity:** ${i.level || i.severity}\n` +
                `**Explanation:** ${i.explanation}\n` +
                `**How to Fix:** ${i.howToFix}\n` +
                `**Affected Pages (${i.affectedPages?.length || 0}):**\n` +
                (i.affectedPages?.map((p: any) => `- ${p.url} ${p.detail ? `(${p.detail})` : ''}`).join('\n') || '- None')
              ).join('\n\n')
            : 'None detected.';

        const prompt = `You are an expert SEO Strategist. Analyze the following audit data for the domain **${domain}** and provide a strategic action plan.

## Audit Overview
- **Technical Score**: ${techScore ?? 'N/A'}/100
- **Pages Scanned**: ${graphData.nodes.length}
- **Issue Summary**: ${criticalCount} Critical, ${warningCount} Warning, ${infoCount} Info

## Top Content Nodes (by Importance)
${topNodes}

## Detailed Issues & Affected Pages
${issuesMarkdown}

## Strategic Instructions
1. Review the galaxy graph weightings to identify high-value landing pages.
2. Prioritize fixing Critical technical issues that impact crawlability or indexing.
3. Suggest a content expansion plan based on the current cluster density.

---
*Data generated by ScaletoTop STP2026 Site Intelligence Engine*`;

        navigator.clipboard.writeText(prompt).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleHistoryClick = (audit: AuditHistoryItem) => {
        if (!audit.graphData) return;
        
        const params = new URLSearchParams(searchParams.toString());
        params.set('auditId', audit.id);
        params.set('siteId', activeSiteId!);
        router.replace(`/dashboard/site-intelligence/instant-audit?${params.toString()}`, { scroll: false });
        
        setGraphData(audit.graphData);
        setActiveAuditId(audit.id);
        setTechScore(audit.techScore);
        setIssueReport(audit.issueReport);
        setSelectedNode(null);
        setStatus('GALAXY_CONSTRUCTED');
    };

    // Derived states
    const progressPercent = total > 0 ? Math.round((scanned / total) * 100) : 0;
    const mySites = sites.filter(s => !s.isCompetitor);
    const activeSite = sites.find(s => s.id === activeSiteId);
    
    // Tech Score Trend
    const scoreTrend = (auditHistory.length > 1 && techScore !== null && auditHistory[1].techScore !== null) 
        ? techScore - auditHistory[1].techScore 
        : null;

    const renderSiteItem = (site: Site) => (
        <button
            key={site.id}
            onClick={() => { setActiveSiteId(site.id); setIsSelectorOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors mb-1 ${site.id === activeSiteId
                ? 'bg-brand-primary/10 text-brand-primary shadow-sm border border-brand-primary/10'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
        >
            <div className="flex flex-col min-w-0 flex-1 mr-4">
                <span className="text-sm font-bold truncate">{site.domain}</span>
            </div>
            {site.id === activeSiteId && <Check size={14} className="text-brand-primary" />}
        </button>
    );

    return (
        <div className="p-6 space-y-6 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Link
                            href={activeSiteId ? `/dashboard/site-intelligence/${activeSiteId}` : "/dashboard/site-intelligence"}
                            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            返回
                        </Link>
                        <span className="text-slate-300">/</span>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">即时审计</h1>
                        <Badge variant="default" className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border-0">公测版</Badge>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-start md:items-center">
                    {/* Site Selector Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                            className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm w-full md:w-64"
                        >
                            <Globe size={18} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-700 truncate flex-1 text-left">
                                {activeSite?.domain || '请选择站点'}
                            </span>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isSelectorOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isSelectorOpen && (
                            <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">切换审计目标</p>
                                    {activeSite && (
                                        <button 
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                            title="取消绑定此站点"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto p-2">
                                    {mySites.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">我的站点</h3>
                                            {mySites.map(renderSiteItem)}
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 border-t border-slate-100 bg-slate-50/30">
                                    <button
                                        onClick={() => { setShowAddSiteModal(true); setIsSelectorOpen(false); }}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black text-slate-700 bg-white border border-slate-200 hover:border-brand-primary/30 hover:text-brand-primary shadow-sm transition-all"
                                    >
                                        <Plus size={14} /> 添加我的站点
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {activeSite && (
                        <Button
                            onClick={handleStartAudit}
                            disabled={loading}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm px-6 font-bold flex-shrink-0"
                        >
                            {loading ? '扫描中...' : '发起扫描'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
                    <Card className="max-w-md w-full p-8 space-y-6 shadow-2xl border-rose-100 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                            <Trash2 size={32} />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black italic tracking-tight text-slate-900">确认取消绑定站点？</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                此操作将永久删除 **{activeSite?.domain}** 的所有历史审计数据、语义债评分及已规划的资产。此操作不可撤销。
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button 
                                variant="outline" 
                                className="flex-1 font-bold rounded-xl"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                            >
                                取消
                            </Button>
                            <Button 
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-200"
                                onClick={handleDeleteSite}
                                disabled={isDeleting}
                            >
                                {isDeleting ? '删除中...' : '确认删除'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Add Site Modal */}
            {showAddSiteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
                    <Card className="max-w-md w-full p-8 space-y-6 shadow-2xl border-brand-primary/20 animate-in zoom-in-95 duration-200">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-black italic tracking-tight text-slate-900">
                                    添加我的站点
                                </h3>
                                <Badge className="bg-emerald-100 text-emerald-600 border-none font-bold">
                                    OWNED
                                </Badge>
                            </div>
                            <p className="text-sm text-slate-500">输入需要审计的网站域名</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">域名 (Domain)</label>
                                <input
                                    type="text"
                                    placeholder="例如: example.com"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                                    value={newSiteDomain}
                                    onChange={(e) => setNewSiteDomain(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 font-bold rounded-xl"
                                    onClick={() => { setShowAddSiteModal(false); setNewSiteDomain(''); }}
                                    disabled={isAddingSite}
                                >
                                    取消
                                </Button>
                                <Button 
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200"
                                    onClick={handleAddSite}
                                    disabled={isAddingSite}
                                >
                                    {isAddingSite ? '添加中...' : '添加并选择'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Saved notification */}
            {justSaved && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm w-fit animate-in fade-in slide-in-from-left-4">
                    <ShieldCheck size={18} />
                    <span className="font-bold">审计结果已持久化保存至站点历史</span>
                </div>
            )}

            {/* Empty State */}
            {!activeSiteId && !loading && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-700">
                    <div className="w-24 h-24 bg-brand-primary/5 rounded-[2.5rem] flex items-center justify-center text-brand-primary shadow-inner">
                        <Plus size={48} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-2 max-w-sm">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">绑定站点开启专业扫描</h2>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            即时审计现已全面接入站点模型。请先选择一个现有站点，或添加新的审计目标。
                        </p>
                    </div>
                    <div className="flex justify-center w-full max-w-md">
                        <Button 
                            onClick={() => { setShowAddSiteModal(true); }}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-8 rounded-2xl shadow-xl shadow-slate-200 font-black text-sm group"
                        >
                            添加并扫描我的站点 <Plus size={16} className="ml-2 group-hover:rotate-90 transition-transform" />
                        </Button>
                    </div>
                </div>
            )}

            {activeSiteId && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    {graphData.nodes.length === 0 && !loading ? (
                        <Card className="bg-white border-slate-200 shadow-sm flex flex-col items-center justify-center py-24 px-8 text-center min-h-[520px]">
                            <div className="w-20 h-20 rounded-3xl bg-brand-primary/8 flex items-center justify-center mb-6">
                                <Globe size={40} className="text-brand-primary opacity-60" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">准备就绪：{activeSite?.domain}</h2>
                            <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
                                系统已绑定到站点，点击右上角「发起扫描」按钮即可生成最新的主题星图与技术报告。
                            </p>
                            <Button
                                onClick={handleStartAudit}
                                className="bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl shadow-lg shadow-brand-primary/20 px-10 py-6 font-bold flex-shrink-0"
                            >
                                立即开始审计
                            </Button>
                        </Card>
                    ) : (
                        <Card className="bg-white border-slate-200 p-0 overflow-hidden shadow-sm relative group">
                            <GalaxyMap
                                siteId={activeSiteId}
                                data={graphData}
                                isLoading={loading}
                                onNodeClick={setSelectedNode}
                            />
                            {/* HUD Overlays */}
                            {techScore !== null && (
                                <div className="absolute top-6 left-6 pointer-events-none">
                                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-in slide-in-from-left-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">技术健康得分</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-3xl font-black font-display italic ${techScore >= 80 ? 'text-emerald-600' : techScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                    {techScore}
                                                </span>
                                                {scoreTrend !== null && (
                                                    <div className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded-lg ${scoreTrend > 0 ? 'bg-emerald-50 text-emerald-600' : scoreTrend < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                                        {scoreTrend > 0 ? <TrendingUp size={12} className="mr-0.5" /> : scoreTrend < 0 ? <TrendingDown size={12} className="mr-0.5" /> : <Minus size={12} className="mr-0.5" />}
                                                        {Math.abs(scoreTrend)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}
                </div>

                {/* Sidebar HUD */}
                <div className="space-y-4">
                    <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">系统状态</h3>
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${loading ? 'bg-amber-500 animate-pulse' : status === 'GALAXY_CONSTRUCTED' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : status.includes('FAILED') || status.includes('ERROR') ? 'bg-rose-500' : 'bg-slate-300'}`} />
                                <span className="font-mono text-[11px] font-bold text-slate-600 break-all">{status}</span>
                            </div>
                        </div>

                        {loading && total > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-50">
                                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <span>扫描中</span>
                                    <span>{scanned} / {total}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-brand-primary h-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(0,255,136,0.3)]"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Nodes Summary */}
                    {graphData.nodes.length > 0 && (
                        <Card className="bg-brand-primary text-white p-5 shadow-xl shadow-brand-primary/10 border-none">
                            <h3 className="text-[10px] font-black tracking-widest text-white/60 uppercase mb-1">探明页面规模</h3>
                            <div className="flex items-end gap-2">
                                <div className="text-4xl font-black tracking-tight leading-none italic font-display">{graphData.nodes.length}</div>
                                <span className="text-[10px] font-black uppercase tracking-widest mb-1">Nodes</span>
                            </div>
                        </Card>
                    )}

                    {/* Issue Summary */}
                    {issueReport && (
                        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-5 space-y-4">
                                <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">核心检测结论</h3>
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <div className="flex flex-col items-center px-2 py-1.5 bg-rose-50 rounded-xl min-w-[40px] border border-rose-100">
                                            <span className="text-xs font-black text-rose-600">{issueReport.stats.critical}</span>
                                            <span className="text-[8px] font-black text-rose-400 uppercase tracking-tighter">严重</span>
                                        </div>
                                        <div className="flex flex-col items-center px-2 py-1.5 bg-amber-50 rounded-xl min-w-[40px] border border-amber-100">
                                            <span className="text-xs font-black text-amber-600">{issueReport.stats.warning}</span>
                                            <span className="text-[8px] font-black text-amber-400 uppercase tracking-tighter">警告</span>
                                        </div>
                                        <div className="flex flex-col items-center px-2 py-1.5 bg-blue-50 rounded-xl min-w-[40px] border border-blue-100">
                                            <span className="text-xs font-black text-blue-600">{issueReport.stats.info}</span>
                                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">提示</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowInlineReport(v => !v)}
                                        className="text-[11px] font-black text-brand-primary hover:text-brand-primary-hover transition-colors"
                                    >
                                        {showInlineReport ? '收起详情' : '详细报告'}
                                    </button>
                                </div>
                            </div>
                            {showInlineReport && (
                                <div className="border-t border-slate-100 p-4 max-h-[400px] overflow-auto scrollbar-hide">
                                    <HealthReport 
                                        issueReport={issueReport} 
                                        previousIssueReport={auditHistory.length > 1 ? auditHistory[1].issueReport : null}
                                    />
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Audit History List */}
                    {auditHistory.length > 0 && (
                        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
                            <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">站点审计演化史</h3>
                            <div className="space-y-2">
                                {auditHistory.slice(0, 5).map((audit) => (
                                    <button
                                        key={audit.id}
                                        onClick={() => handleHistoryClick(audit)}
                                        disabled={loading}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all border
                                            ${activeAuditId === audit.id
                                                ? 'bg-slate-50 border-slate-200 shadow-inner'
                                                : 'bg-white border-transparent hover:border-slate-100 hover:bg-slate-50/50'}`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{timeAgo(audit.createdAt)}</p>
                                            <p className="text-xs font-black text-slate-700">{audit.pageCount} 页面节点</p>
                                        </div>
                                        {audit.techScore !== null && (
                                            <span className={`ml-2 text-[11px] font-black font-display italic px-2 py-0.5 rounded-lg ${audit.techScore >= 80 ? 'bg-emerald-50 text-emerald-600' :
                                                audit.techScore >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                {audit.techScore}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Node Detail HUD */}
                    {selectedNode && (
                        <Card className="bg-white border-slate-200 p-6 shadow-xl border-brand-primary/10 space-y-5 animate-in slide-in-from-right-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-[10px] font-black tracking-widest text-brand-primary uppercase">节点全量情报</h3>
                                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">页面标题</p>
                                    <p className="text-sm text-slate-900 font-black leading-tight line-clamp-2 italic">{selectedNode.meta?.title || selectedNode.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">权重</p>
                                        <p className="text-sm font-black text-brand-primary italic">{selectedNode.val.toFixed(1)}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">加载耗时</p>
                                        <p className="text-sm font-bold text-slate-700 font-mono italic">{selectedNode.meta?.loadTime || '--'}ms</p>
                                    </div>
                                </div>
                                {selectedNode.meta?.url && (
                                    <a
                                        href={selectedNode.meta.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-2 bg-slate-50 rounded-lg text-[9px] text-slate-500 font-mono break-all hover:text-brand-primary hover:bg-brand-primary/5 transition-all truncate"
                                    >
                                        {selectedNode.meta.url}
                                    </a>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Actions Panel */}
                    <div className="space-y-3 pt-2">
                        {status === 'GALAXY_CONSTRUCTED' && !activeAuditId && (
                            <Button
                                onClick={handleSaveSite}
                                disabled={isSaving || !graphData.nodes.length}
                                className={`w-full font-black tracking-[0.2em] uppercase py-7 rounded-2xl shadow-xl transition-all
                                    ${isSaving ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-200'}`}
                            >
                                {isSaving ? '同步中...' : '💾 持久化同步'}
                            </Button>
                        )}
                        
                        {graphData.nodes.length > 0 && (
                            <Button
                                onClick={handleExportMarkdown}
                                variant="outline"
                                className="w-full border-2 border-slate-100 hover:border-brand-primary/30 hover:bg-brand-primary/5 text-slate-600 text-xs font-black tracking-[0.2em] uppercase py-7 rounded-2xl group flex items-center justify-center gap-2"
                            >
                                {isCopied ? (
                                    <>已复制到剪贴板 <Check size={16} className="text-emerald-500" /></>
                                ) : (
                                    <>导出星图数据 (LLM) <Copy size={16} className="group-hover:scale-110 transition-transform" /></>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}

export default function InstantAuditPage() {
    return (
        <Suspense fallback={<div className="p-10 animate-pulse bg-slate-50 min-h-screen rounded-3xl" />}>
            <InstantAuditInner />
        </Suspense>
    );
}
