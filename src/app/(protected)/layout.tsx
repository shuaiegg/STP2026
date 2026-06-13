import React from 'react';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from 'next/navigation';
import { DashboardShell } from './DashboardShell';
import { getInitialSites } from '@/lib/site-intelligence/sites';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/login');
    }

    const initialSites = await getInitialSites(session.user.id);
    const messages = await getMessages();
    const locale = session.user.locale || 'en';

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <DashboardShell initialSites={initialSites} session={session}>
                {children}
            </DashboardShell>
        </NextIntlClientProvider>
    );
}
