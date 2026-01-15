import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedContentBySlug, getRelatedContent } from '@/lib/content';
import { CTA } from '@/components/CTA';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const dynamic = 'force-dynamic';

interface BlogPostProps {
    params: Promise<{ slug: string }>;
}

export default async function BlogPost({ params }: BlogPostProps) {
    const { slug } = await params;
    const post = await getPublishedContentBySlug(slug);

    if (!post) {
        return notFound();
    }

    const relatedPosts = await getRelatedContent(slug);

    const formatDate = (date: Date | null) => {
        if (!date) return 'Not Published';
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const coverSrc = post.coverImage?.storageUrl || post.coverImage?.originalUrl || 'https://picsum.photos/seed/placeholder/1200/630';

    // Help remove title if it's already in the markdown as H1 (e.g. # Title)
    const processedContentMd = post.contentMd
        ? post.contentMd.replace(new RegExp(`^\\s*#\\s+${post.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n*`, 'i'), '')
        : '';

    return (
        <article className="relative pb-24">
            {/* Technical Grid Background */}
            <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />

            {/* Hero Section - Full Width with Overlay */}
            <div className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden border-b-4 border-brand-primary">
                {/* Hero Image */}
                <div className="absolute inset-0">
                    <img
                        src={coverSrc}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                </div>

                {/* Hero Content - Overlaid */}
                <div className="relative h-full flex flex-col justify-end max-w-[1400px] mx-auto px-6 pb-16">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 mb-8 animate-slide-in-up stagger-1">
                        <Link href="/" className="font-mono text-xs uppercase tracking-wider text-white/60 hover:text-white transition-colors">
                            Home
                        </Link>
                        <span className="text-white/40">/</span>
                        <Link href="/blog" className="font-mono text-xs uppercase tracking-wider text-white/60 hover:text-white transition-colors">
                            Blog
                        </Link>
                        {post.category && (
                            <>
                                <span className="text-white/40">/</span>
                                <span className="font-mono text-xs uppercase tracking-wider text-brand-secondary">
                                    {post.category.name}
                                </span>
                            </>
                        )}
                    </nav>

                    {/* Title - Brutalist Typography */}
                    <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-8 leading-[1.05] tracking-tight max-w-5xl animate-slide-in-up stagger-2">
                        {post.title}
                    </h1>

                    {/* Meta Info - Technical Style */}
                    <div className="flex flex-wrap items-center gap-6 animate-slide-in-up stagger-3">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-brand-secondary" />
                            <div>
                                <div className="font-mono text-xs text-white/60 uppercase tracking-wider mb-1">Published</div>
                                <div className="font-mono text-sm font-bold text-white">{formatDate(post.publishedAt)}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-brand-accent" />
                            <div>
                                <div className="font-mono text-xs text-white/60 uppercase tracking-wider mb-1">Reading Time</div>
                                <div className="font-mono text-sm font-bold text-white">{post.readingTime || 10} Minutes</div>
                            </div>
                        </div>

                        {post.category && (
                            <div className="ml-auto">
                                <div className="bg-brand-secondary text-brand-primary px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border-2 border-brand-primary">
                                    {post.category.name}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area - Editorial Layout */}
            <div className="relative max-w-[1400px] mx-auto px-6 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Sidebar - Table of Contents / Meta */}
                    <aside className="lg:col-span-3 lg:sticky lg:top-24 lg:self-start">
                        <div className="border-2 border-brand-border bg-white p-6 space-y-6">
                            {/* Article Info */}
                            <div>
                                <h3 className="font-mono text-xs uppercase tracking-wider text-brand-text-muted mb-4">
                                    Article Info
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <div className="font-mono text-xs text-brand-text-muted mb-1">Date</div>
                                        <div className="font-medium text-brand-text-primary">{formatDate(post.publishedAt)}</div>
                                    </div>
                                    <div>
                                        <div className="font-mono text-xs text-brand-text-muted mb-1">Read Time</div>
                                        <div className="font-medium text-brand-text-primary">{post.readingTime || 10} min</div>
                                    </div>
                                    {post.category && (
                                        <div>
                                            <div className="font-mono text-xs text-brand-text-muted mb-1">Category</div>
                                            <div className="font-medium text-brand-text-primary">{post.category.name}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Share */}
                            <div className="pt-6 border-t-2 border-brand-border">
                                <h3 className="font-mono text-xs uppercase tracking-wider text-brand-text-muted mb-4">
                                    Share
                                </h3>
                                <div className="flex gap-2">
                                    <button className="w-10 h-10 border-2 border-brand-border hover:border-brand-primary hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                    </button>
                                    <button className="w-10 h-10 border-2 border-brand-border hover:border-brand-primary hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                                    </button>
                                    <button className="w-10 h-10 border-2 border-brand-border hover:border-brand-primary hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Verified Badge */}
                            <div className="pt-6 border-t-2 border-brand-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-brand-secondary animate-pulse" />
                                    <span className="font-mono text-xs uppercase tracking-wider text-brand-success font-bold">
                                        Verified
                                    </span>
                                </div>
                                <p className="text-xs text-brand-text-muted">
                                    Content verified by ScaletoTop technical team
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="lg:col-span-9">
                        <div className="prose prose-lg max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    img: ({ node, ...props }) => (
                                        <figure className="my-12 not-prose">
                                            <div className="border-2 border-brand-border overflow-hidden">
                                                <img
                                                    {...props}
                                                    className="w-full"
                                                    loading="lazy"
                                                />
                                            </div>
                                            {props.alt && (
                                                <figcaption className="mt-4 text-center">
                                                    <span className="inline-block font-mono text-xs text-brand-text-muted uppercase tracking-wider px-3 py-1 border border-brand-border bg-brand-surface">
                                                        {props.alt}
                                                    </span>
                                                </figcaption>
                                            )}
                                        </figure>
                                    ),
                                }}
                            >
                                {processedContentMd}
                            </ReactMarkdown>

                            {/* CTA Section */}
                            <div className="not-prose my-16">
                                <div className="border-4 border-brand-primary bg-brand-secondary-muted p-8 relative">
                                    <div className="absolute top-4 right-4">
                                        <div className="w-12 h-12 border-2 border-brand-primary bg-white" />
                                    </div>
                                    <CTA
                                        variant="inline"
                                        title="加入 ScaletoTop 简报"
                                        description="每周为您推送最前沿的技术营销策略与实战审计案例。已有 5,000+ 专家订阅。"
                                        buttonText="立即订阅"
                                    />
                                </div>
                            </div>

                            {/* Article Footer */}
                            <div className="not-prose my-12 pt-8 border-t-4 border-brand-primary">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-brand-secondary animate-pulse" />
                                        <span className="font-mono text-xs font-bold text-brand-success uppercase tracking-wider">
                                            Case Study Verified
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 border-2 border-brand-border hover:border-brand-primary font-mono text-xs font-bold uppercase tracking-wider transition-all">
                                            Share
                                        </button>
                                        <button className="px-4 py-2 border-2 border-brand-border hover:border-brand-primary font-mono text-xs font-bold uppercase tracking-wider transition-all">
                                            Bookmark
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Articles - Bold Section */}
            <section className="relative border-t-4 border-brand-primary bg-brand-surface py-20">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-brand-accent" />
                            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-brand-text-muted">
                                Related Insights / 延伸阅读
                            </h3>
                        </div>
                        <h2 className="font-display text-4xl sm:text-5xl font-bold text-brand-text-primary">
                            Continue Reading
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {relatedPosts.map((p: any, index: number) => {
                            const relatedCover = p.coverImage?.storageUrl || p.coverImage?.originalUrl || 'https://picsum.photos/seed/placeholder/1200/630';
                            return (
                                <Link
                                    key={p.id}
                                    href={`/blog/${p.slug}`}
                                    className="group block border-2 border-brand-border bg-white hover:border-brand-primary transition-all duration-300"
                                >
                                    <div className="aspect-[16/9] overflow-hidden bg-brand-surface-alt border-b-2 border-brand-border">
                                        <img
                                            src={relatedCover}
                                            alt={p.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="p-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="font-mono text-xs text-brand-text-muted">
                                                {formatDate(p.publishedAt)}
                                            </span>
                                            <div className="flex-1 h-px bg-brand-border" />
                                            <span className="font-mono text-xs text-brand-text-muted">
                                                {p.readingTime || 10} MIN
                                            </span>
                                        </div>
                                        <h4 className="font-display text-xl font-bold text-brand-text-primary group-hover:text-brand-secondary mb-3 leading-tight transition-colors">
                                            {p.title}
                                        </h4>
                                        {p.summary && (
                                            <p className="text-sm text-brand-text-secondary line-clamp-2 leading-relaxed">
                                                {p.summary}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>
        </article>
    );
}
