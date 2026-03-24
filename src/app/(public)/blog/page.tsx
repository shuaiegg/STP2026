import React from 'react';
import { Metadata } from 'next';
import { getPublishedContent, getActiveCategories } from '@/lib/content';
import BlogListContent from '@/components/blog/BlogListContent';

export const metadata: Metadata = {
  title: '出海营销实战博客 | ScaletoTop',
  description: '深度拆解出海企业获客方法：广告投放策略、SEO 内容矩阵、自动化工具应用，助你系统化提升海外业务增长。',
  alternates: {
    canonical: 'https://www.scaletotop.com/blog',
  },
  openGraph: {
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'ScaletoTop Blog',
      },
    ],
  },
};

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
