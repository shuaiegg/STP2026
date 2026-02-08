import React from 'react';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { DashboardContent } from './DashboardContent';

async function getUserData(userId: string) {
    const [user, transactions, executions, articleCount, recentArticles] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true, name: true, email: true }
        }),
        prisma.creditTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5
        }),
        prisma.skillExecution.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5
        }),
        prisma.trackedArticle.count({
            where: { userId }
        }),
        prisma.trackedArticle.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 3
        })
    ]);

    return { user, transactions, executions, articleCount, recentArticles };
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

    const { user, transactions, executions, articleCount, recentArticles } = await getUserData(targetUserId);

    return (
        <DashboardContent 
            user={user} 
            transactions={transactions} 
            executions={executions} 
            isImpersonating={isActuallyImpersonating}
            articleCount={articleCount}
            recentArticles={recentArticles}
        />
    );
}
