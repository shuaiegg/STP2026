import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedContentBySlug, getRelatedContent } from '@/lib/content';
import { Badge } from '@/components/ui/Badge';
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
            month: 'long',
            day: 'numeric'
        });
    };

    const coverSrc = post.coverImage?.storageUrl || post.coverImage?.originalUrl || 'https://picsum.photos/seed/placeholder/1200/630';

    // Help remove title if it's already in the markdown as H1 (e.g. # Title)
    const processedContentMd = post.contentMd
        ? post.contentMd.replace(new RegExp(`^\\s*#\\s+${post.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n*`, 'i'), '')
        : '';

    return (
        <article className="pb-24">
            {/* Article Header */}
            <header className="max-w-4xl mx-auto px-6 pt-16 mb-12 text-center">
                <nav className="flex items-center justify-center gap-2 text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-8">
                    <Link href="/" className="hover:text-brand-primary transition-colors">首页</Link>
                    <span className="opacity-30">/</span>
                    <Link href="/blog" className="hover:text-brand-primary transition-colors">博客</Link>
                    <span className="opacity-30">/</span>
                    <span className="text-brand-primary">{post.category?.name}</span>
                </nav>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-text-primary leading-[1.1] mb-8 tracking-tight max-w-4xl mx-auto">
                    {post.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-brand-text-secondary border-b border-brand-border pb-8 max-w-2xl mx-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-brand-text-muted px-2 py-0.5 bg-brand-surface rounded text-[10px] font-bold uppercase tracking-wider">Date</span>
                        <span className="font-semibold text-brand-text-primary">{formatDate(post.publishedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-brand-text-muted px-2 py-0.5 bg-brand-surface rounded text-[10px] font-bold uppercase tracking-wider">Read Time</span>
                        <span className="font-semibold text-brand-text-primary">约 {post.readingTime || 10} min</span>
                    </div>
                </div>
            </header>

            {/* Hero Image */}
            <div className="max-w-5xl mx-auto px-6 mb-20">
                <div className="aspect-[21/9] rounded-3xl overflow-hidden bg-brand-surface shadow-2xl ring-1 ring-brand-border/50">
                    <img src={coverSrc} alt={post.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-1000" />
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-3xl mx-auto px-6 relative">
                {/* Main Content */}
                <div className="prose prose-lg prose-slate max-w-none prose-headings:text-brand-text-primary prose-p:text-brand-text-secondary prose-p:leading-relaxed prose-img:rounded-2xl prose-img:shadow-lg prose-a:text-brand-primary hover:prose-a:text-brand-primary/80 prose-code:text-brand-primary prose-blockquote:border-brand-primary prose-strong:text-brand-text-primary">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            img: ({ node, ...props }) => (
                                <span className="block my-12">
                                    <img
                                        {...props}
                                        className="w-full rounded-2xl shadow-xl ring-1 ring-black/5 mx-auto"
                                        loading="lazy"
                                    />
                                    {props.alt && (
                                        <span className="block text-center text-xs text-brand-text-muted mt-4 font-medium italic underline underline-offset-4 decoration-brand-border">
                                            {props.alt}
                                        </span>
                                    )}
                                </span>
                            ),
                        }}
                    >
                        {processedContentMd}
                    </ReactMarkdown>

                    <div className="mt-16">
                        <CTA
                            variant="inline"
                            title="加入 ScaletoTop 简报"
                            description="每周为您推送最前沿的技术营销策略与实战审计案例。已有 5,000+ 专家订阅。"
                            buttonText="立即订阅"
                        />
                    </div>

                    <div className="my-12 pt-8 border-t border-brand-border flex items-center justify-between">
                        <div className="flex gap-4">
                            <button className="text-brand-text-muted hover:text-brand-primary transition-colors flex items-center gap-1">
                                <span className="text-sm font-bold tracking-tight">SHARE INSIGHT</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-brand-success animate-pulse"></div>
                            <span className="text-[10px] font-bold text-brand-success uppercase tracking-widest">Verified Case Study</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Articles */}
            <section className="bg-brand-surface py-20 mt-16 border-t border-brand-border">
                <div className="max-w-7xl mx-auto px-6">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary mb-12">延伸阅读 / RELATED INSIGHTS</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {relatedPosts.map((p: any) => (
                            <Link key={p.id} href={`/blog/${p.slug}`} className="group block">
                                <div className="flex justify-between items-baseline mb-4 border-b border-brand-border/50 pb-4 group-hover:border-brand-primary transition-colors">
                                    <h4 className="text-xl font-bold text-brand-text-primary group-hover:text-brand-primary transition-colors leading-tight">
                                        {p.title}
                                    </h4>
                                    <span className="text-[10px] font-mono text-brand-text-muted ml-4 whitespace-nowrap">{formatDate(p.publishedAt)}</span>
                                </div>
                                <p className="text-sm text-brand-text-secondary line-clamp-2 leading-relaxed">{p.summary}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </article>
    );
}
