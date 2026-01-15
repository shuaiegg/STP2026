import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedContentBySlug, getRelatedContent } from '@/lib/content';
import { Badge } from '@/components/ui/Badge';
import { CTA } from '@/components/CTA';

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

    return (
        <article className="pb-24">
            {/* Article Header */}
            <header className="max-w-3xl mx-auto px-6 pt-16 mb-12">
                <nav className="flex items-center gap-2 text-xs font-bold text-brand-text-muted uppercase tracking-widest mb-8">
                    <Link href="/" className="hover:text-brand-primary transition-colors">首页</Link>
                    <span className="opacity-30">/</span>
                    <Link href="/blog" className="hover:text-brand-primary transition-colors">博客</Link>
                    <span className="opacity-30">/</span>
                    <span className="text-brand-primary">{post.category?.name}</span>
                </nav>

                <h1 className="text-4xl sm:text-5xl font-bold text-brand-text-primary leading-[1.1] mb-8 tracking-tight">
                    {post.title}
                </h1>

                <div className="flex flex-wrap items-center gap-8 text-sm text-brand-text-secondary border-b border-brand-border pb-8">
                    <div className="flex items-center gap-2">
                        <span className="text-brand-text-muted">发布于</span>
                        <span className="font-semibold">{formatDate(post.publishedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-brand-text-muted">阅读预计</span>
                        <span className="font-semibold">约 10 min</span>
                    </div>
                </div>
            </header>

            {/* Hero Image */}
            <div className="max-w-5xl mx-auto px-6 mb-16">
                <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-brand-surface shadow-lg">
                    <img src={coverSrc} alt={post.title} className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 prose prose-slate max-w-none">
                <div
                    className="whitespace-pre-wrap text-brand-text-secondary leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: post.contentMd?.replace(/\n/g, '<br/>') || '' }}
                />

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
