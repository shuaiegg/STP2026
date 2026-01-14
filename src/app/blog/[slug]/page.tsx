"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MOCK_POSTS } from '@/constants';
import { Badge } from '@/components/ui/Badge';
import { CTA } from '@/components/CTA';

export default function BlogPost() {
    const params = useParams();
    const slug = params.slug as string;
    const post = MOCK_POSTS.find(p => p.slug === slug);

    // Scroll to top not strictly necessary with Next.js App Router navigation, but keeping if desired behavior differs

    if (!post) return <div className="p-20 text-center">文章不存在</div>;

    return (
        <article className="pb-24">
            {/* Article Header */}
            <header className="max-w-3xl mx-auto px-6 pt-16 mb-12">
                <nav className="flex items-center gap-2 text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-8">
                    <Link href="/" className="hover:text-brand-primary transition-colors">首页</Link>
                    <span className="opacity-30">/</span>
                    <Link href="/blog" className="hover:text-brand-primary transition-colors">博客</Link>
                    <span className="opacity-30">/</span>
                    <span className="text-brand-primary">{post.category}</span>
                </nav>

                <h1 className="text-4xl sm:text-5xl font-bold text-brand-text-primary leading-[1.1] mb-8 tracking-tight">
                    {post.title}
                </h1>

                <div className="flex flex-wrap items-center gap-8 text-sm text-brand-text-secondary border-b border-brand-border pb-8">
                    <div className="flex items-center gap-2">
                        <span className="text-brand-text-muted">发布于</span>
                        <span className="font-semibold">{post.publishedAt}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-brand-text-muted">阅读预计</span>
                        <span className="font-semibold">{post.readTime}</span>
                    </div>
                </div>
            </header>

            {/* Hero Image */}
            <div className="max-w-5xl mx-auto px-6 mb-16">
                <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-brand-surface shadow-lg">
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 prose">
                <div dangerouslySetInnerHTML={{ __html: post.content?.replace(/\n/g, '<br/>') || '' }} />

                <CTA
                    variant="inline"
                    title="加入 ScaletoTop 简报"
                    description="每周为您推送最前沿的技术营销策略与实战审计案例。已有 5,000+ 专家订阅。"
                    buttonText="立即订阅"
                />

                <div className="my-12 pt-8 border-t border-brand-border flex items-center justify-between">
                    <div className="flex gap-4">
                        <button className="text-brand-text-muted hover:text-brand-primary transition-colors flex items-center gap-1">
                            <span className="text-sm font-bold">分享文章</span>
                        </button>
                    </div>
                    <Badge variant="success">已验证实战案例</Badge>
                </div>
            </div>

            {/* Related Articles */}
            <section className="bg-brand-surface py-20 mt-16 border-t border-brand-border">
                <div className="max-w-7xl mx-auto px-6">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary mb-12">延伸阅读 / RELATED INSIGHTS</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {MOCK_POSTS.filter(p => p.slug !== slug).slice(0, 2).map(p => (
                            <Link key={p.slug} href={`/blog/${p.slug}`} className="group block">
                                <div className="flex justify-between items-baseline mb-4 border-b border-brand-border/50 pb-4 group-hover:border-brand-primary transition-colors">
                                    <h4 className="text-xl font-bold text-brand-text-primary group-hover:text-brand-primary transition-colors leading-tight">
                                        {p.title}
                                    </h4>
                                    <span className="text-[10px] font-mono text-brand-text-muted ml-4 whitespace-nowrap">{p.publishedAt}</span>
                                </div>
                                <p className="text-sm text-brand-text-secondary line-clamp-2 leading-relaxed">{p.excerpt}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </article>
    );
}
