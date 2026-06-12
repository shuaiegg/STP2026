export const dynamic = 'force-dynamic';

import React from 'react';
import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPublishedContent, getActiveCategories } from '@/lib/content';
import { localeCanonical, BASE_URL } from '@/lib/seo/locale-metadata';
import BlogListContent from '@/components/blog/BlogListContent';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog.meta' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localeCanonical(locale, '/blog'),
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
}

import { JsonLd } from '@/components/seo/JsonLd';

export default async function BlogPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('blog');
    const [{ contents }, categories] = await Promise.all([
        getPublishedContent(),
        getActiveCategories(),
    ]);

    const baseUrl = BASE_URL;
    const blogListSchema = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "ScaletoTop Blog",
        "description": t('schemaDescription'),
        "inLanguage": locale === 'zh' ? 'zh-Hans' : 'en',
        "url": localeCanonical(locale, '/blog'),
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
