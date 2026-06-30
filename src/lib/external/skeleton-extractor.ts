/**
 * Skeleton Extractor Utility
 * 
 * Fetches remote HTML and extracts heading structures (H1-H3)
 * to understand competitor content outlines.
 */

export interface ContentSkeleton {
    url: string;
    title: string;
    headings: {
        level: number;
        text: string;
    }[];
}

export class SkeletonExtractor {
    /**
     * Extract skeleton from a URL
     */
    static async extract(url: string): Promise<ContentSkeleton | null> {
        try {
            console.log(`Extracting skeleton from: ${url}`);

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                signal: AbortSignal.timeout(10000) // 10s timeout
            });

            if (!response.ok) return null;

            const html = await response.text();
            
            // 1. Extract Title
            const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : 'No Title';

            // 1b. Skip anti-bot / challenge pages (e.g. Reddit "Please wait for verification",
            //     Cloudflare "Just a moment") — their title/headings would pollute competitor outlines.
            const BLOCKED_PAGE = /please wait|just a moment|verifying you|verification required|attention required|access denied|enable javascript|are you a (human|robot)|captcha|cloudflare|security check|checking your browser/i;
            if (BLOCKED_PAGE.test(title)) {
                console.warn(`[Skeleton] Skipped anti-bot/challenge page: ${url} (title: "${title}")`);
                return null;
            }

            // 2. Extract Headings (H1, H2, H3, H4)
            const headings: { level: number, text: string }[] = [];
            const headingRegex = /<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi;
            
            let match;
            while ((match = headingRegex.exec(html)) !== null) {
                const level = parseInt(match[1]);
                const text = match[2]
                    .replace(/<[^>]*>/g, '') // strip nested tags
                    .replace(/\s+/g, ' ')    // normalize whitespace
                    .trim();
                
                if (text && text.length < 200) { // filter out overly long junk
                    headings.push({ level, text });
                }
            }

            return {
                url,
                title,
                headings: headings.slice(0, 30) // Limit to first 30 headings
            };

        } catch (error) {
            console.error(`Skeleton extraction failed for ${url}:`, error);
            return null;
        }
    }

    /**
     * Batch extract skeletons from multiple URLs
     */
    static async batchExtract(urls: string[]): Promise<ContentSkeleton[]> {
        const results = await Promise.all(
            urls.map(url => this.extract(url))
        );
        return results.filter((r): r is ContentSkeleton => r !== null);
    }
}
