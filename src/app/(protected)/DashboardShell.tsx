"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/SidebarNav';

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
    role?: string | null;
    credits?: number;
}

export function DashboardShell({
    children,
    initialSites,
    session,
}: {
    children: React.ReactNode;
    initialSites: Site[];
    session: { user: User };
}) {
    const pathname = usePathname();

    // Determine current site ID from URL
    const siteIdMatch = pathname.match(/\/dashboard\/site-intelligence\/([^/]+)/);
    const currentSiteId = siteIdMatch ? siteIdMatch[1] : undefined;

    return (
        <div className="min-h-screen bg-brand-surface flex flex-col">
            <SidebarNav
                sites={initialSites}
                currentSiteId={currentSiteId}
                user={session.user}
            />
            
            <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
                <main className="flex-1 p-6 md:p-10 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
