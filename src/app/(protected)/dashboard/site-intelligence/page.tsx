import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

interface LatestAudit {
    id: string;
    createdAt: string;
    pageCount: number;
    techScore: number | null;
}

interface SiteRecord {
    id: string;
    domain: string;
    name: string | null;
    createdAt: string;
    latestAudit: LatestAudit | null;
}

function TechScoreBadge({ score }: { score: number | null }) {
    if (score === null) return <span className="text-slate-400 text-xs font-mono">N/A</span>;
    const color =
        score >= 80 ? 'bg-green-100 text-green-700' :
            score >= 50 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700';
    return <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full inline-block ${color}`}>{score}</span>;
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} 分钟前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} 小时前`;
    return `${Math.floor(hrs / 24)} 天前`;
}

export default async function SiteIntelligencePage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
        redirect('/login');
    }

    const sitesData = await prisma.site.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            domain: true,
            name: true,
            createdAt: true,
            audits: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                    id: true,
                    createdAt: true,
                    techScore: true,
                    pageCount: true,
                },
            },
        },
    });

    const sites: SiteRecord[] = sitesData.map((site) => {
        const latest = site.audits[0] ?? null;
        return {
            id: site.id,
            domain: site.domain,
            name: site.name,
            createdAt: site.createdAt.toISOString(),
            latestAudit: latest
                ? {
                    id: latest.id,
                    createdAt: latest.createdAt.toISOString(),
                    pageCount: latest.pageCount ?? 0,
                    techScore: latest.techScore,
                }
                : null,
        };
    });

    if (sites.length === 1) {
        redirect(`/dashboard/site-intelligence/${sites[0].id}`);
    }

    return (
        <div className="p-6 space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">站点智能管家</h1>
                        <Badge variant="default" className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border-0">公测版</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                        监控您的网站 · 追踪 SEO 进展 · 测绘内容权威度星图
                    </p>
                </div>
                <Link href="/dashboard/site-intelligence/instant-audit">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm px-6 font-bold">
                        + 新建扫描
                    </Button>
                </Link>
            </div>

            {/* Body */}
            {sites.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sites.map((site) => (
                        <SiteCard key={site.id} site={site} />
                    ))}
                </div>
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <Card className="bg-white border-slate-200 shadow-sm p-12 flex flex-col items-center text-center gap-4 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-3xl">
                🛰
            </div>
            <div className="space-y-1">
                <h2 className="text-slate-900 font-semibold text-lg">暂无扫描记录</h2>
                <p className="text-slate-500 text-sm">
                    运行首次即时审计以开始构建您的主题权威星图。
                </p>
            </div>
            <Link href="/dashboard/site-intelligence/instant-audit">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm px-6 font-bold mt-4">
                    发起首次扫描
                </Button>
            </Link>
        </Card>
    );
}

function SiteCard({ site }: { site: SiteRecord }) {
    const audit = site.latestAudit;
    return (
        <Card className="bg-white border-slate-200 shadow-sm p-6 flex flex-col gap-5 hover:border-brand-primary/20 hover:shadow-md transition-all rounded-2xl group relative overflow-hidden">
            {/* Top decorative gradient line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Domain Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-slate-900 truncate tracking-tight">{site.domain}</p>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">
                        添加于 {timeAgo(site.createdAt)}
                    </p>
                </div>
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-100 mt-1">
                    <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: audit ? '#10b981' : '#cbd5e1' }}
                    />
                </div>
            </div>

            {/* Stats Overview */}
            {audit ? (
                <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">页面数</p>
                        <p className="text-sm font-bold text-slate-700 font-mono">{audit.pageCount}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center border-l border-slate-200">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">技术得分</p>
                        <TechScoreBadge score={audit.techScore} />
                    </div>
                    <div className="flex flex-col items-center justify-center border-l border-slate-200">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-bold">最新扫描</p>
                        <p className="text-[10px] text-slate-500 font-mono font-medium">{timeAgo(audit.createdAt).replace('前', '')}</p>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 border-dashed flex items-center justify-center h-[76px]">
                    <p className="text-[11px] text-slate-400 font-medium">暂无审计数据</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-auto pt-2">
                <Link
                    href={`/dashboard/site-intelligence/${site.id}`}
                    className="flex-1"
                >
                    <Button
                        variant="outline"
                        className="w-full text-xs font-semibold rounded-xl border-slate-200 hover:bg-slate-50 hover:text-brand-primary"
                    >
                        控制台
                    </Button>
                </Link>
                <Link
                    href={`/dashboard/site-intelligence/instant-audit?site=${encodeURIComponent(site.domain)}&rescan=1`}
                    className="flex-1"
                >
                    <Button
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-none"
                    >
                        重新扫描
                    </Button>
                </Link>
            </div>
        </Card>
    );
}
