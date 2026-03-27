"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { TopNav } from '@/components/dashboard/TopNav';

interface Site {
    id: string;
    domain: string;
    latestHealthScore: number | null;
}

interface User {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role?: string;
    credits?: number;
}

export function DashboardShell({
    children,
    initialSites,
    session,
}: {
    children: React.ReactNode;
    initialSites: Site[];
    session: { user: User } | null;
}) {
    const pathname = usePathname();

    // Determine current site ID from URL
    const siteIdMatch = pathname.match(/\/dashboard\/site-intelligence\/([^/]+)/);
    const currentSiteId = siteIdMatch ? siteIdMatch[1] : undefined;

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <TopNav 
                sites={initialSites} 
                currentSiteId={currentSiteId} 
                user={session?.user} 
            />
            
            <main className="flex-1 p-6 md:p-10 overflow-auto">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
