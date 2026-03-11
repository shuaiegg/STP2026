import { NextResponse } from 'next/server';
import { withSiteContext } from '@/lib/api-utils';
import * as cheerio from 'cheerio';

export const POST = withSiteContext<{ siteId: string }>(async (request) => {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
        }

        // Fetch the competitor URL
        const htmlReq = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            // fast timeout
            signal: AbortSignal.timeout(10000)
        });

        if (!htmlReq.ok) {
            return NextResponse.json({ error: 'Failed to access URL: ' + htmlReq.statusText }, { status: 400 });
        }

        const html = await htmlReq.text();
        const $ = cheerio.load(html);

        // Strip out scripts and styles to count pure content words roughly
        $('script, style, noscript, nav, footer, header').remove();

        const textContent = $('body').text().replace(/\s+/g, ' ').trim();
        const wordCount = textContent.split(' ').length;

        const headings: Array<{ level: number, text: string }> = [];

        // Re-load full DOM to extract headers properly including from headers/navs if needed, or just use the current simplified DOM
        $('h1, h2, h3').each((_, el) => {
            const levelStr = el.tagName.toLowerCase().replace('h', '');
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            if (text.length > 3) {
                headings.push({
                    level: parseInt(levelStr, 10),
                    text
                });
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                url,
                wordCount,
                headings
            }
        });

    } catch (error: any) {
        console.error('[MarketGap Profile] Error:', error);
        return NextResponse.json({ error: 'Failed to profile the URL' }, { status: 500 });
    }
});
