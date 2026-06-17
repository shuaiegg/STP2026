'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import {
  StrategyBoardSkeleton,
  OverviewPanelSkeleton,
  CompetitorsPanelSkeleton,
  PerformancePanelSkeleton,
  AuditHistoryPanelSkeleton,
  IntegrationsPanelSkeleton,
} from '@/components/ui/panel-skeleton';
import HealthReport from '@/components/dashboard/site-intelligence/HealthReport';
import { useTranslations } from 'next-intl';

// ─── Dynamic Imports ──────────────────────────────────────────────────────────

const StrategyBoard = dynamic(
  () => import('./components/StrategyBoard').then((mod) => mod.StrategyBoard),
  { loading: () => <StrategyBoardSkeleton />, ssr: false },
);
const OverviewPanel = dynamic(
  () => import('./components/OverviewPanel').then((mod) => mod.OverviewPanel),
  { loading: () => <OverviewPanelSkeleton />, ssr: false },
);
const CompetitorsPanel = dynamic(
  () => import('./components/CompetitorsPanel').then((mod) => mod.CompetitorsPanel),
  { loading: () => <CompetitorsPanelSkeleton />, ssr: false },
);
const PerformanceDashboard = dynamic(
  () => import('./components/PerformanceDashboard').then((mod) => mod.PerformanceDashboard),
  { loading: () => <PerformancePanelSkeleton />, ssr: false },
);
const Ga4PerformanceDashboard = dynamic(
  () => import('./components/Ga4PerformanceDashboard').then((mod) => mod.Ga4PerformanceDashboard),
  { loading: () => <PerformancePanelSkeleton />, ssr: false },
);
const AuditHistoryPanel = dynamic(
  () => import('./components/AuditHistoryPanel').then((mod) => mod.AuditHistoryPanel),
  { loading: () => <AuditHistoryPanelSkeleton />, ssr: false },
);
const IntegrationsPanel = dynamic(
  () => import('./components/IntegrationsPanel').then((mod) => mod.IntegrationsPanel),
  { loading: () => <IntegrationsPanelSkeleton />, ssr: false },
);

// ─── Types & constants ────────────────────────────────────────────────────────

type TabType =
  | 'strategy'
  | 'overview'
  | 'audit'
  | 'audits'
  | 'competitors'
  | 'performance'
  | 'traffic'
  | 'integrations';

const VALID_TABS: TabType[] = [
  'strategy', 'overview', 'audit', 'audits',
  'competitors', 'performance', 'traffic', 'integrations',
];

// ─── TabContainer ─────────────────────────────────────────────────────────────

