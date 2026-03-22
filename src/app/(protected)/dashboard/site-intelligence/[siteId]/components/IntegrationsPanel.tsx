"use client"
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { GscPropertySelector } from './GscPropertySelector';
import { Ga4PropertySelector } from './Ga4PropertySelector';

interface SiteData {
    id: string;
    domain: string;
    gscConnections?: any[];
    ga4Connections?: any[];
}

export function IntegrationsPanel({ siteId, onUpdate }: { siteId: string, onUpdate: () => void }) {
    const [isConnectingGSC, setIsConnectingGSC] = useState(false);
    const [isConnectingGA4, setIsConnectingGA4] = useState(false);

    // We fetch current context locally in this panel or accept it via props.
    // Assuming we fetch it fresh so it survives unmount/remount
    const [loading, setLoading] = React.useState(true);
    const [siteData, setSiteData] = React.useState<SiteData | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}`);
            const data = await res.json();
            if (data.success) {
                setSiteData(data.site);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, [siteId]);

    const handleConnectGSC = async () => {
        setIsConnectingGSC(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/gsc-sync/auth`, { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || "Failed to initialize GSC connection");
            }
        } catch (e) {
            console.error(e);
            alert("Error connecting to GSC");
        } finally {
            setIsConnectingGSC(false);
        }
    };

    const handleConnectGA4 = async () => {
        setIsConnectingGA4(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/ga4-sync/auth`, { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || "Failed to initialize GA4 connection");
            }
        } catch (e) {
            console.error(e);
            alert("Error connecting to GA4");
        } finally {
            setIsConnectingGA4(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div>
                    <div className="h-6 w-64 bg-slate-200 rounded-md mb-2"></div>
                    <div className="h-4 w-96 bg-slate-100 rounded-md mb-6 max-w-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map(i => (
                        <Card key={i} className="p-6 border-slate-200 h-[220px] flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="h-5 w-40 bg-slate-200 rounded-md mb-2"></div>
                                    <div className="h-3 w-64 bg-slate-100 rounded-md"></div>
                                    <div className="h-3 w-48 bg-slate-100 rounded-md mt-1"></div>
                                </div>
                                <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
                            </div>
                            <div className="mt-auto border-t border-slate-100 pt-4">
                                <div className="h-9 w-full bg-slate-100 rounded-lg"></div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!siteData) {
        return <div className="p-8 text-center text-rose-500 text-sm">无法加载站点配置数据</div>;
    }

    const hasGscToken = siteData.gscConnections && siteData.gscConnections.length > 0;
    const gscPropertySelected = hasGscToken && siteData.gscConnections![0].propertyId;

    const hasGa4Token = siteData.ga4Connections && siteData.ga4Connections.length > 0;
    const ga4PropertySelected = hasGa4Token && siteData.ga4Connections![0].propertyId;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">系统集成与数据源 (Integrations)</h3>
                <p className="text-sm text-slate-500 mb-6">关联外部工具和 API 数据源，以解锁更多维度的洞察图谱和更精准的审计引擎。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GSC Connector */}
                <Card className="p-6 border-slate-200">
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    Google Search Console
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">解锁关键词排名、展示、点击漏斗追踪，并辅助判定 Semantic Debts 的真实自然搜寻权重。</p>
                            </div>
                            <Badge variant="default" className={gscPropertySelected ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}>
                                {gscPropertySelected ? '已绑定稳定' : '尚未映射数据流'}
                            </Badge>
                        </div>

                        <div className="mt-auto border-t border-slate-100 pt-4">
                            {!hasGscToken ? (
                                <button
                                    onClick={handleConnectGSC}
                                    disabled={isConnectingGSC}
                                    className="w-full text-xs font-bold text-center text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                                    {isConnectingGSC ? '正在请求授权...' : '使用谷歌账号认证接入 GSC'}
                                </button>
                            ) : !gscPropertySelected ? (
                                <div className="space-y-3">
                                    <p className="text-xs text-brand-primary p-2 bg-brand-primary/10 rounded">授权成功！请在下方指派该站点的具体 Property URL 属性。</p>
                                    <GscPropertySelector siteId={siteId} onSelected={() => { fetchData(); onUpdate(); }} />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-2 rounded flex items-center gap-2 text-wrap break-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                        数据流已映射：({siteData.gscConnections![0].propertyId})
                                    </div>
                                    <button
                                        onClick={handleConnectGSC}
                                        disabled={isConnectingGSC}
                                        className="text-xs text-slate-500 hover:text-slate-800 underline self-start"
                                    >
                                        重新授权或更改绑定
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* GA4 Connector */}
                <Card className="p-6 border-slate-200">
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    Google Analytics 4
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">解锁高精确的真实活跃访客数量(AU)、独立会话驻留行为(Session Duration)以及访客流失热点测算。</p>
                            </div>
                            <Badge variant="default" className={ga4PropertySelected ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}>
                                {ga4PropertySelected ? '已绑定稳定' : '尚未映射数据流'}
                            </Badge>
                        </div>

                        <div className="mt-auto border-t border-slate-100 pt-4">
                            {!hasGa4Token ? (
                                <button
                                    onClick={handleConnectGA4}
                                    disabled={isConnectingGA4}
                                    className="w-full text-xs font-bold text-center text-orange-700 bg-orange-50 hover:bg-orange-100 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
                                    {isConnectingGA4 ? '正在请求授权...' : '使用谷歌账号认证接入 GA4'}
                                </button>
                            ) : !ga4PropertySelected ? (
                                <div className="space-y-3">
                                    <p className="text-xs text-orange-600 p-2 bg-orange-50 rounded">授权成功！请在下方指派该站点的具体 GA4 数据流 (Property ID)。</p>
                                    <Ga4PropertySelector siteId={siteId} onSelected={() => { fetchData(); onUpdate(); }} />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-2 rounded flex items-center gap-2 text-wrap break-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                        数据流已映射：({siteData.ga4Connections![0].propertyId.replace('properties/', '')})
                                    </div>
                                    <button
                                        onClick={handleConnectGA4}
                                        disabled={isConnectingGA4}
                                        className="text-xs text-slate-500 hover:text-slate-800 underline self-start"
                                    >
                                        重新授权或更改绑定
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
