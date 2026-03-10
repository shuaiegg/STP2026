import { CrawlerService } from './crawler.service';

async function test() {
  console.log("🚀 开始实战测试爬虫...");
  const result = await CrawlerService.performFullAudit("https://scaletotop.com");
  console.log("📊 审计结果摘要:");
  console.log(`- 域名: ${result.domain}`);
  console.log(`- 发现页面数: ${result.pageCount}`);
  console.log(`- 抓取成功页数: ${result.pages.length}`);
  if (result.pages.length > 0) {
    console.log("- 第一个页面数据:", result.pages[0]);
  }
}

test().catch(console.error);
