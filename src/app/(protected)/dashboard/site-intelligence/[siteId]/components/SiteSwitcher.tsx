'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X, Plus } from 'lucide-react';

const COPY = {
    SWITCH_SITE: "切换站点",
    MY_SITES: "我的站点 (Owned Sites)",
    NO_SITES: "暂无站点",
    ADD_SITE: "添加新站点",
    ADD_TITLE: "添加我的站点",
    ADD_DESC: "输入需要追踪和审计的网站域名",
    ADD_BUTTON: "添加并进入",
    ADD_CANCEL: "取消",
    ADD_ADDING: "添加中...",
    ADD_PLACEHOLDER: "例如: example.com",
    DELETE_TITLE: "确认删除站点？",
    DELETE_DESC: "此操作将永久删除该站点及其所有历史审计记录、语义债务和竞争对手数据，无法恢复。",
    DELETE_CONFIRM_PREFIX: "请输入域名",
    DELETE_CONFIRM_SUFFIX: "以确认删除：",
    DELETE_BUTTON: "确认删除",
    DELETE_DELETING: "删除中...",
    DELETE_CANCEL: "取消",
    DELETE_PLACEHOLDER: "输入域名以确认",
};

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

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<Site | null>(null);
    const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Add site state
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSiteDomain, setNewSiteDomain] = useState('');
    const [isAddingSite, setIsAddingSite] = useState(false);

    useEffect(() => {
        fetch('/api/dashboard/sites')
            .then(r => r.json())
            .then(data => {
                if (data.sites) setSites(data.sites);
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

    const handleDeleteSite = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/dashboard/sites/${deleteTarget.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                const remaining = sites.filter(s => s.id !== deleteTarget.id);
                setSites(remaining);
                setDeleteTarget(null);
                setDeleteConfirmInput('');

                if (deleteTarget.id === currentSiteId) {
                    const mySitesRemaining = remaining.filter(s => !s.isCompetitor);
                    if (mySitesRemaining.length > 0) {
                        router.push(`/dashboard/site-intelligence/${mySitesRemaining[0].id}`);
                    } else {
                        router.push('/dashboard/site-intelligence');
                    }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddSite = async () => {
        if (!newSiteDomain.trim()) return;
        setIsAddingSite(true);
        try {
            const res = await fetch('/api/dashboard/sites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: newSiteDomain.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                const newSite = data.site;
                setSites(prev => [newSite, ...prev]);
                setShowAddModal(false);
                setNewSiteDomain('');
                router.push(`/dashboard/site-intelligence/${newSite.id}`);
            } else {
                alert(data.error || "添加站点失败");
            }
        } catch (e) {
            console.error(e);
            alert("系统错误");
        } finally {
            setIsAddingSite(false);
        }
    };

    const renderSiteItem = (site: Site) => (
        <div
            key={site.id}
            className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors mb-1 cursor-pointer border ${site.id === currentSiteId
                ? 'bg-brand-primary/10 text-brand-primary shadow-sm border-brand-primary/10'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                }`}
            onClick={() => handleSelect(site.id)}
        >
            <div className="flex flex-col min-w-0 flex-1 mr-2">
                <span className="text-sm font-bold truncate">{site.domain}</span>
                {site.name && <span className="text-[10px] text-slate-400 truncate tracking-tight">{site.name}</span>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                {site.latestAudit && (
                    <div className="flex items-center gap-1.5 mr-1">
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
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(site);
                        setDeleteConfirmInput('');
                        setIsOpen(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={13} />
                </button>
                {site.id === currentSiteId && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary"><path d="M20 6 9 17l-5-5" /></svg>
                )}
            </div>
        </div>
    );

    return (
        <>
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
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{COPY.SWITCH_SITE}</p>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto p-2 space-y-4">
                            {mySites.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">{COPY.MY_SITES}</h3>
                                    {mySites.map(renderSiteItem)}
                                </div>
                            )}

                            {sites.length === 0 && (
                                <div className="py-8 text-center text-slate-400 text-xs italic">
                                    {COPY.NO_SITES}
                                </div>
                            )}
                        </div>

                        <div className="p-2 border-t border-slate-100 bg-slate-50/30">
                            <button
                                onClick={() => { setShowAddModal(true); setIsOpen(false); }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-700 bg-white hover:text-brand-primary shadow-sm border border-slate-100 hover:border-brand-primary/30 transition-all text-xs font-black uppercase tracking-tight"
                            >
                                <Plus size={14} className="text-brand-primary" />
                                {COPY.ADD_SITE}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
                    <div className="max-w-md w-full bg-white rounded-2xl p-8 space-y-6 shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-rose-500/20" />
                        <button
                            onClick={() => { setDeleteTarget(null); setDeleteConfirmInput(''); }}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto transform -rotate-6">
                            <Trash2 size={32} />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black tracking-tight text-slate-900">{COPY.DELETE_TITLE}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed px-2">{COPY.DELETE_DESC}</p>
                        </div>

                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {COPY.DELETE_CONFIRM_PREFIX}{' '}
                                <strong className="text-slate-700 font-mono normal-case">{deleteTarget.domain}</strong>
                                {' '}{COPY.DELETE_CONFIRM_SUFFIX}
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmInput}
                                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                                placeholder={COPY.DELETE_PLACEHOLDER}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-mono"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                className="flex-1 font-bold rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                onClick={() => { setDeleteTarget(null); setDeleteConfirmInput(''); }}
                                disabled={isDeleting}
                            >
                                {COPY.DELETE_CANCEL}
                            </button>
                            <button
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-4 py-2.5 text-sm shadow-lg shadow-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleDeleteSite}
                                disabled={isDeleting || deleteConfirmInput.trim() !== deleteTarget.domain}
                            >
                                {isDeleting ? COPY.DELETE_DELETING : COPY.DELETE_BUTTON}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Site Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
                    <div className="max-w-md w-full bg-white rounded-2xl p-8 space-y-6 shadow-2xl border border-brand-primary/20 animate-in zoom-in-95 duration-200 relative">
                        <button
                            onClick={() => { setShowAddModal(false); setNewSiteDomain(''); }}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="space-y-1">
                            <h3 className="text-xl font-black italic tracking-tight text-slate-900">{COPY.ADD_TITLE}</h3>
                            <p className="text-sm text-slate-500">{COPY.ADD_DESC}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">域名 (Domain)</label>
                                <input
                                    type="text"
                                    placeholder={COPY.ADD_PLACEHOLDER}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                                    value={newSiteDomain}
                                    onChange={(e) => setNewSiteDomain(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSite()}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    className="flex-1 font-bold rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                    onClick={() => { setShowAddModal(false); setNewSiteDomain(''); }}
                                    disabled={isAddingSite}
                                >
                                    {COPY.ADD_CANCEL}
                                </button>
                                <button
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-4 py-2.5 text-sm shadow-lg shadow-slate-200 transition-colors disabled:opacity-50"
                                    onClick={handleAddSite}
                                    disabled={isAddingSite || !newSiteDomain.trim()}
                                >
                                    {isAddingSite ? COPY.ADD_ADDING : COPY.ADD_BUTTON}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
