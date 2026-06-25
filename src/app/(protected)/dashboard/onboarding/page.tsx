import React from 'react';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from 'next/navigation';
import { OnboardingClient } from './OnboardingClient';
import { daysSinceSignup } from '@/lib/analytics/events';

export default async function OnboardingPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/login');
    }

    const [siteCount, user] = await Promise.all([
        prisma.site.count({ where: { userId: session.user.id, isCompetitor: false } }),
        prisma.user.findUnique({ where: { id: session.user.id }, select: { createdAt: true } }),
    ]);

    if (siteCount > 0) {
        redirect('/dashboard');
    }

    const daysSince = user ? daysSinceSignup(user) : 0;

    return (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl w-full">
                <OnboardingClient daysSinceSignup={daysSince} />
            </div>
        </div>
    );
}
