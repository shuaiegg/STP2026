import React from 'react';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { DashboardContent } from './DashboardContent';

async function getUserData(userId: string) {
    const [user, transactions, executions] = await Promise.all([
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
        })
    ]);

    return { user, transactions, executions };
}

export default async function UserDashboard() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/login');
    }

    const { user, transactions, executions } = await getUserData(session.user.id);

    return (
        <DashboardContent 
            user={user} 
            transactions={transactions} 
            executions={executions} 
        />
    );
}
