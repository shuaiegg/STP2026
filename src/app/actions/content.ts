'use server';

import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ContentStatus } from '@prisma/client';
import { PUBLIC_CONTENT_TAG } from '@/lib/content';
import { captureServerEvent } from '@/lib/analytics/posthog-server';
import { EVENTS, daysSinceSignup } from '@/lib/analytics/events';

/**
 * Centrally manage revalidation for all paths affected by a content change.
 * Handles locale awareness to ensure both en and zh paths are refreshed.
 */
async function revalidateContentPaths(content: { slug: string, locale: string, category?: { slug: string } | null }) {
    // 1. Blog listing pages (always refresh both locales)
    revalidatePath('/blog');
    revalidatePath('/zh/blog');

    // 2. Article detail page (specific locale)
    const detailPath = content.locale === 'en' ? `/blog/${content.slug}` : `/zh/blog/${content.slug}`;
    revalidatePath(detailPath);

    // 3. Homepages (featured sections)
    revalidatePath('/');
    revalidatePath('/zh');

    // 4. Category page
    if (content.category?.slug) {
        const categoryPath = content.locale === 'en' 
            ? `/blog/category/${content.category.slug}` 
            : `/zh/blog/category/${content.category.slug}`;
        revalidatePath(categoryPath);
    }

    // 5. Sitemap
    revalidatePath('/sitemap.xml');

    // 6. Bust the cached data layer (getPublishedContent / categories / by-slug)
    revalidateTag(PUBLIC_CONTENT_TAG, 'max');
}

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.scaletotop.com').replace(/\/$/, '');

/**
 * 内容飞轮 ④→⑤：博客发布时自动注册/更新 TrackedArticle，进入引用检测队列。
 * - url 用全站同源 BASE_URL（含 www），否则与 SERP 实际收录 URL 不匹配
 * - status 用 'PENDING'：cron/verify 只拾取 PENDING/CHECKING，写 PUBLISHED 会被漏掉
 * - url 自然键查重，幂等
 */
async function upsertTrackedArticleFromContent(content: {
    id: string;
    title: string;
    summary: string | null;
    slug: string;
    locale: string;
    contentMd: string;
    seo?: { keywords: string[] } | null;
}) {
    const keywords = content.seo?.keywords?.length ? content.seo.keywords : [content.title];
    const url = content.locale === 'en'
        ? `${BASE_URL}/blog/${content.slug}`
        : `${BASE_URL}/zh/blog/${content.slug}`;

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
    if (!adminUser) return;

    const existing = await prisma.trackedArticle.findFirst({ where: { url } });
    if (existing) {
        // 内容已更新 → 重置为 PENDING 并清零计数，让 cron 重新核验
        await prisma.trackedArticle.update({
            where: { id: existing.id },
            data: {
                title: content.title,
                summary: content.summary || undefined,
                keywords,
                optimizedContent: content.contentMd || '',
                status: 'PENDING',
                checkCount: 0,
            },
        });
    } else {
        await prisma.trackedArticle.create({
            data: {
                userId: adminUser.id,
                title: content.title,
                summary: content.summary || undefined,
                keywords,
                optimizedContent: content.contentMd || '',
                url,
                status: 'PENDING',
            },
        });
    }

    // 关联的 PlannedArticle → COMPLETED
    const planned = await prisma.plannedArticle.findFirst({ where: { articleId: content.id } });
    if (planned) {
        await prisma.plannedArticle.update({ where: { id: planned.id }, data: { status: 'COMPLETED' } });
    }
}

