"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
}

interface Post {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    publishedAt: Date | string | null;
    category: Category | null;
    readingTime: number | null;
    coverImage?: {
        id: string;
        storageUrl: string | null;
        originalUrl: string | null;
    } | null;
}

interface BlogListContentProps {
    initialPosts: Post[];
    categories: Category[];
}

const COPY = {
    pageLabel: 'SEO 洞察 · 增长方法论',
    headline: '博客',
    subheadline: '深入解析 SEO、GEO 与数字增长的工程实践。',
    allLabel: '全部',
    readMoreLabel: '阅读全文',
    emptyTitle: '该分类暂无文章',
    emptyDescription: '换一个分类看看，或者稍后再来。',
    minuteLabel: '分钟',
};

function formatDate(dateInput: Date | string | null): string {
    if (!dateInput) return '';
    const date = typeof dateInput === 'object' && dateInput instanceof Date
        ? dateInput
        : new Date(dateInput as string);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function BlogListContent({ initialPosts, categories }: BlogListContentProps) {
    const [activeCategory, setActiveCategory] = useState('all');

    const filteredPosts = activeCategory === 'all'
        ? initialPosts
        : initialPosts.filter(p => p.category?.slug === activeCategory);

    const featuredPost = filteredPosts[0] ?? null;
    const restPosts = filteredPosts.slice(1);

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-6 py-20">

                {/* ── PAGE HEADER ── */}
                <header className="mb-16">
                    <p className="text-xs font-mono text-brand-secondary uppercase tracking-widest mb-4">
                        {COPY.pageLabel}
                    </p>
                    <h1 className="text-5xl md:text-6xl font-display font-bold text-brand-text-primary tracking-tight mb-4">
                        {COPY.headline}
                    </h1>
                    <p className="text-lg text-brand-text-secondary max-w-xl">
                        {COPY.subheadline}
                    </p>
                </header>

                {/* ── CATEGORY FILTER ── */}
                <div className="flex flex-wrap gap-2 mb-14">
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeCategory === 'all'
                                ? 'bg-brand-primary text-white'
                                : 'bg-brand-surface text-brand-text-secondary hover:bg-brand-surface-alt hover:text-brand-text-primary'
                        }`}
                    >
                        {COPY.allLabel}
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.slug)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeCategory === cat.slug
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-brand-surface text-brand-text-secondary hover:bg-brand-surface-alt hover:text-brand-text-primary'
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* ── EMPTY STATE ── */}
                {filteredPosts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-12 h-12 rounded-full bg-brand-surface flex items-center justify-center mb-4">
                            <svg className="w-5 h-5 text-brand-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="font-semibold text-brand-text-primary mb-1">{COPY.emptyTitle}</p>
                        <p className="text-sm text-brand-text-muted">{COPY.emptyDescription}</p>
                    </div>
                )}

                {/* ── FEATURED POST (first post, full width) ── */}
                {featuredPost && (
                    <Link href={`/blog/${featuredPost.slug}`} className="group block mb-12">
                        <article className="grid md:grid-cols-2 gap-0 rounded-xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow bg-white">
                            <div className="relative aspect-[16/10] bg-brand-surface-alt">
                                <Image
                                    src={featuredPost.coverImage?.storageUrl || featuredPost.coverImage?.originalUrl || 'https://picsum.photos/seed/featured/1200/630'}
                                    alt={featuredPost.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                {featuredPost.category && (
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-white/90 backdrop-blur-sm text-brand-text-primary text-xs font-semibold px-3 py-1 rounded-full border border-brand-border">
                                            {featuredPost.category.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col justify-between p-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-4 text-xs text-brand-text-muted font-mono">
                                        <span>{formatDate(featuredPost.publishedAt)}</span>
                                        {featuredPost.readingTime && (
                                            <>
                                                <span>·</span>
                                                <span>{featuredPost.readingTime} {COPY.minuteLabel}</span>
                                            </>
                                        )}
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-display font-bold text-brand-text-primary leading-tight mb-4 group-hover:text-brand-secondary transition-colors">
                                        {featuredPost.title}
                                    </h2>
                                    {featuredPost.summary && (
                                        <p className="text-brand-text-secondary leading-relaxed line-clamp-3">
                                            {featuredPost.summary}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-8 text-sm font-medium text-brand-secondary">
                                    <span>{COPY.readMoreLabel}</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            </div>
                        </article>
                    </Link>
                )}

                {/* ── ARTICLE GRID ── */}
                {restPosts.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {restPosts.map((post) => {
                            const coverSrc = post.coverImage?.storageUrl || post.coverImage?.originalUrl || `https://picsum.photos/seed/${post.id}/800/450`;
                            return (
                                <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                                    <article className="rounded-lg border border-brand-border bg-white overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                                        <div className="relative aspect-[16/10] bg-brand-surface-alt overflow-hidden">
                                            <Image
                                                src={coverSrc}
                                                alt={post.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            {post.category && (
                                                <div className="absolute top-3 left-3">
                                                    <span className="bg-white/90 backdrop-blur-sm text-brand-text-primary text-xs font-medium px-2.5 py-1 rounded-full border border-brand-border">
                                                        {post.category.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-6 flex flex-col flex-1">
                                            <div className="flex items-center gap-2 mb-3 text-xs text-brand-text-muted font-mono">
                                                <span>{formatDate(post.publishedAt)}</span>
                                                {post.readingTime && (
                                                    <>
                                                        <span>·</span>
                                                        <span>{post.readingTime} {COPY.minuteLabel}</span>
                                                    </>
                                                )}
                                            </div>
                                            <h2 className="text-lg font-display font-bold text-brand-text-primary leading-snug mb-3 group-hover:text-brand-secondary transition-colors line-clamp-2">
                                                {post.title}
                                            </h2>
                                            {post.summary && (
                                                <p className="text-sm text-brand-text-secondary leading-relaxed line-clamp-2 flex-1">
                                                    {post.summary}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-brand-secondary">
                                                <span>{COPY.readMoreLabel}</span>
                                                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
}
