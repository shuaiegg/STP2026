'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SiteRecord {
    id: string;
    domain: string;
    name: string | null;
    createdAt: string;
    latestAudit?: {
        techScore: number | null;
        pageCount: number;
    } | null;
}

import { CompetitorsPanel } from './components/CompetitorsPanel';
import { OverviewPanel } from './components/OverviewPanel';
import { IntegrationsPanel } from './components/IntegrationsPanel';
import { AuditHistoryPanel } from './components/AuditHistoryPanel';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { Ga4PerformanceDashboard } from './components/Ga4PerformanceDashboard';
import { SiteSwitcher } from './components/SiteSwitcher';
import { StrategyBoard } from './components/StrategyBoard';
import HealthReport from '@/components/dashboard/site-intelligence/HealthReport';

export default function SiteDetailsPage({ params }: { params: Promise<{ siteId: string }> }) {
    const { siteId } = use(params);
    const router = useRouter();
    const [site, setSite] = useState<SiteRecord | null>(null);
    const [activeTab, setActiveTab] = useState<'strategy' | 'overview' | 'audit' | 'audits' | 'competitors' | 'performance' | 'traffic' | 'integrations'>('strategy');
    const [loading, setLoading] = useState(true);
    const [latestIssueReport, setLatestIssueReport] = useState<any>(null);
    const [previousIssueReport, setPreviousIssueReport] = useState<any>(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [issueReportLoaded, setIssueReportLoaded] = useState(false);

    useEffect(() => {
        // Fetch specific site info
        fetch('/api/dashboard/sites')
            .then(r => r.json())
            .then(data => {
                const found = data.sites?.find((s: SiteRecord) => s.id === siteId);
                if (found) {
                    setSite(found);
                } else {
                    router.push('/dashboard/site-intelligence');
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [siteId, router]);

    // Fetch latest audit report when audit tab is selected
    useEffect(() => {
        if (activeTab === 'audit' && site && !issueReportLoaded) {
            setLoadingReport(true);
            fetch(`/api/dashboard/sites/${site.id}/audits`)
                .then(r => r.json())
                .then(data => {
                    if (data.audits && data.audits.length > 0) {
                        setLatestIssueReport(data.audits[0].issueReport ?? null);
                        if (data.audits.length > 1) {
                            setPreviousIssueReport(data.audits[1].issueReport ?? null);
                        }
                    }
                })
                .catch(console.error)
                .finally(() => {
                    setLoadingReport(false);
                    setIssueReportLoaded(true);
                });
        }
    }, [activeTab, site, issueReportLoaded]);

    if (loading) {
        return <div className="p-6">加载中...</div>;
    }

    if (!site) {
        return <div className="p-6">站点不存在</div>;
    }

    return (
        <div className="p-6 space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-4">
                        <SiteSwitcher currentSiteId={site.id} currentDomain={site.domain} />

                        {site.latestAudit && (
                            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">技术得分</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${(site.latestAudit.techScore || 0) >= 80 ? 'bg-emerald-500' :
                                            (site.latestAudit.techScore || 0) >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                            }`} />
                                        <span className={`text-sm font-bold font-mono ${(site.latestAudit.techScore || 0) >= 80 ? 'text-emerald-600' :
                                            (site.latestAudit.techScore || 0) >= 50 ? 'text-amber-600' : 'text-rose-600'
                                            }`}>
                                            {site.latestAudit.techScore ?? '--'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">页面总数</span>
                                    <span className="text-sm font-bold text-slate-700 font-mono italic">
                                        {site.latestAudit.pageCount}<span className="text-[10px] ml-0.5 opacity-50 font-sans">P</span>
                                    </span>
                                </div>
                            </div>
                        )}

                        <Badge variant="default" className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border-0 ml-1">管理中</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                        查看站点的表现、审计历史及监控竞争对手
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/dashboard/site-intelligence/instant-audit?site=${encodeURIComponent(site.domain)}`}>
                        <Button variant="outline" className="rounded-xl font-bold">查看最新星图</Button>
                    </Link>
                    <Link href={`/dashboard/site-intelligence/instant-audit?site=${encodeURIComponent(site.domain)}&rescan=1`}>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm px-6 font-bold">
                            重新扫描
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('strategy')}
                    className={`px-4 py-3 text-sm font-black border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'strategy' ? 'border-brand-primary text-brand-primary tracking-wide' : 'border-transparent text-slate-500 hover:text-brand-primary/80 hover:border-brand-primary/30'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                    战略枢纽
                </button>
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    体检概览
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-4 py-3 text-sm font-black border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'audit' ? 'border-brand-primary text-brand-primary tracking-wide' : 'border-transparent text-slate-500 hover:text-brand-primary/80 hover:border-brand-primary/30'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                    体检报告
                </button>
                <button
                    onClick={() => setActiveTab('audits')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'audits' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    审计历史
                </button>
                <button
                    onClick={() => setActiveTab('competitors')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'competitors' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    竞争对手追踪
                </button>
                <button
                    onClick={() => setActiveTab('performance')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'performance' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    搜索表现
                </button>
                <button
                    onClick={() => setActiveTab('traffic')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'traffic' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
                    流量表现
                </button>
                <div className="flex-1" />
                <button
                    onClick={() => setActiveTab('integrations')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'integrations' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                    接入与设置
                </button>
            </div>

            {/* Tab Content */}
            <div className="pt-4">
                {activeTab === 'strategy' && (
                    <StrategyBoard siteId={site.id} />
                )}

                {activeTab === 'overview' && (
                    <OverviewPanel siteId={site.id} domain={site.domain} onSwitchTab={(tab) => setActiveTab(tab as any)} />
                )}

                {activeTab === 'audit' && (
                    <div className="space-y-6">
                        {loadingReport ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-500 animate-pulse">
                                <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin mb-4" />
                                <p className="text-sm font-medium">生成健康报告中...</p>
                            </div>
                        ) : (
                            <HealthReport issueReport={latestIssueReport} previousIssueReport={previousIssueReport} />
                        )}
                    </div>
                )}

                {activeTab === 'audits' && (
                    <AuditHistoryPanel siteId={site.id} domain={site.domain} />
                )}

                {activeTab === 'competitors' && (
                    <CompetitorsPanel siteId={site.id} />
                )}

                {activeTab === 'performance' && (
                    <PerformanceDashboard siteId={site.id} />
                )}

                {activeTab === 'traffic' && (
                    <Ga4PerformanceDashboard siteId={site.id} />
                )}

                {activeTab === 'integrations' && (
                    <IntegrationsPanel siteId={site.id} onUpdate={() => { }} />
                )}
            </div>
        </div>
    );
}
