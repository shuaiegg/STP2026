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

export async function saveToBlogDraft(params: {
    title: string;
    content: string;
    summary?: string;
}) {
    try {
        // 7.2 Verify role === 'ADMIN'
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || (session.user as any).role !== 'ADMIN') {
            return { success: false, message: 'Unauthorized' };
        }

        const { title, content, summary } = params;

        // 7.3 Implement Content creation logic
        // Generate slug with random suffix to ensure uniqueness
        const baseSlug = slugify(title) || 'untitled';
        const randomSuffix = Math.random().toString(36).substring(2, 7);
        const slug = `${baseSlug}-${randomSuffix}`;

        const newContent = await prisma.content.create({
            data: {
                title,
                contentMd: content,
                summary,
                slug,
                status: 'DRAFT',
                source: 'MANUAL',
                visibility: 'PRIVATE',
                type: 'BLOG',
            }
        });

        // Revalidate admin content list
        revalidatePath('/dashboard/admin/content');

        return { success: true, id: newContent.id };
    } catch (error) {
        console.error('Failed to save blog draft:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
}
