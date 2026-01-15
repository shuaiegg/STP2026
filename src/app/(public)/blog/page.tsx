import React from 'react';
import { getPublishedContent, getActiveCategories } from '@/lib/content';
import BlogListContent from '@/components/blog/BlogListContent';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
    const [{ contents }, categories] = await Promise.all([
        getPublishedContent(),
        getActiveCategories(),
    ]);

    return (
        <BlogListContent
            initialPosts={contents as any}
            categories={categories as any}
        />
    );
}