export async function updateContentMetadata(id: string, data: {
    title?: string;
    slug?: string;
    summary?: string;
    contentMd?: string;
    locale?: string;
    translationGroupId?: string | null;
    categoryId?: string | null;
    authorId?: string | null;
    coverImageId?: string | null;
    status?: ContentStatus;
}) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || !['ADMIN', 'EDITOR'].includes((session.user as any).role)) {
            return { success: false, error: '权限不足' };
        }

        // Fetch current state for redirect logic and revalidation
        const current = await prisma.content.findUnique({
            where: { id },
            include: { category: true, seo: true }
        });

        if (!current) throw new Error('Content not found');

        // 1. If slug is changing for a PUBLISHED article, create a Redirect
        if (data.slug && current.status === 'PUBLISHED' && current.slug !== data.slug) {
            const oldPath = current.locale === 'en' ? `/blog/${current.slug}` : `/zh/blog/${current.slug}`;
            const newPath = current.locale === 'en' ? `/blog/${data.slug}` : `/zh/blog/${data.slug}`;

            await prisma.$transaction([
                // 防环：新路径现在重新生效，删除任何指向它的旧重定向（如 A→B 后又 B→A）
                prisma.redirect.deleteMany({ where: { fromPath: newPath } }),
                prisma.redirect.upsert({
                    where: { fromPath: oldPath },
                    update: { toPath: newPath, statusCode: 301 },
                    create: { fromPath: oldPath, toPath: newPath, statusCode: 301 },
                }),
            ]);
        }

        // 发布转换：草稿经 saveToBlogDraft 默认 visibility=PRIVATE，发布时必须置 PUBLIC，
        // 否则前台查询（要 PUBLISHED+PUBLIC）查不到 → 404。同时补 publishedAt。
        const isPublishing = data.status === 'PUBLISHED' && current.status !== 'PUBLISHED';

        // 2. Update local database
        const updated = await prisma.content.update({
            where: { id },
            data: {
                title: data.title,
                slug: data.slug,
                summary: data.summary,
                contentMd: data.contentMd,
                locale: data.locale,
                translationGroupId: data.translationGroupId,
                categoryId: data.categoryId,
                authorId: data.authorId,
                coverImageId: data.coverImageId,
                status: data.status,
                ...(isPublishing && {
                    visibility: 'PUBLIC',
                    publishedAt: current.publishedAt ?? new Date(),
                }),
                updatedAt: new Date()
            },
            include: { category: true, seo: true }
        });

        // 2.5. Content Flywheel ④→⑤：博客首次发布时自动注册引用追踪
        if (current.status !== 'PUBLISHED' && data.status === 'PUBLISHED' && updated.type === 'BLOG') {
            await upsertTrackedArticleFromContent(updated);
        }

        // Activation funnel: first publish event (de-dup via firstMeaningfulActionAt)
        if (isPublishing) {
            const sessionUser = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { firstMeaningfulActionAt: true, createdAt: true },
            });
            if (sessionUser && !sessionUser.firstMeaningfulActionAt) {
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { firstMeaningfulActionAt: new Date() },
                });
                captureServerEvent(session.user.id, EVENTS.FIRST_MEANINGFUL_ACTION_COMPLETED, {
                    action_type: 'published',
                    days_since_signup: daysSinceSignup(sessionUser),
                    credits_spent: 0,
                });
            }
        }

        // 3. Revalidate affected paths
        await revalidateContentPaths(updated);
        revalidatePath(`/dashboard/admin/content/${id}`);
        revalidatePath('/dashboard/admin/content');

        return { success: true };
    } catch (error) {
        console.error('Failed to update content metadata:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Update or create SEO metadata for a content item
 */
export async function updateSeoMetadata(contentId: string, data: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    ogImageId?: string;
    // New SEO/GEO fields
    keywords?: string[];
    schemaJson?: string;
    geoScore?: number;
    snippetLinkedIn?: string;
    snippetReddit?: string;
    snippetTwitter?: string;
    suggestedLinks?: string[];
}) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || !['ADMIN', 'EDITOR'].includes((session.user as any).role)) {
            return { success: false, error: '权限不足' };
        }

        // Check if content exists
        const content = await prisma.content.findUnique({
            where: { id: contentId },
            select: { id: true, slug: true }
        });

        if (!content) {
            return { success: false, error: 'Content not found' };
        }

        // Upsert SeoMeta (create if not exists, update if exists)
        await prisma.seoMeta.upsert({
            where: { contentId },
            create: {
                contentId,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                canonicalUrl: data.canonicalUrl,
                noIndex: data.noIndex ?? false,
                ogImageId: data.ogImageId,
                keywords: data.keywords ?? [],
                schemaJson: data.schemaJson,
                geoScore: data.geoScore,
                geoAuditedAt: data.geoScore ? new Date() : undefined,
                snippetLinkedIn: data.snippetLinkedIn,
                snippetReddit: data.snippetReddit,
                snippetTwitter: data.snippetTwitter,
                suggestedLinks: data.suggestedLinks ?? [],
            },
            update: {
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                canonicalUrl: data.canonicalUrl,
                noIndex: data.noIndex,
                ogImageId: data.ogImageId,
                keywords: data.keywords,
                schemaJson: data.schemaJson,
                geoScore: data.geoScore,
                geoAuditedAt: data.geoScore ? new Date() : undefined,
                snippetLinkedIn: data.snippetLinkedIn,
                snippetReddit: data.snippetReddit,
                snippetTwitter: data.snippetTwitter,
                suggestedLinks: data.suggestedLinks,
            }
        });

        // Revalidate paths
        await revalidateContentPaths(content as any);
        revalidatePath(`/dashboard/admin/content/${contentId}`);
        revalidatePath('/dashboard/admin/content');

        return { success: true };
    } catch (error) {
        console.error('Failed to update SEO metadata:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Save complete SEO/GEO optimization data (from AI optimization)
 */
export async function saveSeoOptimizationData(contentId: string, data: {
    // Basic SEO
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    // Schema
    schemaJson: string;
    // Distribution
    snippetLinkedIn?: string;
    snippetReddit?: string;
    snippetTwitter?: string;
    // Audit
    geoScore: number;
    suggestedLinks?: string[];
    // Optionally update content
    contentMd?: string;
}) {
    try {
        const content = await prisma.content.findUnique({
            where: { id: contentId },
            select: { id: true, slug: true }
        });

        if (!content) {
            return { success: false, error: 'Content not found' };
        }

        // Update content if provided
        if (data.contentMd) {
            await prisma.content.update({
                where: { id: contentId },
                data: {
                    contentMd: data.contentMd,
                    updatedAt: new Date()
                }
            });
        }

        // Upsert all SEO data
        await prisma.seoMeta.upsert({
            where: { contentId },
            create: {
                contentId,
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                keywords: data.keywords,
                schemaJson: data.schemaJson,
                geoScore: data.geoScore,
                geoAuditedAt: new Date(),
                snippetLinkedIn: data.snippetLinkedIn,
                snippetReddit: data.snippetReddit,
                snippetTwitter: data.snippetTwitter,
                suggestedLinks: data.suggestedLinks ?? [],
            },
            update: {
                metaTitle: data.metaTitle,
                metaDescription: data.metaDescription,
                keywords: data.keywords,
                schemaJson: data.schemaJson,
                geoScore: data.geoScore,
                geoAuditedAt: new Date(),
                snippetLinkedIn: data.snippetLinkedIn,
                snippetReddit: data.snippetReddit,
                snippetTwitter: data.snippetTwitter,
                suggestedLinks: data.suggestedLinks,
            }
        });

        // Revalidate
        await revalidateContentPaths(content as any);
        revalidatePath(`/dashboard/admin/content/${contentId}`);
        revalidatePath('/dashboard/admin/content');

        return { success: true };
    } catch (error) {
        console.error('Failed to save SEO optimization data:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Get content with SEO metadata for editing
 */
export async function getContentForSeoEdit(contentId: string) {
    try {
        const content = await prisma.content.findUnique({
            where: { id: contentId },
            include: {
                seo: true,
                category: true,
                coverImage: true,
            }
        });

        if (!content) {
            return { success: false, error: 'Content not found' };
        }

        return { success: true, data: content };
    } catch (error) {
        console.error('Failed to get content for SEO edit:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Analyze content and return SEO/GEO audit results
 */
export async function analyzeContentSeo(contentId: string) {
    try {
        const content = await prisma.content.findUnique({
            where: { id: contentId },
            select: {
                title: true,
                summary: true,
                contentMd: true,
                seo: true,
            }
        });

        if (!content) {
            return { success: false, error: 'Content not found' };
        }

        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;

        const markdown = content.contentMd || '';
        const title = content.seo?.metaTitle || content.title || '';
        const description = content.seo?.metaDescription || content.summary || '';

        // Title analysis
        if (title.length < 30) {
            issues.push('标题过短，建议 50-60 字符');
            score -= 10;
        } else if (title.length > 60) {
            suggestions.push(`标题过长（${title.length} 字符），可能被截断`);
            score -= 5;
        }

        // Description analysis
        if (description.length < 80) {
            issues.push('描述过短，建议 120-160 字符');
            score -= 10;
        } else if (description.length > 160) {
            suggestions.push(`描述过长（${description.length} 字符），可能被截断`);
            score -= 5;
        }

        // Heading structure
        const h1Count = (markdown.match(/^#\s+/gm) || []).length;
        const h2Count = (markdown.match(/^##\s+/gm) || []).length;

        if (h1Count === 0) {
            issues.push('缺少 H1 标题');
            score -= 10;
        } else if (h1Count > 1) {
            issues.push(`存在 ${h1Count} 个 H1 标题，应只有 1 个`);
            score -= 5;
        }

        if (h2Count < 3) {
            suggestions.push('H2 标题数量偏少，建议 3-7 个主要章节');
            score -= 5;
        }

        // First paragraph check (Direct Answer)
        const paragraphs = markdown.split('\n\n').filter(p => p.trim() && !p.startsWith('#'));
        if (paragraphs.length > 0) {
            const firstPara = paragraphs[0];
            if (firstPara.length > 200) {
                suggestions.push('首段过长，AI 难以快速提取核心答案，建议精简至 50-60 字');
                score -= 10;
            }
        }

        // Lists and tables
        const hasList = /^[-*]\s+/m.test(markdown);
        const hasTable = /\|.*\|/.test(markdown);

        if (!hasList && !hasTable) {
            suggestions.push('建议添加列表或表格增强结构化');
            score -= 5;
        }

        // Internal links
        const internalLinks = (markdown.match(/\[([^\]]+)\]\((?!http)/g) || []).length;
        if (internalLinks < 3) {
            suggestions.push(`内链数量偏少（${internalLinks}），建议 3-5 个相关内链`);
            score -= 5;
        }

        return {
            success: true,
            data: {
                score: Math.max(0, score),
                passed: score >= 70,
                issues,
                suggestions,
                stats: {
                    titleLength: title.length,
                    descriptionLength: description.length,
                    h1Count,
                    h2Count,
                    internalLinks,
                    hasList,
                    hasTable,
                }
            }
        };
    } catch (error) {
        console.error('Failed to analyze content SEO:', error);
        return { success: false, error: String(error) };
    }
}

export async function associateTranslation(articleId1: string, articleId2: string) {
    try {
        const [a1, a2] = await Promise.all([
            prisma.content.findUnique({ where: { id: articleId1 }, select: { translationGroupId: true } }),
            prisma.content.findUnique({ where: { id: articleId2 }, select: { translationGroupId: true } })
        ]);

        if (!a1 || !a2) {
            return { success: false, error: 'One or both articles not found' };
        }

        const groupId = a1.translationGroupId || a2.translationGroupId || `tg-${Math.random().toString(36).substring(2, 11)}`;

        await prisma.content.updateMany({
            where: { id: { in: [articleId1, articleId2] } },
            data: { translationGroupId: groupId }
        });

        // Revalidate both articles
        const [fullA1, fullA2] = await Promise.all([
            prisma.content.findUnique({ where: { id: articleId1 }, include: { category: true } }),
            prisma.content.findUnique({ where: { id: articleId2 }, include: { category: true } })
        ]);
        
        if (fullA1) await revalidateContentPaths(fullA1);
        if (fullA2) await revalidateContentPaths(fullA2);

        revalidatePath('/dashboard/admin/content');
        revalidatePath(`/dashboard/admin/content/${articleId1}`);
        revalidatePath(`/dashboard/admin/content/${articleId2}`);

        return { success: true, groupId };
    } catch (error) {
        console.error('Failed to associate translation:', error);
        return { success: false, error: String(error) };
    }
}

export async function dissociateTranslation(articleId: string) {
    try {
        const updated = await prisma.content.update({
            where: { id: articleId },
            data: { translationGroupId: null },
            include: { category: true }
        });

        await revalidateContentPaths(updated);
        revalidatePath('/dashboard/admin/content');
        revalidatePath(`/dashboard/admin/content/${articleId}`);

        return { success: true };
    } catch (error) {
        console.error('Failed to dissociate translation:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Create a Category (admin content editor inline-create).
 * slug 自动 ASCII slugify，按 (locale, slug) 唯一。
 */
export async function createCategory(name: string, locale: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || !['ADMIN', 'EDITOR'].includes((session.user as any).role)) {
            return { success: false, error: '权限不足' };
        }

        const trimmed = name.trim();
        if (!trimmed) return { success: false, error: '分类名不能为空' };

        const baseSlug = trimmed
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60) || `cat-${Date.now().toString(36)}`;

        // 同 locale 下 slug 冲突则加后缀
        let slug = baseSlug;
        if (await prisma.category.findUnique({ where: { locale_slug: { locale, slug } } })) {
            slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
        }

        const category = await prisma.category.create({
            data: { name: trimmed, slug, locale },
            select: { id: true, name: true },
        });
        revalidatePath('/dashboard/admin/content');
        return { success: true, category };
    } catch (error) {
        console.error('Failed to create category:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Create an Author (admin content editor inline-create).
 */
export async function createAuthor(name: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session || !['ADMIN', 'EDITOR'].includes((session.user as any).role)) {
            return { success: false, error: '权限不足' };
        }

        const trimmed = name.trim();
        if (!trimmed) return { success: false, error: '作者名不能为空' };

        const author = await prisma.author.create({
            data: { name: trimmed },
            select: { id: true, name: true },
        });
        revalidatePath('/dashboard/admin/content');
        return { success: true, author };
    } catch (error) {
        console.error('Failed to create author:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Delete content and clean up related entities (TrackedArticle, PlannedArticle, Redirects).
 * Cascade delete handles SeoMeta and PreviewTokens via DB schema.
 */
export async function deleteContent(id: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || session.user.role !== 'ADMIN') {
            throw new Error('Unauthorized');
        }

        const content = await prisma.content.findUnique({
            where: { id },
            include: { category: true }
        });

        if (!content) throw new Error('Content not found');

        // Build both locale paths — design spec requires cleaning up BOTH,
        // regardless of which locale the article belongs to.
        const enPath = `/blog/${content.slug}`;
        const zhPath = `/zh/blog/${content.slug}`;
        const enUrl = `${BASE_URL}${enPath}`;
        const zhUrl = `${BASE_URL}${zhPath}`;

        await prisma.$transaction([
            // 1. Clean up PlannedArticle association
            prisma.plannedArticle.updateMany({
                where: { articleId: id },
                data: { articleId: null, status: 'PLANNED' }
            }),
            // 2. Clean up TrackedArticle — both locale URLs
            prisma.trackedArticle.deleteMany({
                where: { url: { in: [enUrl, zhUrl] } }
            }),
            // 3. Clean up Redirects FROM this path — both locale paths
            prisma.redirect.deleteMany({
                where: { fromPath: { in: [enPath, zhPath] } }
            }),
            // 4. Delete the content itself (cascade: SeoMeta, PreviewToken)
            prisma.content.delete({
                where: { id }
            })
        ]);

        // 5. Revalidate affected paths
        if (content.status === 'PUBLISHED') {
            await revalidateContentPaths(content);
        }
        revalidatePath('/dashboard/admin/content');

        return { success: true };
    } catch (error) {
        console.error('Failed to delete content:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Search published content for internal link insertion.
 * Returns up to 10 articles matching query by title or slug.
 */
export async function searchPublishedContent(
    query: string,
    locale?: string,
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || !['ADMIN', 'EDITOR'].includes((session.user as any).role)) {
            return { success: false, error: 'Unauthorized' };
        }

        const q = query.trim();
        if (!q) {
            return { success: true, data: [] };
        }

        const articles = await prisma.content.findMany({
            where: {
                status: 'PUBLISHED',
                ...(locale ? { locale } : {}),
                OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { slug: { contains: q, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                title: true,
                slug: true,
                locale: true,
            },
            take: 10,
            orderBy: { publishedAt: 'desc' },
        });

        return { success: true, data: articles };
    } catch (error) {
        console.error('Search published content failed:', error);
        return { success: false, error: String(error) };
    }
}
