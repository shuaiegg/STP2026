import { NextResponse } from 'next/server';
import { withSiteContext } from '@/lib/api-utils';
import { fetchHtml } from '@/lib/skills/site-intelligence/crawler/fetcher';
import * as cheerio from 'cheerio';

interface Heading {
    level: 1 | 2 | 3;
    text: string;
}

export const POST = withSiteContext<{ siteId: string }>(async (request) => {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url || !url.startsWith('http')) {
            return NextResponse.json({ success: false, error: 'Valid URL is required' }, { status: 400 });
        }

        console.log(`[Deep Profiling] Fetching ${url}`);
        const { html, status, error } = await fetchHtml(url);

        if (status >= 400 || !html) {
            return NextResponse.json({
                success: false,
                error: error || `Failed to fetch page (Status ${status})`
            }, { status: 500 });
        }

        const $ = cheerio.load(html);

        // 1. Extract Headings (H1, H2, H3) to build an outline
        const headings: Heading[] = [];
        $('h1, h2, h3').each((_, el) => {
            const tagName = el.tagName.toLowerCase();
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            if (text.length > 3) { // Ignore empty or single-character headings
                headings.push({
                    level: parseInt(tagName.replace('h', '')) as 1 | 2 | 3,
                    text
                });
            }
        });

        // 2. Extract Word Count (Basic estimation from body text)
        // Remove scripts, styles, nav, and footers to get actual content
        $('script, style, noscript, nav, footer, header, aside').remove();
        const rawText = $('body').text().replace(/\s+/g, ' ').trim();
        const wordCount = rawText.split(' ').filter(word => word.length > 0).length;

        // 3. Extract Meta Info
        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content')?.trim() || '';

        return NextResponse.json({
            success: true,
            data: {
                url,
                title,
                description,
                wordCount,
                headings
            }
        });

    } catch (e: any) {
        console.error('[Deep Profiling] Error:', e);
        return NextResponse.json({ success: false, error: e.message || 'Server error' }, { status: 500 });
    }
});
