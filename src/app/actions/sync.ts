'use server';

import { syncAllNotionPages, syncNotionPage } from '@/lib/notion/sync';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Sync all content from Notion
 */
export async function syncAllContent(options: { force?: boolean } = {}) {
    try {
        const result = await syncAllNotionPages(options);

        // Revalidate blog pages
        revalidatePath('/blog');
        revalidatePath('/');

        return {
            success: true,
            message: `Synced ${result.synced} of ${result.total} pages`,
            data: result,
        };
    } catch (error) {
        console.error('Sync all failed:', error);
        return {
            success: false,
            message: String(error),
        };
    }
}

/**
 * Server Action: Sync a single page from Notion
 */
export async function syncSinglePage(pageId: string) {
    try {
        const result = await syncNotionPage(pageId);

        if (result.success && result.slug) {
            // Revalidate specific page
            revalidatePath(`/blog/${result.slug}`);
            revalidatePath('/blog');
        }

        return {
            success: result.success,
            message: result.success ? `Synced: ${result.slug}` : result.error,
            data: result,
        };
    } catch (error) {
        console.error('Sync single failed:', error);
        return {
            success: false,
            message: String(error),
        };
    }
}
