'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { uploadImageFile } from '@/lib/storage';
import prisma from '@/lib/prisma';

export async function uploadMediaAction(formData: FormData) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || (session.user as any).role !== 'ADMIN') {
            return { success: false, error: 'Unauthorized' };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadImageFile(buffer, file.name, file.type);

        return { success: true, data: result };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * List media items for the media library selector.
 * ADMIN only. Supports pagination and filename search.
 */
export async function listMediaAction(options?: {
    page?: number;
    pageSize?: number;
    search?: string;
}) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session || (session.user as any).role !== 'ADMIN') {
            return { success: false, error: 'Unauthorized' };
        }

        const page = options?.page || 1;
        const pageSize = options?.pageSize || 24;
        const search = options?.search?.trim();

        const where = search
            ? { filename: { contains: search, mode: 'insensitive' as const } }
            : {};

        const [items, total] = await Promise.all([
            prisma.media.findMany({
                where,
                select: {
                    id: true,
                    filename: true,
                    storageUrl: true,
                    mimeType: true,
                    size: true,
                    createdAt: true,
                },
                take: pageSize,
                skip: (page - 1) * pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.media.count({ where }),
        ]);

        return {
            success: true,
            data: {
                items,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    } catch (error) {
        console.error('List media error:', error);
        return { success: false, error: String(error) };
    }
}
