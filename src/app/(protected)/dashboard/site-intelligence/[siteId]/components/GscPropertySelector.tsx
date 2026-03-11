import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface GscProperty {
    siteUrl: string;
    permissionLevel: string;
}

interface GscPropertySelectorProps {
    siteId: string;
    onSelected: () => void;
}

export function GscPropertySelector({ siteId, onSelected }: GscPropertySelectorProps) {
    const [properties, setProperties] = useState<GscProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState(false);
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
        setSelecting(true);
        setError(null);
        try {
            const res = await fetch(`/api/dashboard/sites/${siteId}/gsc/properties/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ propertyId })
            });
            const data = await res.json();
            if (data.success) {
                onSelected();
            } else {
                setError(data.error || 'Failed to save selected property.');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while saving the property.');
        } finally {
            setSelecting(false);
        }
    };

    if (loading) {
        return (
            <Card className="p-6 border-dashed border-blue-200 bg-blue-50/10 flex flex-col items-center justify-center min-h-[150px]">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                <p className="text-xs text-slate-500">正在拉取您的 Google Search Console 站点列表...</p>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-6 border-rose-200 bg-rose-50 flex flex-col items-center text-center space-y-2">
                <span className="text-xl">⚠️</span>
                <p className="text-sm text-rose-700 font-medium">{error}</p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
                    重试
                </Button>
            </Card>
        );
    }

    if (properties.length === 0) {
        return (
            <Card className="p-6 border-amber-200 bg-amber-50 flex flex-col items-center text-center space-y-2">
                <span className="text-xl">📭</span>
                <p className="text-sm text-amber-800 font-medium">未在您的 Google 账号下找到任何 Search Console 站点。</p>
                <p className="text-xs text-amber-600">请确保您授权的 Google 账号拥有网站的数据查看权限。</p>
            </Card>
        );
    }

    return (
        <Card className="p-6 flex flex-col space-y-4 border-blue-200 bg-white shadow-sm">
            <div className="text-center mb-2">
                <h3 className="text-sm font-bold text-slate-800 mb-1">选择要关联的 GSC 站点</h3>
                <p className="text-xs text-slate-500">
                    请从以下列表中选择当前项目在 Google Search Console 中对应的所有权资源。
                </p>
            </div>
            <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-md divide-y divide-slate-100">
                {properties.map((prop) => (
                    <div key={prop.siteUrl} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-800 font-mono">{prop.siteUrl}</span>
                            <span className="text-[10px] text-slate-400">权限: {prop.permissionLevel}</span>
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            disabled={selecting}
                            onClick={() => handleSelect(prop.siteUrl)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4"
                        >
                            选择此站点
                        </Button>
                    </div>
                ))}
            </div>
        </Card>
    );
}
