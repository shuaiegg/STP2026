"use client";

import React, { useState, useCallback } from 'react';
import { X, Search, Link2, RefreshCw } from 'lucide-react';
import { searchPublishedContent } from '@/app/actions/content';

interface InternalLinkResult {
    id: string;
    title: string;
    slug: string;
    locale: string;
}

interface InternalLinkModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (markdownLink: string) => void;
    currentLocale?: string;
}

export function InternalLinkModal({ open, onClose, onSelect, currentLocale }: InternalLinkModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<InternalLinkResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [localeFilter, setLocaleFilter] = useState<string>(currentLocale || '');

    const handleSearch = useCallback(async () => {
        if (!query.trim()) return;
        setLoading(true);
        setSearched(true);
        try {
            const res = await searchPublishedContent(query, localeFilter || undefined);
            if (res.success && res.data) {
                setResults(res.data);
            }
        } finally {
            setLoading(false);
        }
    }, [query, localeFilter]);

    const handleSelect = (article: InternalLinkResult) => {
        // Build the markdown link with correct locale prefix
        const path = article.locale === 'en'
            ? `/blog/${article.slug}`
            : `/zh/blog/${article.slug}`;
        const markdownLink = `[${article.title}](${path})`;
        onSelect(markdownLink);
        onClose();
        // Reset state
        setQuery('');
        setResults([]);
        setSearched(false);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[60vh] flex flex-col mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-brand-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                            <Link2 size={16} className="text-brand-primary" />
                        </div>
                        <h2 className="text-lg font-bold text-brand-text-primary">插入内链</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-brand-surface text-brand-text-muted hover:text-brand-text-secondary transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 py-3 space-y-2">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="搜索已发布文章标题或 slug..."
                                autoFocus
                                className="w-full pl-9 pr-3 py-2 bg-brand-surface-alt border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:outline-none"
                            />
                        </div>
                        <select
                            value={localeFilter}
                            onChange={(e) => setLocaleFilter(e.target.value)}
                            className="bg-brand-surface-alt border border-brand-border rounded-lg px-2 py-2 text-xs font-semibold focus:ring-2 focus:ring-brand-primary/20"
                        >
                            <option value="">全部语言</option>
                            <option value="en">🇺🇸 EN</option>
                            <option value="zh">🇨🇳 ZH</option>
                        </select>
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={!query.trim() || loading}
                            className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-primary-hover disabled:opacity-50 transition-colors"
                        >
                            搜索
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto px-5 pb-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw size={16} className="animate-spin text-brand-primary" />
                            <span className="ml-2 text-sm text-brand-text-secondary">搜索中...</span>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-1.5">
                            {results.map((article) => (
                                <button
                                    key={article.id}
                                    type="button"
                                    onClick={() => handleSelect(article)}
                                    className="w-full text-left p-3 rounded-xl hover:bg-brand-surface-alt border border-transparent hover:border-brand-border transition-all group"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-surface text-brand-text-secondary uppercase">
                                            {article.locale}
                                        </span>
                                        <span className="text-sm font-semibold text-brand-text-primary group-hover:text-brand-primary truncate">
                                            {article.title}
                                        </span>
                                    </div>
                                    <div className="text-xs text-brand-text-muted mt-0.5 font-mono truncate">
                                        /{article.locale === 'zh' ? 'zh/' : ''}blog/{article.slug}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : searched ? (
                        <div className="text-center py-8 text-brand-text-muted text-sm">
                            未找到匹配的已发布文章
                        </div>
                    ) : (
                        <div className="text-center py-8 text-brand-text-muted text-sm">
                            输入关键词搜索已发布的文章
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
