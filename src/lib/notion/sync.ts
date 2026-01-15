import notion, { NOTION_DATABASE_ID } from './client';
import { NotionToMarkdown } from 'notion-to-md';
import prisma from '@/lib/prisma';
import { uploadImageFromUrl } from '@/lib/storage';
import { ContentStatus, ContentSource } from '@prisma/client';

// Initialize notion-to-md
const n2m = new NotionToMarkdown({ notionClient: notion });

// Types for Notion API responses
type NotionPage = any; // Simplified for now
type NotionBlock = any;

export interface SyncResult {
    success: boolean;
    contentId?: string;
    slug?: string;
    error?: string;
}

/**
 * Extract property value from Notion page
 */
function getPropertyValue(page: NotionPage, propertyName: string): string | null {
    const prop = page.properties[propertyName];
    if (!prop) return null;

    switch (prop.type) {
        case 'title':
            return prop.title.map((t: any) => t.plain_text).join('') || null;
        case 'rich_text':
            return prop.rich_text.map((t: any) => t.plain_text).join('') || null;
        case 'select':
            return prop.select?.name || null;
        case 'multi_select':
            return prop.multi_select?.map((s: any) => s.name).join(', ') || null;
        case 'files':
            return prop.files?.[0]?.file?.url || prop.files?.[0]?.external?.url || null;
        case 'url':
            return prop.url || null;
        default:
            return null;
    }
}

/**
 * Find category by name (case-insensitive)
 */
async function findCategoryByName(name: string | null): Promise<string | null> {
    if (!name) return null;

    // Try to find existing category
    const category = await prisma.category.findFirst({
        where: {
            name: {
                equals: name,
                mode: 'insensitive',
            },
        },
    });

    if (category) return category.id;

    // Auto-create category if it doesn't exist
    const newCategory = await prisma.category.create({
        data: {
            name: name,
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
            isActive: true,
        },
    });

    return newCategory.id;
}

/**
 * Process images in markdown content
 * Downloads images from Notion and uploads to Supabase Storage
 */
async function processMarkdownImages(
    markdown: string,
    pageId: string
): Promise<string> {
    // Regex to find Notion image URLs in markdown
    const imageRegex = /!\[([^\]]*)\]\((https:\/\/[^)]+notion[^)]+)\)/g;
    let processedMarkdown = markdown;
    let match;

    while ((match = imageRegex.exec(markdown)) !== null) {
        const [fullMatch, altText, imageUrl] = match;

        try {
            // Generate a unique block ID for this image
            const blockId = `${pageId}-img-${match.index}`;

            const result = await uploadImageFromUrl(imageUrl, {
                notionBlockId: blockId,
            });

            // Replace Notion URL with Supabase Storage URL
            processedMarkdown = processedMarkdown.replace(
                fullMatch,
                `![${altText}](${result.storageUrl})`
            );
        } catch (error) {
            console.error(`Failed to process image: ${imageUrl}`, error);
            // Keep original URL on failure
        }
    }

    return processedMarkdown;
}

/**
 * Sync a single Notion page to the database
 */
export async function syncNotionPage(pageId: string): Promise<SyncResult> {
    try {
        // Fetch the page
        const page = await notion.pages.retrieve({ page_id: pageId }) as NotionPage;

        // Extract properties
        const title = (getPropertyValue(page, 'Title') || 'Untitled').trim();
        let slug = getPropertyValue(page, 'Slug');
        const summary = getPropertyValue(page, 'Summary');
        const categoryName = getPropertyValue(page, 'Category');
        const coverUrl = getPropertyValue(page, 'Cover') || page.cover?.external?.url || page.cover?.file?.url;
        const status = getPropertyValue(page, 'Status');

        if (slug) {
            slug = slug.trim().replace(/^\/+/, '');
        }

        if (!slug) {
            return { success: false, error: 'Page missing required Slug property' };
        }

        // Skip if not Ready in Notion
        if (status !== 'Ready') {
            return { success: false, error: `Page status is "${status}", not "Ready"` };
        }

        // 1. Try to get content from a property named 'contentMd' (if user prefers putting MD in a text field)
        const propertyMd = getPropertyValue(page, 'contentMd');

        // 2. Fetch from page blocks (standard way)
        const mdBlocks = await n2m.pageToMarkdown(pageId);
        let bodyMd = n2m.toMarkdownString(mdBlocks).parent || '';

        // Use property value if exists, otherwise use body
        let contentMd = propertyMd || bodyMd;

        if (!contentMd) {
            // This is a warning, but not a critical failure to stop the sync
            console.warn(`[Sync] Warning: Page "${title}" (ID: ${pageId}) has no markdown content (blocks or propertyMd).`);
        }

        // Process and localize images
        contentMd = await processMarkdownImages(contentMd, pageId);

        // Find category (don't auto-create!)
        const categoryId = await findCategoryByName(categoryName);

        // Handle cover image
        let coverImageId: string | null = null;
        if (coverUrl) {
            try {
                const coverResult = await uploadImageFromUrl(coverUrl, {
                    notionBlockId: `${pageId}-cover`,
                });
                coverImageId = coverResult.mediaId;
            } catch (error) {
                console.error('Failed to process cover image:', error);
            }
        }

        // Upsert content
        const content = await prisma.content.upsert({
            where: { notionPageId: pageId },
            update: {
                title,
                slug,
                summary,
                contentMd,
                categoryId,
                coverImageId,
                status: ContentStatus.PUBLISHED,
                publishedAt: new Date(),
                notionLastEditedAt: new Date(page.last_edited_time),
                updatedAt: new Date(),
            },
            create: {
                notionPageId: pageId,
                title,
                slug,
                summary,
                contentMd,
                categoryId,
                coverImageId,
                status: ContentStatus.PUBLISHED,
                source: ContentSource.NOTION,
                publishedAt: new Date(),
                notionLastEditedAt: new Date(page.last_edited_time),
            },
        });

        return { success: true, contentId: content.id, slug: content.slug };
    } catch (error) {
        console.error('Sync error:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Sync all pages from the Notion database
 */
export async function syncAllNotionPages(): Promise<{
    total: number;
    synced: number;
    failed: number;
    results: SyncResult[];
}> {
    // Create sync log
    const syncLog = await prisma.syncLog.create({
        data: { status: 'running' },
    });

    const results: SyncResult[] = [];
    let synced = 0;
    let failed = 0;

    try {
        if (!NOTION_DATABASE_ID) {
            throw new Error('NOTION_DATABASE_ID is not defined in environment variables');
        }

        // Query all pages from Notion database
        const response = await notion.databases.query({
            database_id: NOTION_DATABASE_ID,
            filter: {
                property: 'Status',
                select: {
                    equals: 'Ready',
                },
            },
        });

        const total = response.results.length;

        // Update sync log with total
        await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: { itemsTotal: total },
        });

        // Process each page
        for (const page of response.results) {
            const result = await syncNotionPage(page.id);
            results.push(result);

            if (result.success) {
                synced++;
            } else {
                console.error(`[Sync] Failed to sync page ${page.id}:`, result.error);
                failed++;
            }

            // Update sync log progress
            await prisma.syncLog.update({
                where: { id: syncLog.id },
                data: { itemsSynced: synced, itemsFailed: failed },
            });
        }

        // Mark sync as complete
        await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: {
                status: 'success',
                completedAt: new Date(),
                itemsSynced: synced,
                itemsFailed: failed,
            },
        });

        return { total, synced, failed, results };
    } catch (error) {
        // Mark sync as failed
        await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: {
                status: 'failed',
                completedAt: new Date(),
                error: String(error),
            },
        });

        throw error;
    }
}
