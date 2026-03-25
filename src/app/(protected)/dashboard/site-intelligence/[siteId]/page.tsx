import React from 'react';
import type { Metadata } from 'next';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from 'next/navigation';
import { getSiteById } from '@/lib/site-intelligence/sites';
import { TabContainer } from './TabContainer';
import { SiteHeader } from '@/components/dashboard/SiteHeader';
import { NextStepsBanner } from '@/components/dashboard/NextStepsBanner';

export async function generateMetadata({ params }: { params: Promise<{ siteId: string }> }): Promise<Metadata> {
    const { siteId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { title: '站点分析' };
    const site = await getSiteById(siteId, session.user.id);
    return {
        title: site ? `${site.domain} — 站点分析` : '站点分析',
        robots: { index: false },
    };
}

export default async function SiteDetailsPage({ 
    params,
    searchParams
}: { 
    params: Promise<{ siteId: string }>,
    searchParams: Promise<{ onboarded?: string }>
}) {
    const { siteId } = await params;
    const { onboarded } = await searchParams;
    
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/login');
    }

    const site = await getSiteById(siteId, session.user.id);

    if (!site) {
        redirect('/dashboard/site-intelligence');
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Onboarding Banner */}
            {onboarded === '1' && (
                <NextStepsBanner 
                    siteId={site.id} 
                    hasGsc={site.hasGsc} 
                    hasGa4={site.hasGa4} 
                    hasCompetitors={site.hasCompetitors} 
                />
            )}

            {/* Site Header */}
            <SiteHeader site={site} />

            {/* Main Tabs */}
            <TabContainer 
                siteId={site.id} 
                domain={site.domain} 
                hasGsc={site.hasGsc}
                hasGa4={site.hasGa4}
                hasContentPlan={site.hasContentPlan}
            />
        </div>
    );
}
