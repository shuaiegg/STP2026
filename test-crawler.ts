import { CrawlerService } from './src/lib/skills/site-intelligence/crawler.service';

async function main() {
    const domain = 'https://www.copy.ai';
    console.log(`Starting crawl for ${domain}...`);
    const urls = await CrawlerService.discoverUrls(domain);
    console.log(`[Crawler] Found ${urls.length} URLs for ${domain}`);

    // 测试采样逻辑
    const sampled = CrawlerService.sampleUrls(urls, 40);
    console.log(`[Crawler] Sampled ${sampled.length} URLs:`);
    console.log(JSON.stringify(sampled, null, 2));

    // 统计各深度数量
    const depths: Record<number, number> = {};
    sampled.forEach((u: string) => {
        try {
            const path = new URL(u).pathname.replace(/\/$/, '');
            const d = path === '' ? 0 : path.split('/').length - 1;
            depths[d] = (depths[d] || 0) + 1;
        } catch (e) {
            depths[0] = (depths[0] || 0) + 1;
        }
    });
    console.log('\n[Depth Distribution of Sampled URLs]:');
    console.log(depths);
}

main().catch(console.error);
