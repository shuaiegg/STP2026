'use server';

import prisma from '@/lib/prisma';
import { updateNotionPageProperties } from '@/lib/notion/client';
import { revalidatePath } from 'next/cache';

export async function updateContentMetadata(id: string, data: {
    title?: string;
    slug?: string;
    summary?: string;
    contentMd?: string;
}) {
    try {
        // 1. Get the content item to get the notionPageId
        const content = await prisma.content.findUnique({
            where: { id },
            select: { notionPageId: true }
        });

        if (!content || !content.notionPageId) {
            throw new Error('Content not found or not connected to Notion');
        }

        // 2. Prepare Notion properties
        const properties: any = {};
        if (data.title) {
            properties.Title = {
                title: [{ text: { content: data.title } }]
            };
        }
        if (data.slug) {
            properties.Slug = {
                rich_text: [{ text: { content: data.slug } }]
            };
        }
        if (data.summary) {
            properties.Summary = {
                rich_text: [{ text: { content: data.summary } }]
            };
        }

        // 3. Update Notion Properties
        await updateNotionPageProperties(content.notionPageId, properties);

        // 4. Update Notion Content (Blocks) if provided
        if (data.contentMd) {
            const { updateNotionPageContent } = await import('@/lib/notion/client');
            await updateNotionPageContent(content.notionPageId, data.contentMd);
        }

        // 5. Update local database
        await prisma.content.update({
            where: { id },
            data: {
                title: data.title,
                slug: data.slug,
                summary: data.summary,
                contentMd: data.contentMd,
                updatedAt: new Date()
            }
        });

        // 6. Revalidate
        revalidatePath('/admin/content');
        revalidatePath(`/admin/content/${id}`);
        if (data.slug) {
            revalidatePath(`/blog/${data.slug}`);
        }
        revalidatePath('/blog');

        return { success: true };
    } catch (error) {
        console.error('Failed to update content metadata:', error);
        return { success: false, error: String(error) };
    }
}
