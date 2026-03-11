"use client"
import React, { useState, useEffect } from 'react';

interface GA4Property {
    id: string; // e.g. properties/1234567
    name: string;
    displayName: string;
}

export function Ga4PropertySelector({ siteId, onSelected }: { siteId: string, onSelected: () => void }) {
    const [properties, setProperties] = useState<GA4Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [selectedPropertyId, setSelectedPropertyId] = useState('');

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await fetch(`/api/dashboard/sites/${siteId}/ga4/properties`);
                const data = await res.json();

                if (data.needsReauth) {
                    setError("连接过期，请重新授权 GA4");
                    return;
                }

                if (data.success) {
                    setProperties(data.properties || []);
                    if (data.selectedPropertyId) {
                        setSelectedPropertyId(data.selectedPropertyId);
                    }
                } else {
                    setError(data.error || '无法获取 GA4 数据流列表');
                }
            } catch (err) {
                console.error(err);
                setError('网络请求失败');
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [siteId]);

    const handleSave = async () => {
        if (!selectedPropertyId) return;
        setSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/ga4/properties/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId: selectedPropertyId })
            });
            const data = await res.json();

            if (data.success) {
                onSelected(); // Refresh parent component
            } else {
                setError(data.error || '保存失败');
            }
        } catch (err) {
            console.error(err);
            setError('网络请求失败');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg animate-pulse">
                <div className="h-4 bg-orange-200 rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-orange-100 rounded w-full"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg text-xs">
                <p className="text-rose-600 mb-2 font-medium">⚠️ {error}</p>
                <div className="flex gap-2">
                    <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium">重试刷新</button>
                </div>
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-800">
                <span className="font-bold">未找到绑定的 数据流</span>
                <p className="mt-1 opacity-80">当前 Google 账号下未检测到可用的 GA4 数据流。</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-orange-50/50 border border-orange-200 shadow-sm rounded-lg flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
                <div className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
                    选择 GA4 数据流
                </div>
                <select
                    className="w-full text-sm border-orange-200 rounded bg-white shadow-sm focus:ring-orange-500 focus:border-orange-500 p-2"
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    disabled={saving}
                >
                    <option value="" disabled>-- 请选择一个站点数据流 --</option>
                    {properties.map(p => (
                        <option key={p.id} value={p.id}>{p.displayName}</option>
                    ))}
                </select>
            </div>
            <button
                onClick={handleSave}
                disabled={saving || !selectedPropertyId}
                className="mt-2 sm:mt-0 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white text-xs font-bold py-2.5 px-5 rounded-md transition-colors whitespace-nowrap"
            >
                {saving ? '保存中...' : '确认关联'}
            </button>
        </div>
    );
}
