import notion, { NOTION_DATABASE_ID } from './client';
import { NotionToMarkdown } from 'notion-to-md';
import prisma from '@/lib/prisma';
import { uploadImageFromUrl } from '@/lib/storage';
import { ContentStatus, ContentSource } from '@prisma/client';

// Schema update: readingTime added

// Initialize notion-to-md
const n2m = new NotionToMarkdown({ notionClient: notion });

// Add custom image transformer to ensure we get the URL as markdown
n2m.setCustomTransformer('image', async (block: any) => {
    const { image } = block;
    const url = image.file?.url || image.external?.url || '';
    const caption = image.caption?.[0]?.plain_text || '';
    if (!url) return '';
    return `![${caption}](${url})`;
});

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
 * Extract number property from Notion page
 */
function getNumberProperty(page: NotionPage, propertyName: string): number | null {
    const prop = page.properties[propertyName];
    if (!prop || prop.type !== 'number') return null;
    return prop.number;
}

/**
 * Extract date property from Notion page
 */
function getDateProperty(page: NotionPage, propertyName: string): Date | null {
    const prop = page.properties[propertyName];
    if (!prop || prop.type !== 'date' || !prop.date?.start) return null;
    return new Date(prop.date.start);
}

/**
 * Extract multi-select property as array from Notion page
 */
function getMultiSelectProperty(page: NotionPage, propertyName: string): string[] {
    const prop = page.properties[propertyName];
    if (!prop || prop.type !== 'multi_select') return [];
    return prop.multi_select?.map((s: any) => s.name) || [];
}

/**
 * Find category by name (case-insensitive)
 */
