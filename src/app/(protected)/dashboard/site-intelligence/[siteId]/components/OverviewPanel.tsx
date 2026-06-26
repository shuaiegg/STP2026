import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { IntegrationGuidanceCard } from '@/components/dashboard/IntegrationGuidanceCard';
import { KeywordTrendChart } from '@/components/dashboard/site-intelligence/KeywordTrendChart';
import { OrganicTrafficChart } from '@/components/dashboard/site-intelligence/OrganicTrafficChart';
import { DnaEditor } from './DnaEditor';
import { Zap, ChevronRight, TrendingUp, Search, BarChart2, Dna } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface OverviewPanelProps {
  siteId: string;
  domain: string;
  hasGsc: boolean;
  hasGa4: boolean;
  hasContentPlan: boolean;
  onSwitchTab?: (tab: string) => void;
}

export function OverviewPanel({ 
  siteId, 
  domain, 
  hasGsc, 
  hasGa4, 
  hasContentPlan, 
  onSwitchTab 
}: OverviewPanelProps) {
    const t = useTranslations('dashboard.overviewPanel');
    const [latestAudit, setLatestAudit] = useState<any>(null);
    const [semanticData, setSemanticData] = useState<any>(null);
    const [competitorCount, setCompetitorCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [isExtractingDNA, setIsExtractingDNA] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [chartRefreshKey, setChartRefreshKey] = useState(0);
    const [siteData, setSiteData] = useState<any>(null);

    const [ontologyFull, setOntologyFull] = useState<any | null>(null);
    const [ontologyLoading, setOntologyLoading] = useState(true);
    const [selectedDebt, setSelectedDebt] = useState<any | null>(null);

    const handleDebtClick = useCallback((debt: any) => {
        if (selectedDebt?.topic === debt.topic) {
            setSelectedDebt(null);
            return;
        }
        setSelectedDebt(debt);
    }, [selectedDebt]);

    const handleSwitchToStrategy = useCallback(() => {
        onSwitchTab?.('strategy');
        setSelectedDebt(null);
    }, [onSwitchTab]);

    const fetchOntology = useCallback(async () => {
        setOntologyLoading(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/ontology`);
            const data = await res.json();
            if (data.success) setOntologyFull(data.ontology);
        } catch (e) {
            console.error('Failed to load ontology:', e);
        } finally {
            setOntologyLoading(false);
        }
    }, [siteId]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [auditsRes, gapRes, compRes, siteRes] = await Promise.all([
                fetch(`/api/dashboard/sites/${siteId}/audits`),
                fetch(`/api/dashboard/sites/${siteId}/semantic-gap`),
                fetch(`/api/dashboard/sites/${siteId}/competitors`),
                fetch(`/api/dashboard/sites/${siteId}`)
            ]);

            const auditsData = await auditsRes.json();
            const semanticResData = await gapRes.json();
            const compData = await compRes.json();
            const siteDataJson = await siteRes.json();

            if (auditsData.audits && auditsData.audits.length > 0) {
                setLatestAudit(auditsData.audits[0]);
            }
            if (semanticResData.success) {
                setSemanticData(semanticResData.data);
            }
            if (compData.success) {
                setCompetitorCount(compData.competitors.length);
            }
            if (siteDataJson.success) {
                setSiteData(siteDataJson.site);
            }
        } catch (e) {
            console.error('Failed to load overview data:', e);
        } finally {
            setLoading(false);
        }
    }, [siteId]);

    const handleGscSync = useCallback(async () => {
        setIsSyncing(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/gsc-sync`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || t('syncError'));
                return;
            }
            if (data.snapshotCreated) {
                toast.success(t('syncSuccess'), { duration: 5000 });
            } else {
                toast.info(t('syncInfo'));
            }
            setChartRefreshKey(k => k + 1);
        } catch (e) {
            toast.error(t('networkError'));
        } finally {
            setIsSyncing(false);
        }
    }, [siteId, t]);

    const handleExtractDNA = useCallback(async () => {
        setIsExtractingDNA(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/ontology`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                await Promise.all([fetchData(), fetchOntology()]);
            } else {
                toast.error(data.error || t('extractDnaError'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('generalError'));
        } finally {
            setIsExtractingDNA(false);
        }
    }, [siteId, fetchData, fetchOntology, t]);

    useEffect(() => {
        fetchData();
        fetchOntology();
    }, [fetchData, fetchOntology]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[180px] bg-white border border-slate-100 rounded-2xl shadow-sm" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-[400px] bg-white border border-slate-100 rounded-2xl shadow-sm" />
                    <div className="h-[400px] bg-white border border-slate-100 rounded-2xl shadow-sm" />
                </div>
            </div>
        );
    }

    const techScore = latestAudit?.techScore || 0;
    const isScoreGood = techScore >= 80;
    const isScoreWarn = techScore >= 50 && techScore < 80;

    return (
        <div className="space-y-8" id="overview">
            {/* Top Row: Core Metrics & Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Health Score Card */}
                <Card className="p-6 border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isScoreGood ? 'bg-emerald-500' : isScoreWarn ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                            {t('healthScore')}
                        </h4>
                        <div className="flex items-baseline gap-2 pt-2">
                            <span className={`text-5xl font-black font-display italic tracking-tighter ${isScoreGood ? 'text-emerald-600' : isScoreWarn ? 'text-amber-600' : 'text-rose-600'}`}>
                                {techScore}
                            </span>
                            <span className="text-sm font-bold text-slate-300">/ 100</span>
                        </div>
                    </div>
                    <p className="mt-4 text-[11px] text-slate-500 font-medium">
                        {t('healthScoreDesc')}
                    </p>
                </Card>

                {/* Page Count Card */}
                <Card className="p-6 border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('pageScale')}</h4>
                        <div className="flex items-baseline gap-2 pt-2">
                            <span className="text-5xl font-black font-display italic tracking-tighter text-slate-900">
                                {latestAudit?.pageCount || 0}
                            </span>
                            <span className="text-sm font-bold text-slate-300">PAGES</span>
                        </div>
                    </div>
                    <p className="mt-4 text-[11px] text-slate-500 font-medium">
                        {t('pageScaleDesc')}
                    </p>
                </Card>

                {/* Competitors Card */}
                <Card className="p-6 border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('competitors')}</h4>
                        <div className="flex items-baseline gap-2 pt-2">
                            <span className="text-5xl font-black font-display italic tracking-tighter text-slate-900">
                                {competitorCount}
                            </span>
                            <span className="text-sm font-bold text-slate-300">/ 5 MAX</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => onSwitchTab?.('competitors')}
                        className="mt-4 flex items-center text-[11px] font-black text-brand-primary uppercase tracking-widest hover:gap-2 transition-all"
                    >
                        {t('manageList')} <ChevronRight size={14} className="ml-1" />
                    </button>
                </Card>
            </div>

            {/* Business DNA Editor */}
            <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Dna size={16} className="text-brand-primary" /> {t('coreDna')}
                </h3>
                {ontologyLoading ? (
                    <div className="h-24 bg-slate-100 rounded-lg animate-pulse" />
                ) : (
                    <DnaEditor
                        siteId={siteId}
                        ontology={ontologyFull}
                        isExtracting={isExtractingDNA}
                        onExtract={handleExtractDNA}
                        onSaved={(updated) => setOntologyFull(updated)}
                    />
                )}
            </div>

            {/* Adaptive Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Data Insights */}
                <div className="space-y-8">
                    {/* Keywords Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <Search size={16} className="text-brand-primary" /> {t('keywords')}
                            </h3>
                            {hasGsc && (
                                <button onClick={() => onSwitchTab?.('performance')} className="text-[10px] font-black text-brand-primary uppercase">{t('viewAll')} &rarr;</button>
                            )}
                        </div>
                        <KeywordTrendChart
                            siteId={siteId}
                            hasGsc={hasGsc}
                            isSyncing={isSyncing}
                            refreshKey={chartRefreshKey}
                            onSyncClick={handleGscSync}
                            onConnectClick={() => onSwitchTab?.('integrations')}
                        />
                    </div>

                    {/* Traffic Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <BarChart2 size={16} className="text-brand-primary" /> {t('traffic')}
                            </h3>
                            {hasGa4 && (
                                <button onClick={() => onSwitchTab?.('traffic')} className="text-[10px] font-black text-brand-primary uppercase">{t('viewDetail')} &rarr;</button>
                            )}
                        </div>
                        <OrganicTrafficChart
                            siteId={siteId}
                            hasGsc={hasGsc}
                            onConnectClick={() => onSwitchTab?.('integrations')}
                        />
                    </div>
                </div>

                {/* Right Column: Strategic Insights */}
                <div className="space-y-8">
                    {/* Content Plan Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={16} className="text-brand-primary" /> {t('contentPlan')}
                            </h3>
                            {hasContentPlan && (
                                <button onClick={() => onSwitchTab?.('strategy')} className="text-[10px] font-black text-brand-primary uppercase">{t('enterWorkbench')} &rarr;</button>
                            )}
                        </div>
                        {hasContentPlan ? (
                            semanticData?.ourStrengths?.length > 0 ? (
                                <Card className="p-5 bg-indigo-50/30 border-indigo-100 shadow-sm">
                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">{t('coreDna')}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {semanticData.ourStrengths.slice(0, 6).map((topic: any, i: number) => (
                                            <Badge key={i} variant="default" className="bg-white border-indigo-200 text-indigo-700 shadow-sm">
                                                {topic.topic}
                                            </Badge>
                                        ))}
                                    </div>
                                </Card>
                            ) : null
                        ) : (
                            <IntegrationGuidanceCard type="content-plan" onClick={() => onSwitchTab?.('strategy')} />
                        )}
                    </div>

                    {/* Semantic Debts / Gaps */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={16} className="text-rose-500" /> {t('semanticDebts')}
                        </h3>
                        {semanticData?.semanticDebts?.length > 0 ? (
                            <Card className="p-6 border-rose-100 bg-rose-50/20 shadow-sm">
                                <div className="space-y-3">
                                    {semanticData.semanticDebts.slice(0, 3).map((debt: any, i: number) => (
                                        <React.Fragment key={i}>
                                            <div 
                                                className={`flex items-center justify-between p-3 bg-white rounded-xl border transition-all cursor-pointer group ${selectedDebt?.topic === debt.topic ? 'border-rose-400 shadow-sm' : 'border-rose-100 hover:border-rose-300'}`}
                                                onClick={() => handleDebtClick(debt)}
                                            >
                                                <span className="text-sm font-bold text-slate-800">{debt.topic}</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t('coverage')}</span>
                                                        <span className="text-[10px] font-black text-rose-600">{debt.coverageScore}%</span>
                                                    </div>
                                                    <ChevronRight size={14} className={`transition-transform ${selectedDebt?.topic === debt.topic ? 'rotate-90 text-rose-500' : 'text-rose-200 group-hover:text-rose-400'}`} />
                                                </div>
                                            </div>
                                            
                                            {selectedDebt?.topic === debt.topic && (
                                                <div className="mt-2 ml-2 p-4 bg-white border border-rose-100 rounded-xl animate-scale-in">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('topicName')}</div>
                                                            <div className="text-sm font-bold text-slate-900">{debt.topic}</div>
                                                        </div>
                                                        <Badge variant="muted" className="bg-rose-50 text-rose-600 border-rose-100 font-mono">
                                                            SCORE: {debt.coverageScore}
                                                        </Badge>
                                                    </div>
                                                    <button 
                                                        onClick={handleSwitchToStrategy}
                                                        className="mt-4 w-full py-2 bg-rose-600 text-white text-[11px] font-black uppercase rounded-lg shadow-sm hover:bg-rose-700 transition-colors"
                                                    >
                                                        {t('viewInStrategy')}
                                                    </button>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-12 border-dashed border-slate-200 text-center text-slate-400 italic text-xs">
                                {t('noGaps')}
                            </Card>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
