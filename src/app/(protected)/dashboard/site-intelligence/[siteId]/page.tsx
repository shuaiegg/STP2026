import React from 'react';
import type { Metadata } from 'next';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from 'next/navigation';
import { getSiteById } from '@/lib/site-intelligence/sites';
import { TabContainer } from './TabContainer';
import { SiteSwitcher } from './components/SiteSwitcher';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ siteId: string }> }): Promise<Metadata> {
    const { siteId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { title: '站点分析' };
    const site = await getSiteById(siteId, session.user.id);
    return {
        title: site ? `${site.domain} — 站点分析` : '站点分析',
        robots: { index: false },
    };
}

export default async function SiteDetailsPage({ params }: { params: Promise<{ siteId: string }> }) {
    const { siteId } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/login');
    }

    const site = await getSiteById(siteId, session.user.id);

    if (!site) {
        redirect('/dashboard/site-intelligence');
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
                                        <div aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${(site.latestAudit.techScore || 0) >= 80 ? 'bg-emerald-500' :
                                            (site.latestAudit.techScore || 0) >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                            }`} />
                                        <span className={`text-sm font-bold font-mono ${(site.latestAudit.techScore || 0) >= 80 ? 'text-emerald-600' :
                                            (site.latestAudit.techScore || 0) >= 50 ? 'text-amber-600' : 'text-rose-600'
                                            }`}>
                                            {site.latestAudit.techScore ?? '--'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {(site.latestAudit.techScore || 0) >= 80 ? '优' : (site.latestAudit.techScore || 0) >= 50 ? '中' : '差'}
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
                    <Link href={`/dashboard/site-intelligence/instant-audit?siteId=${site.id}`}>
                        <Button variant="outline" className="rounded-xl font-bold">查看最新星图</Button>
                    </Link>
                    <Link href={`/dashboard/site-intelligence/instant-audit?siteId=${site.id}&rescan=1`}>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm px-6 font-bold">
                            重新扫描
                        </Button>
                    </Link>
                </div>
            </div>

            <TabContainer siteId={site.id} domain={site.domain} />
        </div>
    );
}
