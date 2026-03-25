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
const HealthReport = dynamic(
  () => import('@/components/dashboard/site-intelligence/HealthReport'),
  { loading: () => <AuditHistoryPanelSkeleton />, ssr: false },
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

const COPY = {
  tabListAriaLabel: '站点分析功能',
  loadingReport: '生成健康报告中…',
  fetchErrorTitle: '报告加载失败',
  fetchErrorDesc: '无法获取审计报告，请重试。',
  retry: '重试',
} as const;

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
  const [activeTab, setActiveTab] = useState<TabType>('overview'); // Default to overview in phase 2
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
    router.replace(pathname + '#' + tab, { scroll: false });
    if (tab === 'audit') fetchReport();
  };

  const tabCls = (key: TabType) =>
    `px-4 py-3 text-sm border-b-2 transition-all whitespace-nowrap ` +
    `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-inset ` +
    (activeTab === key
      ? 'border-brand-secondary text-gray-900 font-bold'
      : 'border-transparent text-slate-500 font-medium hover:text-slate-700 hover:border-slate-300');

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div
        role="tablist"
        aria-label={COPY.tabListAriaLabel}
        className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide sticky top-14 bg-white/80 backdrop-blur-md z-30 -mx-6 md:-mx-10 px-6 md:px-10"
      >
        <button role="tab" id="tab-overview" aria-selected={activeTab === 'overview'} aria-controls="tabpanel-overview"
          onClick={() => handleTabChange('overview')} className={tabCls('overview')}>
          概览
        </button>

        <button role="tab" id="tab-strategy" aria-selected={activeTab === 'strategy'} aria-controls="tabpanel-strategy"
          onClick={() => handleTabChange('strategy')}
          className={`${tabCls('strategy')} flex items-center gap-1.5`}>
          内容策略
        </button>

        <button role="tab" id="tab-competitors" aria-selected={activeTab === 'competitors'} aria-controls="tabpanel-competitors"
          onClick={() => handleTabChange('competitors')} className={tabCls('competitors')}>
          竞争分析
        </button>

        <button role="tab" id="tab-performance" aria-selected={activeTab === 'performance'} aria-controls="tabpanel-performance"
          onClick={() => handleTabChange('performance')} className={tabCls('performance')}>
          搜索表现
        </button>

        <button role="tab" id="tab-traffic" aria-selected={activeTab === 'traffic'} aria-controls="tabpanel-traffic"
          onClick={() => handleTabChange('traffic')} className={tabCls('traffic')}>
          流量表现
        </button>

        <button role="tab" id="tab-audit" aria-selected={activeTab === 'audit'} aria-controls="tabpanel-audit"
          onClick={() => handleTabChange('audit')} className={tabCls('audit')}>
          体检报告
        </button>

        <button role="tab" id="tab-audits" aria-selected={activeTab === 'audits'} aria-controls="tabpanel-audits"
          onClick={() => handleTabChange('audits')} className={tabCls('audits')}>
          审计历史
        </button>

        <div className="flex-1" aria-hidden="true" />

        <button role="tab" id="tab-integrations" aria-selected={activeTab === 'integrations'} aria-controls="tabpanel-integrations"
          onClick={() => handleTabChange('integrations')} className={tabCls('integrations')}>
          设置
        </button>
      </div>

      {/* Tab Panels */}
      <div className="animate-in fade-in duration-500">
        <div role="tabpanel" id="tabpanel-overview" aria-labelledby="tab-overview" hidden={activeTab !== 'overview'}>
          <Suspense fallback={<OverviewPanelSkeleton />}>
            {activeTab === 'overview' && (
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
            {activeTab === 'strategy' && <StrategyBoard siteId={siteId} />}
          </Suspense>
        </div>

        <div role="tabpanel" id="tabpanel-audit" aria-labelledby="tab-audit" hidden={activeTab !== 'audit'}>
          <Suspense fallback={<AuditHistoryPanelSkeleton />}>
            {activeTab === 'audit' && (
              <div className="space-y-6">
                {loadingReport ? (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                    <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent motion-safe:animate-spin mb-4" aria-hidden="true" />
                    <p className="text-sm font-medium">{COPY.loadingReport}</p>
                  </div>
                ) : fetchError ? (
                  <div role="alert" className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <p className="text-sm font-bold text-slate-900">{COPY.fetchErrorTitle}</p>
                    <p className="text-sm text-slate-500">{COPY.fetchErrorDesc}</p>
                    <button
                      onClick={() => { setIssueReportLoaded(false); fetchReport(); }}
                      className="px-4 py-2 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/50"
                    >
                      {COPY.retry}
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
            {activeTab === 'audits' && <AuditHistoryPanel siteId={siteId} domain={domain} />}
          </Suspense>
        </div>

        <div role="tabpanel" id="tabpanel-competitors" aria-labelledby="tab-competitors" hidden={activeTab !== 'competitors'}>
          <Suspense fallback={<CompetitorsPanelSkeleton />}>
            {activeTab === 'competitors' && <CompetitorsPanel siteId={siteId} />}
          </Suspense>
        </div>

        <div role="tabpanel" id="tabpanel-performance" aria-labelledby="tab-performance" hidden={activeTab !== 'performance'}>
          <Suspense fallback={<PerformancePanelSkeleton />}>
            {activeTab === 'performance' && <PerformanceDashboard siteId={siteId} />}
          </Suspense>
        </div>

        <div role="tabpanel" id="tabpanel-traffic" aria-labelledby="tab-traffic" hidden={activeTab !== 'traffic'}>
          <Suspense fallback={<PerformancePanelSkeleton />}>
            {activeTab === 'traffic' && <Ga4PerformanceDashboard siteId={siteId} />}
          </Suspense>
        </div>

        <div role="tabpanel" id="tabpanel-integrations" aria-labelledby="tab-integrations" hidden={activeTab !== 'integrations'}>
          <Suspense fallback={<IntegrationsPanelSkeleton />}>
            {activeTab === 'integrations' && <IntegrationsPanel siteId={siteId} onUpdate={() => {}} />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
