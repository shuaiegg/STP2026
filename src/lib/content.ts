import prisma from '@/lib/prisma';
import { ContentStatus, Visibility, Content } from '@prisma/client';

export interface ContentFilters {
    status?: ContentStatus;
    visibility?: Visibility;
    categoryId?: string;
    type?: 'BLOG' | 'PAGE' | 'COURSE';
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
}

/**
 * Get published content for public pages
 */
export async function getPublishedContent(
    filters?: ContentFilters,
    pagination?: PaginationOptions
) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
        status: ContentStatus.PUBLISHED,
        visibility: Visibility.PUBLIC,
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.type && { type: filters.type }),
    };

    const [contents, total] = await Promise.all([
        prisma.content.findMany({
            where,
            include: {
                category: true,
                coverImage: true,
                seo: true,
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
}

/**
 * Get a single published content by slug
 */
export async function getPublishedContentBySlug(slug: string) {
    return prisma.content.findFirst({
        where: {
            slug,
            status: ContentStatus.PUBLISHED,
            visibility: Visibility.PUBLIC,
        },
        include: {
            category: true,
            coverImage: true,
            seo: true,
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
 * Generate a preview token for content
 */
export async function generatePreviewToken(
    contentId: string,
    expiresInHours: number = 24
): Promise<string> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    await prisma.previewToken.create({
        data: {
            token,
            contentId,
            expiresAt,
        },
    });

    return token;
}

/**
 * Get all active categories
 */
export async function getActiveCategories() {
    return prisma.category.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
    });
}

/**
 * Get category by slug with content count
 */
export async function getCategoryBySlug(slug: string) {
    const category = await prisma.category.findUnique({
        where: { slug },
        include: {
            _count: {
                select: {
                    contents: {
                        where: {
                            status: ContentStatus.PUBLISHED,
                            visibility: Visibility.PUBLIC,
                        },
                    },
                },
            },
        },
    });

    return category;
}

/**
 * Get published content by category slug
 */
export async function getContentByCategory(
    categorySlug: string,
    pagination?: PaginationOptions
) {
    const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
    });

    if (!category) return null;

    return getPublishedContent({ categoryId: category.id }, pagination);
}

/**
 * Publish content (change status from SYNCED/DRAFT to PUBLISHED)
 */
export async function publishContent(contentId: string) {
    return prisma.content.update({
        where: { id: contentId },
        data: {
            status: ContentStatus.PUBLISHED,
            publishedAt: new Date(),
        },
    });
}

/**
 * Archive content (soft delete)
 */
export async function archiveContent(contentId: string) {
    return prisma.content.update({
        where: { id: contentId },
        data: { status: ContentStatus.ARCHIVED },
    });
}

/**
 * Get related content (same category, excluding current)
 */
export async function getRelatedContent(
    currentSlug: string,
    limit: number = 3
) {
    const current = await prisma.content.findUnique({
        where: { slug: currentSlug },
        select: { categoryId: true },
    });

    if (!current?.categoryId) {
        // Return latest content if no category
        return prisma.content.findMany({
            where: {
                slug: { not: currentSlug },
                status: ContentStatus.PUBLISHED,
                visibility: Visibility.PUBLIC,
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
        },
        include: { category: true, coverImage: true },
        orderBy: { publishedAt: 'desc' },
        take: limit,
    });
}