export function TabContainer({ 
  siteId, 
  domain,
  hasGsc,
  hasGa4,
  hasContentPlan
}: { 
  siteId: string; 
  domain: string;
  hasGsc?: boolean;
  hasGa4?: boolean;
  hasContentPlan?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('dashboard.siteDetail');
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [visitedTabs, setVisitedTabs] = useState<Set<TabType>>(new Set(['overview']));
  const [issueReportLoaded, setIssueReportLoaded] = useState(false);
  const [latestIssueReport, setLatestIssueReport] = useState<any>(null);
  const [previousIssueReport, setPreviousIssueReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Sync active tab from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as TabType;
    if (hash && VALID_TABS.includes(hash)) {
      setActiveTab(hash);
      setVisitedTabs(prev => new Set([...prev, hash]));
      if (hash === 'audit') fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReport = async () => {
    if (issueReportLoaded || loadingReport) return;
    setLoadingReport(true);
    setFetchError(false);
    try {
      const res = await fetch(`/api/dashboard/sites/${siteId}/audits`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.audits && data.audits.length > 0) {
        setLatestIssueReport(data.audits[0].issueReport ?? null);
        if (data.audits.length > 1) {
          setPreviousIssueReport(data.audits[1].issueReport ?? null);
        }
      }
      setIssueReportLoaded(true);
    } catch (e) {
      console.error(e);
      setFetchError(true);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setVisitedTabs(prev => new Set([...prev, tab]));
    router.replace(pathname + '#' + tab, { scroll: false });
    if (tab === 'audit') fetchReport();
  };

  const tabCls = (key: TabType) =>
    `px-4 py-3 text-sm border-b-2 transition-all whitespace-nowrap ` +
    `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-inset ` +
    (activeTab === key
      ? 'border-brand-secondary text-brand-text-primary font-bold'
      : 'border-transparent text-brand-text-secondary font-medium hover:text-brand-text-primary hover:border-brand-border');

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div
        role="tablist"
        aria-label={t('ariaLabel')}
        className="flex border-b border-brand-border overflow-x-auto scrollbar-hide sticky top-14 bg-white/80 backdrop-blur-md z-30 -mx-6 md:-mx-10 px-6 md:px-10"
      >
        <button role="tab" id="tab-overview" aria-selected={activeTab === 'overview'} aria-controls="tabpanel-overview"
          onClick={() => handleTabChange('overview')} className={tabCls('overview')}>
          {t('tabs.overview')}
        </button>

        <button role="tab" id="tab-strategy" aria-selected={activeTab === 'strategy'} aria-controls="tabpanel-strategy"
          onClick={() => handleTabChange('strategy')}
          className={`${tabCls('strategy')} flex items-center gap-1.5`}>
          {t('tabs.strategy')}
        </button>

        <button role="tab" id="tab-competitors" aria-selected={activeTab === 'competitors'} aria-controls="tabpanel-competitors"
          onClick={() => handleTabChange('competitors')} className={tabCls('competitors')}>
          {t('tabs.competitors')}
        </button>

        <button role="tab" id="tab-performance" aria-selected={activeTab === 'performance'} aria-controls="tabpanel-performance"
          onClick={() => handleTabChange('performance')} className={tabCls('performance')}>
          {t('tabs.performance')}
        </button>

        <button role="tab" id="tab-traffic" aria-selected={activeTab === 'traffic'} aria-controls="tabpanel-traffic"
          onClick={() => handleTabChange('traffic')} className={tabCls('traffic')}>
          {t('tabs.traffic')}
        </button>

        <button role="tab" id="tab-audit" aria-selected={activeTab === 'audit'} aria-controls="tabpanel-audit"
          onClick={() => handleTabChange('audit')} className={tabCls('audit')}>
          {t('tabs.audit')}
        </button>

        <button role="tab" id="tab-audits" aria-selected={activeTab === 'audits'} aria-controls="tabpanel-audits"
          onClick={() => handleTabChange('audits')} className={tabCls('audits')}>
          {t('tabs.audits')}
        </button>

        <div className="flex-1" aria-hidden="true" />

        <button role="tab" id="tab-integrations" aria-selected={activeTab === 'integrations'} aria-controls="tabpanel-integrations"
          onClick={() => handleTabChange('integrations')} className={tabCls('integrations')}>
          {t('tabs.settings')}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="animate-in fade-in duration-500">
        <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview" hidden={activeTab !== 'overview'}>
          <Suspense fallback={<OverviewPanelSkeleton />}>
            {visitedTabs.has('overview') && (
              <OverviewPanel
                siteId={siteId}
                domain={domain}
                hasGsc={!!hasGsc}
                hasGa4={!!hasGa4}
                hasContentPlan={!!hasContentPlan}
                onSwitchTab={(tab) => handleTabChange(tab as TabType)}
              />
            )}
          </Suspense>
        </div>

        <div role="tabpanel" id="tabpanel-strategy" aria-labelledby="tab-strategy" hidden={activeTab !== 'strategy'}>
          <Suspense fallback={<StrategyBoardSkeleton />}>
            {visitedTabs.has('strategy') && <StrategyBoard siteId={siteId} />}
          </Suspense>
        </div>

        <div role="tabpanel" id="tabpanel-audit" aria-labelledby="tab-audit" hidden={activeTab !== 'audit'}>
          <Suspense fallback={<AuditHistoryPanelSkeleton />}>
            {visitedTabs.has('audit') && (
              <div className="space-y-6">
                {loadingReport ? (
                  <div className="flex flex-col items-center justify-center p-12 text-brand-text-secondary">
                    <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent motion-safe:animate-spin mb-4" aria-hidden="true" />
                    <p className="text-sm font-medium">{t('loadingReport')}</p>
                  </div>
                ) : fetchError ? (
                  <div role="alert" className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <p className="text-sm font-bold text-brand-text-primary">{t('fetchErrorTitle')}</p>
                    <p className="text-sm text-brand-text-secondary">{t('fetchErrorDesc')}</p>
                    <button
                      onClick={() => { setIssueReportLoaded(false); fetchReport(); }}
                      className="px-4 py-2 text-sm font-bold bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
                    >
                      {t('retry')}
                    </button>
                  </div>
                ) : (
                  <HealthReport issueReport={latestIssueReport} previousIssueReport={previousIssueReport} />
                )}
              </div>
            )}
          </Suspense>
        </div>

        <div role="tabpanel" id="tabpanel-audits" aria-labelledby="tab-audits" hidden={activeTab !== 'audits'}>
          <Suspense fallback={<AuditHistoryPanelSkeleton />}>
            {visitedTabs.has('audits') && <AuditHistoryPanel siteId={siteId} domain={domain} />}
          </Suspense>
        </div>

        <div role="tabpanel" id="tabpanel-competitors" aria-labelledby="tab-competitors" hidden={activeTab !== 'competitors'}>
          <Suspense fallback={<CompetitorsPanelSkeleton />}>
            {visitedTabs.has('competitors') && <CompetitorsPanel siteId={siteId} />}
          </Suspense>
        </div>

        <div role="tabpanel" id="tabpanel-performance" aria-labelledby="tab-performance" hidden={activeTab !== 'performance'}>
          <Suspense fallback={<PerformancePanelSkeleton />}>
            {visitedTabs.has('performance') && <PerformanceDashboard siteId={siteId} />}
          </Suspense>
        </div>

        <div role="tabpanel" id="tabpanel-traffic" aria-labelledby="tab-traffic" hidden={activeTab !== 'traffic'}>
          <Suspense fallback={<PerformancePanelSkeleton />}>
            {visitedTabs.has('traffic') && <Ga4PerformanceDashboard siteId={siteId} />}
          </Suspense>
        </div>

        <div role="tabpanel" id="tabpanel-integrations" aria-labelledby="tab-integrations" hidden={activeTab !== 'integrations'}>
          <Suspense fallback={<IntegrationsPanelSkeleton />}>
            {visitedTabs.has('integrations') && <IntegrationsPanel siteId={siteId} onUpdate={() => {}} />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
