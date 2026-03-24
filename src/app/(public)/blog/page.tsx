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

import { JsonLd } from '@/components/seo/JsonLd';

export default async function BlogPage() {
    const [{ contents }, categories] = await Promise.all([
        getPublishedContent(),
        getActiveCategories(),
    ]);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.scaletotop.com';
    const blogListSchema = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "ScaletoTop Blog",
        "description": "出海营销实战博客：深度拆解出海企业获客方法。",
        "url": `${baseUrl}/blog`,
        "publisher": {
            "@type": "Organization",
            "name": "ScaletoTop",
            "logo": {
                "@type": "ImageObject",
                "url": `${baseUrl}/logo-512.png`,
                "width": 512,
                "height": 512
            }
        }
    };

    return (
        <>
            <JsonLd data={blogListSchema} />
            <BlogListContent
                initialPosts={contents as any}
                categories={categories as any}
            />
        </>
    );
}
