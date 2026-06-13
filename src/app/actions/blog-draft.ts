'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

function slugify(text: string) {
    const ascii = text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    // Fallback for pure CJK or non-ASCII titles (e.g. "关键词优化策略")
    return ascii || `post-${Date.now()}`;
}

function calculateReadingTime(contentMd: string) {
    // Basic algorithm: CJK 300 chars/min, English 200 words/min
    const zhCount = (contentMd.match(/[\u4e00-\u9fa5]/g) || []).length;
    const enWords = contentMd.replace(/[\u4e00-\u9fa5]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    
    const minutes = (zhCount / 300) + (enWords / 200);
    return Math.max(1, Math.ceil(minutes));
}

export async function saveToBlogDraft(params: {
    title: string;
    content: string;
    summary?: string;
    locale?: string;
    authorId?: string;
    plannedArticleId?: string;
    seoMeta?: {
        metaTitle?: string;
        metaDescription?: string;
        keywords?: string[];
        geoScore?: number;
    };
}) {
    try {
        // 7.2 Verify role === 'ADMIN'
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || (session.user as any).role !== 'ADMIN') {
            return { success: false, message: 'Unauthorized' };
        }

        const { title, content, summary, locale = 'en', authorId, seoMeta, plannedArticleId } = params;

        // 7.3 Implement Content creation logic
        // Generate slug with random suffix to ensure uniqueness
        const baseSlug = slugify(title) || 'untitled';
        const randomSuffix = Math.random().toString(36).substring(2, 7);
        const slug = `${baseSlug}-${randomSuffix}`;

        const readingTime = calculateReadingTime(content);

        const newContent = await prisma.$transaction(async (tx) => {
            const created = await tx.content.create({
                data: {
                    title,
                    contentMd: content,
                    summary,
                    slug,
                    status: 'DRAFT',
                    source: 'MANUAL',
                    visibility: 'PRIVATE',
                    type: 'BLOG',
                    locale,
                    authorId,
                    readingTime,
                    seo: seoMeta ? {
                        create: {
                            metaTitle: seoMeta.metaTitle,
                            metaDescription: seoMeta.metaDescription,
                            keywords: seoMeta.keywords || [],
                            geoScore: seoMeta.geoScore,
                            geoAuditedAt: seoMeta.geoScore ? new Date() : undefined,
                        }
                    } : undefined
                }
            });

            if (plannedArticleId) {
                await tx.plannedArticle.update({
                    where: { id: plannedArticleId },
                    data: {
                        articleId: created.id,
                        status: 'IN_PROGRESS'
                    }
                });
            }

            return created;
        });

        // Revalidate admin content list
        revalidatePath('/dashboard/admin/content');

        return { success: true, id: newContent.id };
    } catch (error) {
        console.error('Failed to save blog draft:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
}
