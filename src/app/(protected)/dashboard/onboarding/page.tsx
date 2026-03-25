import React from 'react';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from 'next/navigation';
import { OnboardingClient } from './OnboardingClient';

export default async function OnboardingPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/login');
    }

    // Check if user already has sites
    const siteCount = await prisma.site.count({
        where: { userId: session.user.id, isCompetitor: false }
    });

    if (siteCount > 0) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl w-full">
                <OnboardingClient />
            </div>
        </div>
    );
}
