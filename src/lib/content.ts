import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { ContentStatus, Visibility, Content, ContentType } from '@prisma/client';

/** 公共内容缓存 tag —— 发布/编辑文章时 revalidateTag 失效 */
export const PUBLIC_CONTENT_TAG = 'public-content';

export interface ContentFilters {
    status?: ContentStatus;
    visibility?: Visibility;
    categoryId?: string;
    type?: ContentType;
    locale?: string;
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
}

/**
 * Get published content for public pages (cached; busted on publish via PUBLIC_CONTENT_TAG).
 */
export async function getPublishedContent(
    filters?: ContentFilters,
    pagination?: PaginationOptions
) {
    return unstable_cache(
        () => getPublishedContentUncached(filters, pagination),
        ['published-content', JSON.stringify({ filters, pagination })],
        { revalidate: 300, tags: [PUBLIC_CONTENT_TAG] },
    )();
}

async function getPublishedContentUncached(
    filters?: ContentFilters,
    pagination?: PaginationOptions
) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
        status: filters?.status || ContentStatus.PUBLISHED,
        visibility: filters?.visibility || Visibility.PUBLIC,
        // locale 仅在显式传入时过滤（公开页必须显式传，避免静默吞掉另一语言内容）
        ...(filters?.locale && { locale: filters.locale }),
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.type && { type: filters.type }),
    };

    try {
        const [contents, total] = await Promise.all([
            prisma.content.findMany({
                where,
                select: {
                    id: true,
                    type: true,
                    title: true,
                    slug: true,
                    summary: true,
                    status: true,
                    visibility: true,
                    publishedAt: true,
                    readingTime: true,
                    categoryId: true,
                    createdAt: true,
                    updatedAt: true,
                    category: true,
                    coverImage: true,
                    seo: true,
                    author: true,
                },
                orderBy: { publishedAt: 'desc' },
                take: limit,
                skip,
            }),
            prisma.content.count({ where }),
        ]);

        return {
            contents,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('Error in getPublishedContent:', error);
        throw error;
    }
}

/**
 * Get a single published content by slug
 */
export async function getPublishedContentBySlug(slug: string, locale?: string) {
    return unstable_cache(
        () => getPublishedContentBySlugUncached(slug, locale),
        ['published-content-slug', slug, locale ?? 'any'],
        { revalidate: 300, tags: [PUBLIC_CONTENT_TAG] },
    )();
}

async function getPublishedContentBySlugUncached(slug: string, locale?: string) {
    return prisma.content.findFirst({
        where: {
            slug,
            status: ContentStatus.PUBLISHED,
            visibility: Visibility.PUBLIC,
            ...(locale && { locale }),
        },
        include: {
            category: true,
            coverImage: true,
            seo: true,
            author: true,
        },
    });
}

/**
 * Get content by preview token
 */
export async function getContentByPreviewToken(token: string) {
    const previewToken = await prisma.previewToken.findUnique({
        where: { token },
        include: {
            content: {
                include: {
                    category: true,
                    coverImage: true,
                    seo: true,
                },
            },
        },
    });

    if (!previewToken) return null;

    // Check if token is expired
    if (previewToken.expiresAt < new Date()) {
        return null;
    }

    return previewToken.content;
}

/**
 * Get all active categories, optionally filtered by locale
 */
export async function getActiveCategories(options?: { locale?: string }) {
    return unstable_cache(
        () => prisma.category.findMany({
            where: {
                isActive: true,
                ...(options?.locale && { locale: options.locale }),
            },
            orderBy: { order: 'asc' },
        }),
        ['active-categories', options?.locale ?? 'any'],
        { revalidate: 300, tags: [PUBLIC_CONTENT_TAG] },
    )();
}

/**
 * Get category by slug with content count, optionally filtered by locale
 */
export async function getCategoryBySlug(slug: string, locale?: string) {
    const countInclude = {
        _count: {
            select: {
                contents: {
                    where: {
                        status: ContentStatus.PUBLISHED,
                        visibility: Visibility.PUBLIC,
                        ...(locale && { locale }),
                    },
                },
            },
        },
    };

    // slug 已改为按 (locale, slug) 唯一：有 locale 用复合唯一键，否则取首条匹配
    const category = locale
        ? await prisma.category.findUnique({
              where: { locale_slug: { locale, slug } },
              include: countInclude,
          })
        : await prisma.category.findFirst({
              where: { slug },
              include: countInclude,
          });

    return category;
}

/**
 * Get published content by category slug
 */
export async function getContentByCategory(
    categorySlug: string,
    pagination?: PaginationOptions,
    locale?: string
) {
    const category = locale
        ? await prisma.category.findUnique({ where: { locale_slug: { locale, slug: categorySlug } } })
        : await prisma.category.findFirst({ where: { slug: categorySlug } });

    if (!category) return null;

    return getPublishedContent({ categoryId: category.id, locale }, pagination);
}

/**
 * Get related content (same category, excluding current)
 */
export async function getRelatedContent(
    currentSlug: string,
    limit: number = 3,
    locale?: string
) {
    const current = await prisma.content.findUnique({
        where: { slug: currentSlug },
        select: { categoryId: true, locale: true },
    });

    const targetLocale = locale || current?.locale || 'zh';

    if (!current?.categoryId) {
        // Return latest content if no category
        return prisma.content.findMany({
            where: {
                slug: { not: currentSlug },
                status: ContentStatus.PUBLISHED,
                visibility: Visibility.PUBLIC,
                locale: targetLocale,
            },
            include: { category: true, coverImage: true },
            orderBy: { publishedAt: 'desc' },
            take: limit,
        });
    }

    return prisma.content.findMany({
        where: {
            categoryId: current.categoryId,
            slug: { not: currentSlug },
            status: ContentStatus.PUBLISHED,
            visibility: Visibility.PUBLIC,
            locale: targetLocale,
        },
        include: { category: true, coverImage: true },
        orderBy: { publishedAt: 'desc' },
        take: limit,
    });
}
