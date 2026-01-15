"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function BlogListContent({ initialPosts, categories }: BlogListContentProps) {
    const [activeCategory, setActiveCategory] = useState('all');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const filteredPosts = activeCategory === 'all'
        ? initialPosts
        : initialPosts.filter(p => p.category?.slug === activeCategory);

    // Format date for display
    const formatDate = (dateInput: Date | string | null) => {
        if (!dateInput) return 'Not Published';
        const date = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput as string);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    return (
        <div className="relative">
            {/* Technical Grid Background */}
            <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none" />

            {/* Gradient Mesh Overlay */}
            <div className="fixed inset-0 mesh-bg pointer-events-none" />

            <div className="relative max-w-[1400px] mx-auto px-6 py-20">
                {/* Header - Bold & Editorial */}
                <header className="mb-20">
                    <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {/* Technical Label */}
                        <div className="inline-flex items-center gap-3 mb-6">
                            <div className="w-3 h-3 bg-brand-secondary animate-pulse" />
                            <span className="font-mono text-xs tracking-wider uppercase text-brand-text-muted">
                                TECHNICAL INSIGHTS / 技术洞察
                            </span>
                        </div>

                        {/* Main Title - Brutalist Typography */}
                        <h1 className="font-display text-7xl sm:text-8xl lg:text-9xl font-bold text-brand-text-primary mb-8 leading-[0.9] tracking-tighter">
                            BLOG
                        </h1>

                        <div className="max-w-2xl">
                            <p className="text-2xl text-brand-text-secondary leading-relaxed font-medium">
                                深入解析数字化营销中的<span className="text-brand-secondary font-bold">工程实践</span>、
                                <span className="text-brand-accent font-bold">SEO 算法</span>与增长模型。
                            </p>
                        </div>
                    </div>
                </header>

                {/* Category Filter - Technical Style */}
                <div className={`mb-16 transition-all duration-700 delay-150 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-all border-2 ${
                                activeCategory === 'all'
                                    ? 'bg-brand-primary text-brand-text-inverted border-brand-primary'
                                    : 'bg-white text-brand-text-primary border-brand-border hover:border-brand-primary'
                            }`}
                        >
                            ALL / 全部
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.slug)}
                                className={`px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-all border-2 ${
                                    activeCategory === cat.slug
                                        ? 'bg-brand-primary text-brand-text-inverted border-brand-primary'
                                        : 'bg-white text-brand-text-primary border-brand-border hover:border-brand-primary'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Articles Grid - Asymmetric Layout */}
                <div className="space-y-8">
                    {filteredPosts.map((post, index) => {
                        const coverSrc = post.coverImage?.storageUrl || post.coverImage?.originalUrl || 'https://picsum.photos/seed/placeholder/1200/630';
                        const isLarge = index % 3 === 0; // Every 3rd post is larger
                        const isReverse = index % 2 === 1; // Alternate layout direction

                        return (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className={`group block transition-all duration-700 ${
                                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                                }`}
                                style={{ transitionDelay: `${Math.min(index * 100, 600)}ms` }}
                            >
                                <article className={`
                                    relative bg-white border-2 border-brand-border
                                    hover:border-brand-primary transition-all duration-300
                                    ${isLarge ? 'grid md:grid-cols-2 gap-0' : 'grid md:grid-cols-5 gap-0'}
                                    ${isReverse && !isLarge ? 'md:grid-flow-dense' : ''}
                                `}>
                                    {/* Image Section */}
                                    <div className={`
                                        relative overflow-hidden bg-brand-surface-alt
                                        ${isLarge ? 'md:col-span-1 aspect-[4/3]' : 'md:col-span-2 aspect-[16/10]'}
                                        ${isReverse && !isLarge ? 'md:col-start-4' : ''}
                                    `}>
                                        <img
                                            src={coverSrc}
                                            alt={post.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />

                                        {/* Category Badge - Brutalist */}
                                        {post.category && (
                                            <div className="absolute top-4 left-4">
                                                <div className="bg-brand-secondary text-brand-primary px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border-2 border-brand-primary">
                                                    {post.category.name}
                                                </div>
                                            </div>
                                        )}

                                        {/* Reading Time Indicator */}
                                        <div className="absolute bottom-4 right-4">
                                            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 border border-brand-border">
                                                <span className="font-mono text-xs font-bold text-brand-text-primary">
                                                    {post.readingTime || 10} MIN
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className={`
                                        flex flex-col justify-between p-8
                                        ${isLarge ? 'md:col-span-1' : 'md:col-span-3'}
                                        ${isReverse && !isLarge ? 'md:col-start-1 md:row-start-1' : ''}
                                    `}>
                                        {/* Date - Technical Format */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="font-mono text-xs text-brand-text-muted tracking-wider">
                                                {formatDate(post.publishedAt)}
                                            </span>
                                            <div className="flex-1 h-px bg-brand-border" />
                                        </div>

                                        {/* Title - Dynamic Sizing */}
                                        <h2 className={`
                                            font-display font-bold text-brand-text-primary mb-4
                                            leading-[1.1] tracking-tight
                                            group-hover:text-brand-secondary transition-colors duration-300
                                            ${isLarge ? 'text-4xl lg:text-5xl' : 'text-2xl lg:text-3xl'}
                                        `}>
                                            {post.title}
                                        </h2>

                                        {/* Summary */}
                                        {post.summary && (
                                            <p className={`
                                                text-brand-text-secondary leading-relaxed mb-6
                                                ${isLarge ? 'text-lg line-clamp-3' : 'text-base line-clamp-2'}
                                            `}>
                                                {post.summary}
                                            </p>
                                        )}

                                        {/* Read More - Brutalist Button */}
                                        <div className="flex items-center gap-3 mt-auto">
                                            <span className="font-mono text-sm font-bold uppercase tracking-wider text-brand-primary group-hover:text-brand-secondary transition-colors">
                                                Read More
                                            </span>
                                            <div className="w-12 h-px bg-brand-primary group-hover:w-20 group-hover:bg-brand-secondary transition-all duration-300" />
                                            <svg
                                                className="w-5 h-5 text-brand-primary group-hover:text-brand-secondary group-hover:translate-x-1 transition-all duration-300"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Brutalist Hover Shadow Effect */}
                                    <div className="absolute inset-0 border-2 border-brand-primary translate-x-0 translate-y-0 opacity-0 group-hover:translate-x-2 group-hover:translate-y-2 group-hover:opacity-100 transition-all duration-300 pointer-events-none -z-10" />
                                </article>
                            </Link>
                        );
                    })}
                </div>

                {/* Load More - Technical Style */}
                {filteredPosts.length > 0 && (
                    <div className="mt-16 flex justify-center">
                        <button className="group relative px-12 py-5 bg-brand-primary text-brand-text-inverted font-mono text-sm font-bold uppercase tracking-wider border-2 border-brand-primary hover:bg-transparent hover:text-brand-primary transition-all duration-300">
                            Load More Articles
                            <div className="absolute inset-0 border-2 border-brand-primary translate-x-0 translate-y-0 group-hover:translate-x-2 group-hover:translate-y-2 transition-all duration-300 -z-10" />
                        </button>
                    </div>
                )}

                {/* No Posts Message */}
                {filteredPosts.length === 0 && (
                    <div className="text-center py-20">
                        <div className="inline-block border-2 border-brand-border px-8 py-12 bg-white">
                            <div className="w-16 h-16 border-2 border-brand-text-muted mx-auto mb-4" />
                            <p className="font-mono text-sm text-brand-text-muted uppercase tracking-wider">
                                No articles found in this category
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
