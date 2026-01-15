import { supabaseAdmin } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

const STORAGE_BUCKET = 'media';

export interface UploadResult {
    mediaId: string;
    storageUrl: string;
    storagePath: string;
}

/**
 * Download an image from a URL and upload it to Supabase Storage
 */
export async function uploadImageFromUrl(
    imageUrl: string,
    options?: {
        notionBlockId?: string;
        filename?: string;
    }
): Promise<UploadResult> {
    // Check if we already have this image (by Notion block ID)
    if (options?.notionBlockId) {
        const existing = await prisma.media.findUnique({
            where: { notionBlockId: options.notionBlockId },
        });
        if (existing) {
            return {
                mediaId: existing.id,
                storageUrl: existing.storageUrl,
                storagePath: existing.storagePath,
            };
        }
    }

    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    // Generate a unique filename
    const extension = contentType.split('/')[1] || 'png';
    const filename = options?.filename || `${crypto.randomUUID()}.${extension}`;
    const storagePath = `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, buffer, {
            contentType,
            upsert: false,
        });

    if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);

    const storageUrl = publicUrlData.publicUrl;

    // Create Media record
    const media = await prisma.media.create({
        data: {
            filename,
            originalUrl: imageUrl,
            storageUrl,
            storagePath,
            mimeType: contentType,
            size: buffer.byteLength,
            notionBlockId: options?.notionBlockId,
        },
    });

    return {
        mediaId: media.id,
        storageUrl: media.storageUrl,
        storagePath: media.storagePath,
    };
}

/**
 * Get media by ID
 */
export async function getMedia(mediaId: string) {
    return prisma.media.findUnique({
        where: { id: mediaId },
    });
}

/**
 * List all media files
 */
export async function listMedia(options?: { limit?: number; offset?: number }) {
    return prisma.media.findMany({
        take: options?.limit || 50,
        skip: options?.offset || 0,
        orderBy: { createdAt: 'desc' },
    });
}
