import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getContentByCategory } from '@/lib/content';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;

    const [category, contentResult] = await Promise.all([
        getCategoryBySlug(slug),
        getContentByCategory(slug),
    ]);

    if (!category) {
        return notFound();
    }

    const posts = contentResult?.contents || [];

    const formatDate = (date: Date | null) => {
        if (!date) return 'Not Published';
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-16">
            <header className="mb-16 max-w-3xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-1.5 h-10 bg-brand-primary rounded-full"></div>
                    <h1 className="text-4xl font-bold text-brand-text-primary tracking-tight">{category.name}</h1>
                </div>
                <p className="text-xl text-brand-text-secondary leading-relaxed">
                    {category.description}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post: any) => {
                    const coverSrc = post.coverImage?.storageUrl || post.coverImage?.originalUrl || 'https://picsum.photos/seed/placeholder/1200/630';
                    return (
                        <Link key={post.id} href={`/blog/${post.slug}`}>
                            <Card className="h-full flex flex-col group">
                                <div className="aspect-[16/10] bg-brand-surface overflow-hidden">
                                    <img src={coverSrc} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-brand-text-primary mb-3 group-hover:text-brand-primary transition-colors">
                                        {post.title}
                                    </h3>
                                    <p className="text-sm text-brand-text-secondary mb-4 line-clamp-2 leading-relaxed">
                                        {post.summary}
                                    </p>
                                    <div className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">
                                        {formatDate(post.publishedAt)}
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-20 p-12 bg-brand-primary rounded-2xl text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-brand-primary/10">
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold mb-2">掌握规模化 {category.name} 技术</h3>
                    <p className="text-brand-primary-muted">领取我们的内部实战框架，专为高增长工程团队设计。</p>
                </div>
                <button className="bg-white text-brand-primary px-8 py-3 rounded-lg font-bold hover:bg-brand-primary-muted transition-colors">
                    立即免费获取
                </button>
            </div>
        </div>
    );
}
