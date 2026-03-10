const axios = require('axios');
const cheerio = require('cheerio');

async function crawlSitemap(domain) {
    const sitemapUrl = domain.endsWith('/') ? `${domain}sitemap.xml` : `${domain}/sitemap.xml`;
    const response = await axios.get(sitemapUrl);
    const $ = cheerio.load(response.data, { xmlMode: true });
    const urls = [];
    $('loc').each((_, el) => { urls.push($(el).text().trim()); });
    return urls;
}

async function scrapePage(url) {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    return {
        url,
        title: $('title').text().trim(),
        description: $('meta[name="description"]').attr('content'),
        h1: $('h1').first().text().trim()
    };
}

async function run() {
    console.log("🚀 正在验证爬虫逻辑 (Raw JS)...");
    const urls = await crawlSitemap("https://scaletotop.com");
    console.log(`✅ Sitemap 发现: ${urls.length} 个页面`);
    if (urls.length > 0) {
        const page = await scrapePage(urls[0]);
        console.log("✅ 页面抓取成功:", page);
    }
}

run().catch(err => console.error("❌ 抓取失败:", err.message));
