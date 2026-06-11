'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import posthog from 'posthog-js';

const COPY = {
    title: '暂无扫描记录',
    desc: '运行首次即时审计以开始构建您的主题权威星图。',
    domainLabel: '输入您的网站域名',
    placeholder: '例如: example.com',
    submit: '添加并扫描',
    submitting: '创建中...',
    errorEmpty: '请输入域名',
} as const;

export function EmptyState() {
    const [domain, setDomain] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (!trimmed) { setError(COPY.errorEmpty); return; }
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard/sites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: trimmed }),
            });
            const data = await res.json();
            if (data.success && data.site?.id) {
                posthog.capture('first_site_added', { domain: trimmed });
                window.location.href = `/dashboard/site-intelligence/instant-audit?siteId=${data.site.id}&rescan=1`;
            } else {
                setError(data.error || '添加失败，请重试');
                setLoading(false);
            }
        } catch {
            setError('系统错误，请重试');
            setLoading(false);
        }
    };

    return (
        <Card className="bg-white border-slate-200 shadow-sm p-12 flex flex-col items-center text-center gap-6 rounded-2xl max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-3xl">
                🛰
            </div>
            <div className="space-y-1">
                <h2 className="text-slate-900 font-semibold text-lg">{COPY.title}</h2>
                <p className="text-slate-500 text-sm">{COPY.desc}</p>
            </div>
            <form onSubmit={handleSubmit} className="w-full space-y-3">
                <div className="text-left space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {COPY.domainLabel}
                    </label>
                    <input
                        type="text"
                        value={domain}
                        onChange={e => setDomain(e.target.value)}
                        placeholder={COPY.placeholder}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                        disabled={loading}
                    />
                    {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
                </div>
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm font-bold disabled:opacity-50"
                >
                    {loading ? COPY.submitting : COPY.submit}
                </Button>
            </form>
        </Card>
    );
}
