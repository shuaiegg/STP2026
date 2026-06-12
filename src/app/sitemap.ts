import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';
import { getPageLocales } from '@/lib/i18n/page-availability';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.scaletotop.com';

  let posts: { id: string; slug: string; updatedAt: Date; locale: string; translationGroupId: string | null }[] = [];
  try {
    posts = await prisma.content.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC' },
      select: { id: true, slug: true, updatedAt: true, locale: true, translationGroupId: true },
    });
  } catch {
    // DB unavailable — return static routes only
  }

  // Group posts by translationGroupId
  const translationGroups: Record<string, typeof posts> = {};
  posts.forEach(p => {
    if (p.translationGroupId) {
      if (!translationGroups[p.translationGroupId]) {
        translationGroups[p.translationGroupId] = [];
      }
      translationGroups[p.translationGroupId].push(p);
    }
  });

  // 1. Generate Static Routes
  const staticPaths = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/blog', priority: 0.9, changeFrequency: 'daily' },
    { path: '/pricing', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/tools', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/consultation', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/refund', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/case-studies', priority: 0.8, changeFrequency: 'weekly' },
  ];

  const staticRoutes: MetadataRoute.Sitemap = [];
  staticPaths.forEach(({ path, priority, changeFrequency }) => {
    const locales = getPageLocales(path);
    locales.forEach(locale => {
      const prefix = locale === 'zh' ? '/zh' : '';
      const alternates: Record<string, string> = {};
      locales.forEach(loc => {
        const siblingPrefix = loc === 'zh' ? '/zh' : '';
        alternates[loc] = `${baseUrl}${siblingPrefix}${path}`;
      });

      staticRoutes.push({
        url: `${baseUrl}${prefix}${path}`,
        lastModified: new Date(),
        changeFrequency: changeFrequency as any,
        priority,
        alternates: {
          languages: alternates,
        },
      });
    });
  });

  // 2. Generate Blog Post Routes
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => {
    const currentPrefix = post.locale === 'zh' ? '/zh' : '';
    const alternates: Record<string, string> = {};

    // hreflang 只在翻译对真实存在（≥2 个成员）时输出；自指 alternates 无意义
    const group = post.translationGroupId ? (translationGroups[post.translationGroupId] || []) : [];
    if (group.length > 1) {
      group.forEach(sibling => {
        const siblingPrefix = sibling.locale === 'zh' ? '/zh' : '';
        alternates[sibling.locale] = `${baseUrl}${siblingPrefix}/blog/${sibling.slug}`;
      });
    }

    return {
      url: `${baseUrl}${currentPrefix}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
      ...(Object.keys(alternates).length > 1 && { alternates: { languages: alternates } }),
    };
  });

  return [...staticRoutes, ...postRoutes];
}
