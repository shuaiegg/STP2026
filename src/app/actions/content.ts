'use server';

import {
    publishContent,
    archiveContent,
    generatePreviewToken,
} from '@/lib/content';
import { revalidatePath } from 'next/cache';
import { uploadImageFromUrl } from '@/lib/storage';
import prisma from '@/lib/prisma';
import { ContentStatus, ContentSource } from '@prisma/client';

/**
 * Server Action: Publish content
 */
export async function publishContentAction(contentId: string) {
    try {
        const content = await publishContent(contentId);

        revalidatePath('/blog');
        revalidatePath(`/blog/${content.slug}`);

        return {
            success: true,
            message: `Published: ${content.title}`,
        };
    } catch (error) {
        return {
            success: false,
            message: String(error),
        };
    }
}

/**
 * Server Action: Archive content
 */
export async function archiveContentAction(contentId: string) {
    try {
        const content = await archiveContent(contentId);

        revalidatePath('/blog');
        revalidatePath(`/blog/${content.slug}`);

        return {
            success: true,
            message: `Archived: ${content.title}`,
        };
    } catch (error) {
        return {
            success: false,
            message: String(error),
        };
    }
}

/**
 * Server Action: Generate preview token
 */
export async function generatePreviewTokenAction(contentId: string) {
    try {
        const token = await generatePreviewToken(contentId, 24);
        const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/preview/${token}`;

        return {
            success: true,
            token,
            previewUrl,
        };
    } catch (error) {
        return {
            success: false,
            message: String(error),
        };
    }
}

/**
 * Server Action: Update content SEO
 */
export async function updateContentSeo(
    contentId: string,
    data: {
        metaTitle?: string;
        metaDescription?: string;
        canonicalUrl?: string;
        noIndex?: boolean;
    }
) {
    try {
        const seo = await prisma.seoMeta.upsert({
            where: { contentId },
            update: data,
            create: {
                contentId,
                ...data,
            },
        });

        const content = await prisma.content.findUnique({
            where: { id: contentId },
            select: { slug: true },
        });

        if (content) {
            revalidatePath(`/blog/${content.slug}`);
        }

        return {
            success: true,
            message: 'SEO updated',
            data: seo,
        };
    } catch (error) {
        return {
            success: false,
            message: String(error),
        };
    }
}

/**
 * Server Action: Update content category
 */
export async function updateContentCategory(contentId: string, categoryId: string | null) {
    try {
        const content = await prisma.content.update({
            where: { id: contentId },
            data: { categoryId },
        });

        revalidatePath('/blog');
        revalidatePath(`/blog/${content.slug}`);

        return {
            success: true,
            message: 'Category updated',
        };
    } catch (error) {
        return {
            success: false,
            message: String(error),
        };
    }
}
