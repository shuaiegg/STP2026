import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check, Loader2 } from 'lucide-react';


interface GscProperty {
    siteUrl: string;
    permissionLevel: string;
}

interface GscPropertySelectorProps {
    siteId: string;
    onSelected: () => void;
}

export function GscPropertySelector({ siteId, onSelected }: GscPropertySelectorProps) {
    const t = useTranslations('dashboard.gscSelector');
    const [properties, setProperties] = useState<GscProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectingId, setSelectingId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/dashboard/sites/${siteId}/gsc/properties`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProperties(data.properties || []);
                } else {
                    setError(data.error || 'Failed to load properties');
                }
            })
            .catch(err => {
                console.error(err);
                setError('Failed to fetch GSC properties.');
            })
            .finally(() => setLoading(false));
    }, [siteId]);

    const handleSelect = async (propertyId: string) => {
        if (selectingId || selectedId) return;
        setSelectingId(propertyId);
        setError(null);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/gsc/properties/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId }),
            });
            const data = await res.json();
            if (data.success) {
                setSelectedId(propertyId);
                // Show success state briefly before parent refreshes
                setTimeout(() => onSelected(), 1000);
            } else {
                setError(data.error || 'Failed to save selected property.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while saving the property.');
        } finally {
            setSelectingId(null);
        }
    };

    if (loading) {
        return (
            <Card className="p-6 border-dashed border-blue-200 bg-blue-50/10 flex flex-col items-center justify-center min-h-[150px]">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-2" />
                <p className="text-xs text-slate-500">{t('loading')}</p>
            </Card>
        );
    }

    if (error && properties.length === 0) {
        return (
            <Card className="p-6 border-rose-200 bg-rose-50 flex flex-col items-center text-center space-y-2">
                <span className="text-xl">⚠️</span>
                <p className="text-sm text-rose-700 font-medium">{error}</p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
                    {t('retry')}
                </Button>
            </Card>
        );
    }

    if (properties.length === 0) {
        return (
            <Card className="p-6 border-amber-200 bg-amber-50 flex flex-col items-center text-center space-y-2">
                <span className="text-xl">📭</span>
                <p className="text-sm text-amber-800 font-medium">{t('empty')}</p>
                <p className="text-xs text-amber-600">{t('emptyHint')}</p>
            </Card>
        );
    }

    return (
        <Card className="p-6 flex flex-col space-y-4 border-blue-200 bg-white shadow-sm">
            <div className="text-center mb-2">
                <h3 className="text-sm font-bold text-slate-800 mb-1">{t('title')}</h3>
                <p className="text-xs text-slate-500">{t('desc')}</p>
            </div>

            {error && (
                <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-md divide-y divide-slate-100">
                {properties.map((prop) => {
                    const isThisSelecting = selectingId === prop.siteUrl;
                    const isThisSelected = selectedId === prop.siteUrl;
                    return (
                        <div
                            key={prop.siteUrl}
                            className={`flex justify-between items-center p-3 transition-colors ${isThisSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                        >
                            <div className="flex flex-col min-w-0 flex-1 mr-3">
                                <span className="text-sm font-medium text-slate-800 font-mono truncate">{prop.siteUrl}</span>
                                <span className="text-[10px] text-slate-400">{t('permission')}{prop.permissionLevel}</span>
                            </div>
                            <button
                                disabled={!!selectingId || !!selectedId}
                                onClick={() => handleSelect(prop.siteUrl)}
                                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                    ${isThisSelected
                                        ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                        : isThisSelecting
                                        ? 'bg-blue-100 text-blue-600 cursor-wait'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                                    }`}
                            >
                                {isThisSelecting ? (
                                    <><Loader2 size={12} className="animate-spin" />{t('selecting')}</>
                                ) : isThisSelected ? (
                                    <><Check size={12} />{t('selected')}</>
                                ) : t('select')}
                            </button>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
