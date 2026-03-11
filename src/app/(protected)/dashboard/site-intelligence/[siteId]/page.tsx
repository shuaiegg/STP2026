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
}

import { CompetitorsPanel } from './components/CompetitorsPanel';
import { OverviewPanel } from './components/OverviewPanel';
import { AuditHistoryPanel } from './components/AuditHistoryPanel';
import { PerformanceDashboard } from './components/PerformanceDashboard';

export default function SiteDetailsPage({ params }: { params: Promise<{ siteId: string }> }) {
    const { siteId } = use(params);
    const router = useRouter();
    const [site, setSite] = useState<SiteRecord | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'audits' | 'competitors' | 'performance'>('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch specific site info later, for now we just need basic info or we can fetch the list and find it
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
                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard/site-intelligence"
                            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium pr-2 border-r border-slate-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            返回
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{site.domain}</h1>
                        <Badge variant="default" className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border-0">管理中</Badge>
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
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    概览
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
            </div>

            {/* Tab Content */}
            <div className="pt-4">
                {activeTab === 'overview' && (
                    <OverviewPanel siteId={site.id} domain={site.domain} />
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
            </div>
        </div>
    );
}
