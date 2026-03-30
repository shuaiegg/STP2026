import React from 'react';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { SiteSelector } from './SiteSelector';
import { unstable_cache } from 'next/cache';

async function getUserData(userId: string) {
    return unstable_cache(
        async () => {
            const [user, sitesWithAudits, articleCount, recentArticles, highPriorityDebts, totalPlannedArticles, perSiteMinCoverage, auditCount] = await Promise.all([
                prisma.user.findUnique({
                    where: { id: userId },
                    select: { credits: true, name: true, email: true }
                }),
                prisma.site.findMany({
                    where: { userId, isCompetitor: false },
                    select: { 
                        id: true, 
                        domain: true, 
                        name: true, 
                        audits: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            select: {
                                techScore: true,
                                contentScore: true,
                                geoScore: true,
                                createdAt: true,
                            }
                        },
                        _count: { 
                            select: { 
                                gscConnections: true, 
                                ga4Connections: true 
                            } 
                        } 
                    }
                }),
                prisma.trackedArticle.count({
                    where: { userId }
                }),
                prisma.trackedArticle.findMany({
                    where: { userId },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        createdAt: true,
                        citationSource: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 3
                }),
                prisma.semanticDebt.count({
                    where: { 
                        site: { userId, isCompetitor: false }, 
                        priorityLabel: { contains: '高搜索' } 
                    }
                }),
                prisma.plannedArticle.count({
                    where: { 
                        contentPlan: { 
                            site: { userId, isCompetitor: false } 
                        } 
                    }
                }),
                prisma.semanticDebt.findMany({
                    where: { 
                        site: { userId, isCompetitor: false } 
                    },
                    orderBy: [
                        { siteId: 'asc' },
                        { coverageScore: 'asc' }
                    ],
                    distinct: ['siteId'],
                    select: { topic: true, coverageScore: true, siteId: true }
                }),
                prisma.siteAudit.count({ 
                    where: { 
                        site: { userId, isCompetitor: false } 
                    } 
                })
            ]);

            const sites = (sitesWithAudits || []).map(s => ({
                id: s.id,
                domain: s.domain,
                name: s.name,
                latestHealthScore: s.audits[0] 
                    ? Math.round(((s.audits[0].techScore || 0) + (s.audits[0].contentScore || 0) + (s.audits[0].geoScore || 0)) / 3)
                    : null,
                lastAuditAt: s.audits[0]?.createdAt || null,
                hasGsc: s._count.gscConnections > 0,
                hasGa4: s._count.ga4Connections > 0,
            }));

            const metrics = {
                totalSites: sites.length,
                totalHighPriorityDebts: highPriorityDebts,
                totalPlannedArticles,
                sitesOptions: sites.map(s => {
                    const minCoverageDebt = perSiteMinCoverage.find(d => d.siteId === s.id);
                    return {
                        id: s.id,
                        domain: s.domain,
                        hasGsc: s.hasGsc,
                        hasGa4: s.hasGa4,
                        topDebt: minCoverageDebt?.topic || null,
                        minCoverage: minCoverageDebt?.coverageScore ?? null
                    };
                })
            };

            return { user, metrics, articleCount, recentArticles, auditCount, sites };
        },
        ["user-dashboard-data", userId],
        {
            revalidate: 30,
            tags: ["user-cache", `user-${userId}`]
        }
    )();
}

export default async function UserDashboard({
    searchParams
}: {
    searchParams: Promise<{ impersonate?: string }>
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/login');
    }

    const { impersonate } = await searchParams;
    const isAdmin = (session.user as any).role === 'ADMIN';

    // Don't treat as impersonation if the target is the admin themselves
    const isActuallyImpersonating = !!(isAdmin && impersonate && impersonate !== session.user.id);
    const targetUserId = isActuallyImpersonating ? (impersonate as string) : session.user.id;

    const { user, metrics, articleCount, recentArticles, auditCount, sites } = await getUserData(targetUserId);

    // Smart Routing Logic (Task 4.3)
    if (metrics.totalSites === 0) {
        redirect('/dashboard/onboarding');
    }

    if (metrics.totalSites === 1) {
        redirect(`/dashboard/site-intelligence/${sites[0].id}`);
    }

    // If more than 1 site, show Site Selector
    return (
        <SiteSelector sites={sites} />
    );
}
