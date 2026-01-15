import { Client } from '@notionhq/client';

const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey) {
    console.warn('NOTION_API_KEY not set - Notion sync will not work');
}

if (!notionDatabaseId) {
    console.warn('NOTION_DATABASE_ID not set - Notion sync will not work');
}

// Notion API client (server-side only)
export const notion = new Client({
    auth: notionApiKey,
});

export const NOTION_DATABASE_ID = (notionDatabaseId || '').trim().replace(/^["']|["']$/g, '');

export default notion;
