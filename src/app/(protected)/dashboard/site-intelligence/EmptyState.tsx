'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import posthog from 'posthog-js';

export function EmptyState() {
  const t = useTranslations('dashboard.emptyState');
    const [domain, setDomain] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (!trimmed) { setError(t('errorEmpty')); return; }
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
                setError(data.error || t('addFailed'));
                setLoading(false);
            }
        } catch {
            setError(t('systemError'));
            setLoading(false);
        }
    };

    return (
        <Card className="bg-white border-brand-border shadow-sm p-12 flex flex-col items-center text-center gap-6 rounded-2xl max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-3xl">
                🛰
            </div>
            <div className="space-y-1">
                <h2 className="text-brand-text-primary font-semibold text-lg">{t('title')}</h2>
                <p className="text-brand-text-secondary text-sm">{t('desc')}</p>
            </div>
            <form onSubmit={handleSubmit} className="w-full space-y-3">
                <div className="text-left space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted">
                        {t('domainLabel')}
                    </label>
                    <input
                        type="text"
                        value={domain}
                        onChange={e => setDomain(e.target.value)}
                        placeholder={t('placeholder')}
                        className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                        disabled={loading}
                    />
                    {error && <p className="text-xs text-brand-error font-medium">{error}</p>}
                </div>
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl shadow-sm font-bold disabled:opacity-50"
                >
                    {loading ? t('submitting') : t('submit')}
                </Button>
            </form>
        </Card>
    );
}