async function findCategoryByName(name: string | null): Promise<string | null> {
    if (!name) return null;

    // Generate a valid slug - allow alphanumeric, Chinese characters, and hyphens
    let slug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u4e00-\u9fa5-]/g, '');

    // If slug becomes empty after stripping, fallback to a random string or hash
    if (!slug) {
        slug = `cat-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Try to find existing category by name or slug
    const existingCategory = await prisma.category.findFirst({
        where: {
            OR: [
                {
                    name: {
                        equals: name,
                        mode: 'insensitive',
                    },
                },
                {
                    slug: slug,
                },
            ],
        },
    });

    if (existingCategory) return existingCategory.id;

    // Use upsert to handle possible race conditions and ensure slug uniqueness
    const category = await prisma.category.upsert({
        where: { slug: slug },
        update: {
            name: name, // Ensure name is synced if it matches slug but not exact name
        },
        create: {
            name: name,
            slug: slug,
            isActive: true,
        },
    });

    return category.id;
}

/**
 * Process images in markdown content
 * Downloads images from Notion and uploads to Supabase Storage
 */
async function processMarkdownImages(
    markdown: string,
    pageId: string
): Promise<string> {
    // Regex to find ANY external image URLs in markdown
    const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
    let processedMarkdown = markdown;
    let match;

    console.log(`[Sync] Processing images in markdown...`);
    let imageCount = 0;

    while ((match = imageRegex.exec(markdown)) !== null) {
        imageCount++;
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
 * Calculate estimated reading time in minutes
 */
function calculateReadingTime(content: string): number {
    if (!content) return 1;
    // Remove markdown image syntax and links to get cleaner text
    const cleanText = content.replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
    // For Chinese/Japanese/Korean, count characters. For others, count words.
    // Simple heuristic: if there are CJK characters, use char count / 300, else word count / 200
    const hasCJK = /[\u4e00-\u9fa5]/.test(cleanText);
    if (hasCJK) {
        const charCount = cleanText.replace(/\s+/g, '').length;
        return Math.max(1, Math.ceil(charCount / 300));
    } else {
        const wordCount = cleanText.split(/\s+/).length;
        return Math.max(1, Math.ceil(wordCount / 200));
    }
}

/**
 * Sync a single Notion page to the database
 */
export async function syncNotionPage(pageId: string, force: boolean = false): Promise<SyncResult> {
    try {
        // Fetch the page
        const page = await notion.pages.retrieve({ page_id: pageId }) as NotionPage;
        const lastEditedAt = new Date(page.last_edited_time);

        // Extract properties
        const title = (getPropertyValue(page, 'Title') || 'Untitled').trim();
        let slug = getPropertyValue(page, 'Slug');

        if (slug) {
            slug = slug.trim().replace(/^\/+/, '');
        }

        // Check if we can skip sync based on last_edited_time
        if (!force && slug) {
            const existing = await prisma.content.findUnique({
                where: { notionPageId: pageId },
                select: { notionLastEditedAt: true }
            });

            if (existing?.notionLastEditedAt) {
                const existingTime = existing.notionLastEditedAt.getTime();
                const newTime = lastEditedAt.getTime();

                console.log(`[Sync] Comparing timestamps for "${title}": Existing=${existingTime}, New=${newTime}`);

                if (existingTime === newTime) {
                    console.log(`[Sync] Skipping unchanged page: "${title}" (${slug})`);
                    return { success: true, slug };
                }
            }
        }

        const summary = getPropertyValue(page, 'Summary');
        const categoryName = getPropertyValue(page, 'Category');
        const coverUrl = getPropertyValue(page, 'Cover') || page.cover?.external?.url || page.cover?.file?.url;
        const status = getPropertyValue(page, 'Status');
        const notionReadingTime = getPropertyValue(page, 'ReadingTime') || getPropertyValue(page, 'Minutes');

        // SEO properties from Notion (optional)
        const seoStatus = getPropertyValue(page, 'SEOStatus') || getPropertyValue(page, 'SEO Status');
        const geoScore = getNumberProperty(page, 'GEOScore') || getNumberProperty(page, 'GEO Score');
        const seoUpdatedAt = getDateProperty(page, 'SEOUpdated') || getDateProperty(page, 'SEO Updated');
        const keywords = getMultiSelectProperty(page, 'Keywords') ||
            (getPropertyValue(page, 'Keywords')?.split(',').map(k => k.trim()).filter(Boolean) || []);
        const metaTitle = getPropertyValue(page, 'MetaTitle') || getPropertyValue(page, 'Meta Title');
        const metaDescription = getPropertyValue(page, 'MetaDescription') || getPropertyValue(page, 'Meta Description');

        console.log(`[Sync] Processing page: "${title}", Summary: "${summary}"`);

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

        // Debug: Log if images are found in blocks
        const imageBlocks = mdBlocks.filter(b => b.type === 'image');
        if (imageBlocks.length > 0) {
            console.log(`[Sync] Found ${imageBlocks.length} image blocks in page ${pageId}`);
        }

        let bodyMd = n2m.toMarkdownString(mdBlocks).parent || '';

        // Use property value if exists, otherwise use body
        let contentMd = propertyMd || bodyMd;

        if (!contentMd) {
            // This is a warning, but not a critical failure to stop the sync
            console.warn(`[Sync] Warning: Page "${title}" (ID: ${pageId}) has no markdown content (blocks or propertyMd).`);
        }

        // Process and localize images
        contentMd = await processMarkdownImages(contentMd, pageId);

        // Calculate reading time
        let readingTime = 1;
        if (notionReadingTime) {
            const parsed = parseInt(notionReadingTime);
            readingTime = isNaN(parsed) ? calculateReadingTime(contentMd) : parsed;
        } else {
            readingTime = calculateReadingTime(contentMd);
        }

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
        // @ts-ignore - Ignore temporary sync issues with generated client
        const content = await (prisma.content as any).upsert({
            where: { notionPageId: pageId },
            update: {
                title,
                slug,
                summary,
                contentMd,
                category: categoryId ? { connect: { id: categoryId } } : { disconnect: true },
                coverImage: coverImageId ? { connect: { id: coverImageId } } : { disconnect: true },
                readingTime: readingTime || 1,
                status: ContentStatus.PUBLISHED,
                publishedAt: new Date(),
                notionLastEditedAt: lastEditedAt,
                updatedAt: new Date(),
            },
            create: {
                notionPageId: pageId,
                title,
                slug,
                summary,
                contentMd,
                category: categoryId ? { connect: { id: categoryId } } : undefined,
                coverImage: coverImageId ? { connect: { id: coverImageId } } : undefined,
                readingTime: readingTime || 1,
                status: ContentStatus.PUBLISHED,
                source: ContentSource.NOTION,
                publishedAt: new Date(),
                notionLastEditedAt: lastEditedAt,
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
export async function syncAllNotionPages(options: { force?: boolean } = {}): Promise<{
    total: number;
    synced: number;
    failed: number;
    results: SyncResult[];
}> {
    const { force = false } = options;
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

        // Query all pages from Notion database with pagination
        let results_all: any[] = [];
        let hasMore = true;
        let cursor: string | undefined = undefined;

        while (hasMore) {
            const response = await notion.databases.query({
                database_id: NOTION_DATABASE_ID,
                filter: {
                    property: 'Status',
                    select: {
                        equals: 'Ready',
                    },
                },
                start_cursor: cursor,
            });

            results_all = [...results_all, ...response.results];
            hasMore = response.has_more;
            cursor = response.next_cursor || undefined;
        }

        const total = results_all.length;

        // Update sync log with total
        await prisma.syncLog.update({
            where: { id: syncLog.id },
            data: { itemsTotal: total },
        });

        // Process each page
        for (const page of results_all) {
            // Add a small delay between requests to avoid overwhelming the connection
            await new Promise(resolve => setTimeout(resolve, 300));

            const result = await syncNotionPage(page.id, force);
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
