"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, ImagePlus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { listMediaAction } from '@/app/actions/media';
import { Button } from '@/components/ui/Button';

interface MediaItem {
    id: string;
    filename: string;
    storageUrl: string;
    mimeType: string;
    size: number;
    createdAt: Date;
}

interface MediaLibraryModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (url: string, alt: string) => void;
}

export function MediaLibraryModal({ open, onClose, onSelect }: MediaLibraryModalProps) {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchMedia = useCallback(async (p: number, q: string) => {
        setLoading(true);
        try {
            const res = await listMediaAction({ page: p, pageSize: 24, search: q || undefined });
            if (res.success && res.data) {
                setItems(res.data.items as MediaItem[]);
                setTotalPages(res.data.totalPages);
                setPage(res.data.page);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchMedia(1, search);
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = () => {
        fetchMedia(1, search);
    };

    const handlePageChange = (newPage: number) => {
        fetchMedia(newPage, search);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-brand-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                            <ImagePlus size={16} className="text-brand-primary" />
                        </div>
                        <h2 className="text-lg font-bold text-brand-text-primary">媒体库</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-brand-surface text-brand-text-muted hover:text-brand-text-secondary transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 py-3 border-b border-brand-surface-alt">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="搜索文件名..."
                                className="w-full pl-9 pr-3 py-2 bg-brand-surface-alt border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary/20 focus:outline-none"
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={handleSearch}
                            variant="outline"
                            className="px-4 text-sm rounded-lg"
                        >
                            搜索
                        </Button>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw size={20} className="animate-spin text-brand-primary" />
                            <span className="ml-2 text-sm text-brand-text-secondary">加载中...</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-12 text-brand-text-muted text-sm">
                            暂无媒体文件
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                            {items.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(item.storageUrl, item.filename.replace(/\.[^.]+$/, ''));
                                        onClose();
                                    }}
                                    className="group relative aspect-square bg-brand-surface-alt rounded-xl overflow-hidden border-2 border-transparent hover:border-brand-primary transition-all"
                                >
                                    {item.mimeType.startsWith('image/') ? (
                                        <Image
                                            src={item.storageUrl}
                                            alt={item.filename}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-brand-text-muted">
                                            <ImagePlus size={24} />
                                        </div>
                                    )}
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 z-10">
                                        <span className="text-white text-[10px] font-medium truncate w-full text-center px-1">
                                            {item.filename}
                                        </span>
                                        <span className="text-white/70 text-[9px]">
                                            {formatSize(item.size)}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 p-4 border-t border-brand-border">
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={page <= 1}
                            onClick={() => handlePageChange(page - 1)}
                            className="p-2"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <span className="text-xs font-medium text-brand-text-secondary">
                            {page} / {totalPages}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={page >= totalPages}
                            onClick={() => handlePageChange(page + 1)}
                            className="p-2"
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
