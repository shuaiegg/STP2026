'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

interface Site {
    id: string;
    domain: string;
    name: string | null;
    isCompetitor: boolean;
    latestAudit?: {
        techScore: number | null;
        pageCount: number;
    } | null;
}

export function SiteSwitcher({ currentSiteId, currentDomain }: { currentSiteId: string, currentDomain: string }) {
    const router = useRouter();
    const [sites, setSites] = useState<Site[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/dashboard/sites')
            .then(r => r.json())
            .then(data => {
                if (data.sites) {
                    setSites(data.sites);
                }
            })
            .catch(console.error);
    }, []);

    const mySites = sites.filter(s => !s.isCompetitor);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (siteId: string) => {
        if (siteId === currentSiteId) {
            setIsOpen(false);
            return;
        }
        router.push(`/dashboard/site-intelligence/${siteId}`);
        setIsOpen(false);
    };

    const renderSiteItem = (site: Site) => (
        <button
            key={site.id}
            onClick={() => handleSelect(site.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors mb-1 ${site.id === currentSiteId
                ? 'bg-brand-primary/10 text-brand-primary shadow-sm border border-brand-primary/10'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
        >
            <div className="flex flex-col min-w-0 flex-1 mr-4">
                <span className="text-sm font-bold truncate">{site.domain}</span>
                {site.name && <span className="text-[10px] text-slate-400 truncate tracking-tight">{site.name}</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {site.latestAudit && (
                    <div className="flex items-center gap-2 mr-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${(site.latestAudit.techScore || 0) >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                (site.latestAudit.techScore || 0) >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                            {site.latestAudit.techScore || '-'}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                            {site.latestAudit.pageCount}P
                        </span>
                    </div>
                )}
                {site.id === currentSiteId && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary"><path d="M20 6 9 17l-5-5" /></svg>
                )}
            </div>
        </button>
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors group border border-transparent hover:border-slate-200"
            >
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{currentDomain}</h1>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                    <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">切换站点</p>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto p-2 space-y-4">
                        {mySites.length > 0 && (
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">我的站点 (Owned Sites)</h3>
                                {mySites.map(renderSiteItem)}
                            </div>
                        )}

                        {sites.length === 0 && (
                            <div className="py-8 text-center text-slate-400 text-xs italic">
                                暂无站点
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-slate-100 bg-slate-50/30">
                        <Link href="/dashboard/site-intelligence/instant-audit">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 bg-white hover:text-brand-primary shadow-sm border border-slate-100 hover:border-brand-primary/30 transition-all text-xs font-black uppercase tracking-tight"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary"><path d="M12 5v14M5 12h14" /></svg>
                                添加新站点扫描
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
