## 1. 爬虫提速（Crawler Speed Optimization）

- [x] 1.1 修改 `crawler.service.ts`：根据 `WEBSHARE_API_KEY` / `CRAWLER_PROXY_HOST` 区分三种模式，设置对应并发数（8 / 2 / 5）
- [x] 1.2 修改 `crawler.service.ts`：Webshare 池模式下移除 400-800ms jitter 延迟（ 单代理模式保留）
- [x] 1.3 修改 `fetcher.ts`：将请求超时从 30000ms 改为 15000ms

## 2. AuditAnalyzer 核心服务

- [x] 2.1 新建 `src/lib/skills/site-intelligence/audit-analyzer.ts`：定义 `IssueItem` 和 `AuditIssueReport` 类型接口
- [x] 2.2 实现 15 类问题检测逻辑（死链、缺失H1、标题/描述合规、OG图、薄内容、加载速度、Canonical、全站重复检测）
- [x] 2.3 实现三维评分算法（techScore / contentScore / seoScore），所有分数 clamp 到 [0, 100]
- [x] 2.4 为每类问题定义 `title` / `explanation` / `howToFix` 中文文案（面向 SEO 小白）
- [x] 2.5 导出 `analyzeAudit(pages: ScrapedPage[]): AuditIssueReport` 函数

## 3. API 层扩展

- [x] 3.1 修改 `audit/route.ts`：在 `done` 事件中调用 `analyzeAudit`，并在 SSE payload 中携带 `issueReport`
- [x] 3.2 修改 `instant-audit/page.tsx`：在 state 中新增 `issueReport` 字段，监听 `done` 事件时保存
- [x] 3.3 修改 `save/route.ts`：接收 `issueReport` 参数，存入 `SiteAudit.report` JSON（`{ graphData, techScore, issueReport }`）
- [x] 3.4 修改 `save/route.ts` 的请求体类型，将 `issueReport` 从 `instant-audit/page.tsx` 的 `handleSaveSite` 中一并传入

## 4. 即时审计页 — 侧边栏摘要卡片

- [x] 4.1 新建 `src/components/dashboard/site-intelligence/IssueCard.tsx`：单条问题展示卡，含 severity badge、中文标题、展开/收起受影响页面列表
- [x] 4.2 在 `instant-audit/page.tsx` 侧边栏新增"发现问题"摘要卡片：显示严重 / 警告 / 提示数量，状态为 `GALAXY_CONSTRUCTED` 时显示
- [x] 4.3 摘要卡片无问题时显示"✓ 未发现问题"绿色状态

## 5. 站点控制台 — 体检报告标签页

- [x] 5.1 新建 `src/components/dashboard/site-intelligence/HealthReport.tsx`：完整体检报告组件，含三维评分卡 + 问题列表
- [x] 5.2 评分卡颜色编码：≥80 绿色，50-79 琥珀色，<50 红色
- [x] 5.3 问题列表按严重性排序（critical → warning → info），每条可展开查看受影响页面
- [x] 5.4 历史审计无 `issueReport` 时渲染空状态提示："此次历史审计无体检数据，请重新扫描"
- [x] 5.5 修改 `[siteId]/page.tsx`：在现有 tabs 中插入"体检报告"标签，加载最新 audit 的 `issueReport` 并传入 `<HealthReport />`

## 6. 验证

- [x] 6.1 本地运行 `npm run dev`，进入即时审计页扫描 `scaletotop.com`，确认扫描速度提升
- [x] 6.2 扫描完成后侧边栏显示"发现问题"摘要（有问题时显示数量，无问题时显示绿色"✓"）
- [x] 6.3 点击"保存到控制台"后进入站点控制台，"体检报告"标签页展示三维评分和问题列表
- [x] 6.4 每条问题卡片可展开，显示受影响页面 URL 列表，中文说明和修复指引均正常显示
- [x] 6.5 切换到一条旧的历史审计记录，体检报告标签页显示空状态提示
