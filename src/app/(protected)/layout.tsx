import React from 'react';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from 'next/navigation';
import { DashboardShell } from './DashboardShell';
import { getInitialSites } from '@/lib/site-intelligence/sites';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/login');
    }

    const initialSites = await getInitialSites(session.user.id);

    return (
        <DashboardShell initialSites={initialSites} session={session}>
            {children}
        </DashboardShell>
    );
}
