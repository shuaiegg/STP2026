import { Client } from '@notionhq/client';

const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey) {
    console.warn('NOTION_API_KEY not set - Notion sync will not work');
}

if (!notionDatabaseId) {
    console.warn('NOTION_DATABASE_ID not set - Notion sync will not work');
}

/**
 * Custom fetch with retry logic for Notion API
 */
const safeFetch = async (url: string, options: any) => {
    let retries = 3;
    let lastError: any;

    while (retries > 0) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error: any) {
            lastError = error;
            if (error.code === 'ECONNRESET' || error.message?.includes('socket disconnected')) {
                console.warn(`[Notion Client] Connection reset, retrying... (${retries} left)`);
                retries--;
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

// Notion API client (server-side only)
export const notion = new Client({
    auth: notionApiKey,
    fetch: safeFetch as any,
});

export const NOTION_DATABASE_ID = (notionDatabaseId || '').trim().replace(/^["']|["']$/g, '');

export default notion;
