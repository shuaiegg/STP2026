const https = require('https');

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function verify() {
    console.log("🔍 正在通过原生 Node 验证全站探测链路...");
    try {
        const sitemap = await fetchUrl("https://scaletotop.com/sitemap.xml");
        const urls = sitemap.match(/<loc>(.*?)<\/loc>/g).map(s => s.replace(/<\/?loc>/g, ''));
        console.log(`✅ Sitemap 成功抓取！发现 URL 数量: ${urls.length}`);
        
        const firstPage = await fetchUrl(urls[0]);
        const titleMatch = firstPage.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : "No Title Found";
        console.log(`✅ 页面 [${urls[0]}] 抓取成功！`);
        console.log(`📌 Title: ${title}`);
    } catch (e) {
        console.error("❌ 验证失败:", e.message);
    }
}

verify();
