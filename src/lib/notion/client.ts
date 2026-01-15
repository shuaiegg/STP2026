import { Client } from '@notionhq/client';
import { ProxyAgent } from 'undici';

const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;
const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;

if (!notionApiKey) {
    console.warn('NOTION_API_KEY not set - Notion sync will not work');
}

if (!notionDatabaseId) {
    console.warn('NOTION_DATABASE_ID not set - Notion sync will not work');
}

/**
 * Custom fetch with retry logic and Proxy support for Notion API
 */
const safeFetch = async (url: string, options: any) => {
    let retries = 3;
    let lastError: any;

    // Setup undici ProxyAgent if HTTPS_PROXY is defined
    let dispatcher: any = null;
    if (httpsProxy) {
        dispatcher = new ProxyAgent(httpsProxy);
        console.log(`[Notion Client] Using Proxy: ${httpsProxy}`);
    }

    while (retries > 0) {
        try {
            // Next.js / Node 18+ native fetch uses 'dispatcher' for agents
            const fetchOptions = {
                ...options,
                // Increase internal fetch timeout to match client expectations
                keepalive: true
            };

            if (dispatcher) {
                fetchOptions.dispatcher = dispatcher;
            }

            const response = await fetch(url, fetchOptions);
            return response;
        } catch (error: any) {
            lastError = error;

            // Check for SSL/TLS errors or connection resets
            const isSSLError = error.code === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR' ||
                error.code === 'ECONNRESET' ||
                error.message?.includes('SSL') ||
                error.message?.includes('TLS') ||
                error.message?.includes('socket disconnected');

            if (isSSLError && !httpsProxy) {
                console.error('[Notion Client] Connection Error detected. Please check if you need to set HTTPS_PROXY in your .env file.');
            }

            if (isSSLError || error.code === 'ETIMEDOUT') {
                console.warn(`[Notion Client] Connection error (${error.code || 'Network'}), retrying... (${retries} left)`);
                retries--;
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, 2000 * (4 - retries)));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

// Notion API client (server-side only)
// Increased default timeout for large page updates
export const notion = new Client({
    auth: notionApiKey,
    fetch: safeFetch as any,
    timeoutMs: 180000, // 3 minutes
});

export const NOTION_DATABASE_ID = (notionDatabaseId || '').trim().replace(/^["']|["']$/g, '');

/**
 * Update Notion page properties
 */
export async function updateNotionPageProperties(pageId: string, properties: any) {
    return await notion.pages.update({
        page_id: pageId,
        properties,
    });
}

/**
 * Update Notion page content by replacing all blocks
 */
export async function updateNotionPageContent(pageId: string, markdown: string) {
    // 1. Get all blocks in the page
    const blocks = await notion.blocks.children.list({ block_id: pageId });

    // 2. Delete all existing blocks in parallel with a small concurrency limit
    // Deleting one by one is too slow and causes timeouts.
    // Notion rate limit is ~3 requests per second, so we use small batches.
    const blockIds = blocks.results.map(b => b.id);
    const batchSize = 5;

    for (let i = 0; i < blockIds.length; i += batchSize) {
        const batch = blockIds.slice(i, i + batchSize);
        await Promise.all(batch.map(id => notion.blocks.delete({ block_id: id })));
        // Brief pause between batches to respect rate limits
        if (i + batchSize < blockIds.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // 3. Convert Markdown to Notion blocks (Basic implementation)
    const blocksToAppend = markdownToNotionBlocks(markdown);

    // 4. Append new blocks in chunks
    for (let i = 0; i < blocksToAppend.length; i += 100) {
        const chunk = blocksToAppend.slice(i, i + 100);
        await notion.blocks.children.append({
            block_id: pageId,
            children: chunk,
        });
    }
}

/**
 * Very basic Markdown to Notion Blocks converter
 * Supports: H1, H2, H3, Paragraphs, Code blocks, Bullets
 */
function markdownToNotionBlocks(markdown: string): any[] {
    const lines = markdown.split('\n');
    const blocks: any[] = [];
    let currentCodeBlock: string[] | null = null;
    let codeLanguage = 'plain text';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Code block handling
        if (line.startsWith('```')) {
            if (currentCodeBlock === null) {
                currentCodeBlock = [];
                codeLanguage = line.slice(3).trim() || 'plain text';
                // Map common languages to Notion supported ones
                if (codeLanguage === 'js') codeLanguage = 'javascript';
                if (codeLanguage === 'ts') codeLanguage = 'typescript';
                if (codeLanguage === 'py') codeLanguage = 'python';
            } else {
                blocks.push({
                    object: 'block',
                    type: 'code',
                    code: {
                        rich_text: [{ type: 'text', text: { content: currentCodeBlock.join('\n') } }],
                        language: codeLanguage,
                    },
                });
                currentCodeBlock = null;
            }
            continue;
        }

        if (currentCodeBlock !== null) {
            currentCodeBlock.push(line);
            continue;
        }

        // Headings
        if (line.startsWith('# ')) {
            blocks.push({
                object: 'block',
                type: 'heading_1',
                heading_1: { rich_text: [{ type: 'text', text: { content: line.slice(2) } }] },
            });
        } else if (line.startsWith('## ')) {
            blocks.push({
                object: 'block',
                type: 'heading_2',
                heading_2: { rich_text: [{ type: 'text', text: { content: line.slice(3) } }] },
            });
        } else if (line.startsWith('### ')) {
            blocks.push({
                object: 'block',
                type: 'heading_3',
                heading_3: { rich_text: [{ type: 'text', text: { content: line.slice(4) } }] },
            });
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            blocks.push({
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line.slice(2) } }] },
            });
        } else if (line.trim() === '') {
            // Skip empty lines or treat as spacers? Notion paragraphs handle spacing
            continue;
        } else {
            // Normal paragraph
            blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: { rich_text: [{ type: 'text', text: { content: line } }] },
            });
        }
    }

    return blocks;
}

export default notion;
