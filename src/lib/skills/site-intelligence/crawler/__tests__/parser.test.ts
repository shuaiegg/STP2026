import { describe, it, expect } from 'vitest';
import { parseRobotsTxtForAiCrawlers } from '../fetcher';
import { CrawlerParser } from '../parser';

describe('crawler/fetcher (Robots.txt Parser)', () => {
    it('should parse wildcard rules blocking all bots by default', () => {
        const robots = `
            User-agent: *
            Disallow: /
        `;
        const result = parseRobotsTxtForAiCrawlers(robots);
        expect(result['GPTBot']).toBe('blocked');
        expect(result['Google-Extended']).toBe('blocked');
        expect(result['ClaudeBot']).toBe('blocked');
        expect(result['PerplexityBot']).toBe('blocked');
        expect(result['CCBot']).toBe('blocked');
    });

    it('should allow bots if robots.txt wildcard allows everything', () => {
        const robots = `
            User-agent: *
            Allow: /
            Disallow: /admin
        `;
        const result = parseRobotsTxtForAiCrawlers(robots);
        expect(result['GPTBot']).toBe('allowed');
        expect(result['ClaudeBot']).toBe('allowed');
    });

    it('should respect specific crawler rules over wildcard', () => {
        const robots = `
            User-agent: *
            Disallow: /

            User-agent: GPTBot
            Allow: /

            User-agent: ClaudeBot
            Disallow: /
        `;
        const result = parseRobotsTxtForAiCrawlers(robots);
        // GPTBot has specific Allow
        expect(result['GPTBot']).toBe('allowed');
        // ClaudeBot has specific Disallow
        expect(result['ClaudeBot']).toBe('blocked');
        // Google-Extended has no specific, falls back to wildcard block
        expect(result['Google-Extended']).toBe('blocked');
    });

    it('should handle case insensitivity and whitespace', () => {
        const robots = `
            USER-AGENT: gptbot
            DISALLOW: /

            user-agent: ClaudeBot
            allow: /
        `;
        const result = parseRobotsTxtForAiCrawlers(robots);
        expect(result['GPTBot']).toBe('blocked');
        expect(result['ClaudeBot']).toBe('allowed');
    });

    // Regression — consecutive User-agent lines share one rule block
    it('should block ALL agents in a multi-agent group', () => {
        const robots = `
            User-agent: GPTBot
            User-agent: CCBot
            Disallow: /
        `;
        const result = parseRobotsTxtForAiCrawlers(robots);
        expect(result['GPTBot']).toBe('blocked');
        expect(result['CCBot']).toBe('blocked');
        // others untouched
        expect(result['ClaudeBot']).toBe('allowed');
    });

    // Regression — partial Disallow must NOT be treated as a full block (no false alarm)
    it('should treat partial Disallow paths as allowed (not a full block)', () => {
        const robots = `
            User-agent: *
            Disallow: /admin/
            Disallow: /dashboard/
        `;
        const result = parseRobotsTxtForAiCrawlers(robots);
        expect(result['GPTBot']).toBe('allowed');
        expect(result['ClaudeBot']).toBe('allowed');
        expect(result['CCBot']).toBe('allowed');
    });
});

describe('crawler/parser', () => {
    it('should extract JSON-LD schema types correctly including nested/graph structures', () => {
        const html = `
            <html>
                <head>
                    <script type="application/ld+json">
                        {
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            "name": "ScaleToTop"
                        }
                    </script>
                    <script type="application/ld+json">
                        {
                            "@context": "https://schema.org",
                            "@graph": [
                                {
                                    "@type": "WebPage",
                                    "name": "Home"
                                },
                                {
                                    "@type": "FAQPage",
                                    "mainEntity": []
                                }
                            ]
                        }
                    </script>
                </head>
                <body></body>
            </html>
        `;
        const types = CrawlerParser.extractSchemaTypes(html);
        expect(types).toContain('Organization');
        expect(types).toContain('WebPage');
        expect(types).toContain('FAQPage');
    });

    it('should extract lists, tables and question headings', () => {
        const html = `
            <html>
                <body>
                    <h2>What is SEO?</h2>
                    <h3>如何提高排名</h3>
                    <h2>Normal Heading</h2>
                    <ul>
                        <li>1</li>
                        <li>2</li>
                    </ul>
                    <ol>
                        <li>A</li>
                    </ol>
                    <table>
                        <tr><td>Cell</td></tr>
                    </table>
                </body>
            </html>
        `;
        const pageData = CrawlerParser.extractPageData(html, 'https://example.com', 200, 200);
        expect(pageData.listCount).toBe(2);
        expect(pageData.tableCount).toBe(1);
        expect(pageData.questionHeadingCount).toBe(2); // "What is SEO?" and "如何提高排名"
    });

    it('should detect freshness and author signals', () => {
        const html = `
            <html>
                <head>
                    <meta name="author" content="Jack" />
                    <meta name="article:published_time" content="2026-06-17" />
                </head>
                <body></body>
            </html>
        `;
        const pageData = CrawlerParser.extractPageData(html, 'https://example.com', 100, 200);
        expect(pageData.hasDates).toBe(true);
        expect(pageData.hasAuthor).toBe(true);
    });
});
