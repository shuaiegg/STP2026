import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import prisma from '@/lib/prisma';

const STORAGE_BUCKET = process.env.MINIO_BUCKET || 'media';

const s3 = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT,
    region: 'us-east-1',
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
});

export interface UploadResult {
    mediaId: string;
    storageUrl: string;
    storagePath: string;
}

/**
 * Download an image from a URL and upload it to MinIO Storage
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

    // Download the image with retry logic
    let response: Response | null = null;
    let retries = 3;
    let lastError: any;

    while (retries > 0) {
        try {
            response = await fetch(imageUrl);
            if (response.ok) break;
            throw new Error(`Failed to download image: ${response.statusText}`);
        } catch (error: any) {
            lastError = error;
            if (error.code === 'ECONNRESET' || error.message?.includes('socket disconnected')) {
                console.warn(`[Storage] Connection reset for image ${imageUrl}, retrying... (${retries} left)`);
                retries--;
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            throw error;
        }
    }

    if (!response || !response.ok) {
        throw lastError || new Error(`Failed to download image after retries`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    // Generate a unique filename
    const extension = contentType.split('/')[1] || 'png';
    const filename = options?.filename || `${crypto.randomUUID()}.${extension}`;
    const storagePath = `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${filename}`;

    // Upload to MinIO via S3 API
    await s3.send(new PutObjectCommand({
        Bucket: STORAGE_BUCKET,
        Key: storagePath,
        Body: Buffer.from(buffer),
        ContentType: contentType,
    }));

    const storageUrl = `${process.env.MINIO_PUBLIC_URL}/${STORAGE_BUCKET}/${storagePath}`;

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
 * Upload an image file (Buffer/Uint8Array) directly to MinIO Storage
 */
export async function uploadImageFile(
    file: Buffer | Uint8Array,
    filename: string,
    contentType: string = 'image/png'
): Promise<UploadResult> {
    const extension = (filename.split('.').pop() || contentType.split('/')[1] || 'png').toLowerCase();
    // 脱敏文件名（去 CJK/空格/特殊字符）+ 唯一后缀，避免 URL 破损与同名覆盖
    const base = filename
        .replace(/\.[^.]+$/, '')        // 去扩展名
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')    // 非 ASCII/空格 → 连字符
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'image';
    const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const safeName = `${base}-${unique}.${extension}`;
    const storagePath = `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${safeName}`;

    // Upload to MinIO via S3 API
    await s3.send(new PutObjectCommand({
        Bucket: STORAGE_BUCKET,
        Key: storagePath,
        Body: Buffer.from(file),
        ContentType: contentType,
    }));

    const storageUrl = `${process.env.MINIO_PUBLIC_URL}/${STORAGE_BUCKET}/${storagePath}`;

    // Create Media record
    const media = await prisma.media.create({
        data: {
            filename,
            storageUrl,
            storagePath,
            mimeType: contentType,
            size: file.byteLength,
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
