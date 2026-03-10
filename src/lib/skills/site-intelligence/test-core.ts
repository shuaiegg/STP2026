import { CrawlerService } from './crawler.service';
import { GraphGeneratorService } from './graph-generator.service';

async function main() {
    console.log("🚀 STP2026 核心引擎集成测试开始...");
    
    // 1. 测试全站探测 (限制爬取 5 个页面进行快速验证)
    console.log("🔍 正在探测 scaletotop.com...");
    const auditResult = await CrawlerService.performFullAudit("https://scaletotop.com");
    console.log(`✅ 抓取完成！共发现 ${auditResult.pageCount} 个页面，成功抓取 ${auditResult.pages.length} 个。`);
    
    // 2. 测试星图转换
    console.log("🗺️ 正在生成 3D 星图数据...");
    const graphData = GraphGeneratorService.generateGraphData(auditResult);
    console.log("✅ 星图生成成功！");
    console.log(`📊 Nodes: ${graphData.nodes.length}, Links: ${graphData.links.length}`);
    
    if (graphData.nodes.length > 0) {
        console.log("🌟 第一个 Node 数据:", JSON.stringify(graphData.nodes[0], null, 2));
    }
}

main().catch(e => {
    console.error("❌ 测试过程中发生错误:", e);
    process.exit(1);
});
