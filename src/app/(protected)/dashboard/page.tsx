import React from 'react';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { DashboardContent } from './DashboardContent';

async function getUserData(userId: string) {
    const [user, sites, articleCount, recentArticles] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true, name: true, email: true }
        }),
        prisma.site.findMany({
            where: { userId },
            select: { 
                id: true, 
                domain: true, 
                name: true, 
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
        })
    ]);

    // Calculate aggregate metrics
    // Note: totalSemanticDebts and totalStrengths are now 0 as we excluded businessOntology for performance.
    // In a future update, these could be moved to separate count fields or a dedicated summary table.
    const totalSemanticDebts = 0;
    const totalStrengths = 0;

    const metrics = {
        totalSites: sites.length,
        totalSemanticDebts,
        totalStrengths,
        sitesOptions: sites.map(s => ({
            id: s.id,
            domain: s.domain,
            hasGsc: s._count.gscConnections > 0,
            hasGa4: s._count.ga4Connections > 0
        }))
    };

    return { user, metrics, articleCount, recentArticles };
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

    const { user, metrics, articleCount, recentArticles } = await getUserData(targetUserId);

    return (
        <DashboardContent
            user={user}
            metrics={metrics}
            isImpersonating={isActuallyImpersonating}
            articleCount={articleCount}
            recentArticles={recentArticles}
        />
    );
}
