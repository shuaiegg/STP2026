## Context

爬虫（`crawler.service.ts` + `parser.ts`）每次扫描采集 `ScrapedPage[]`，包含：`url`, `title`, `description`, `h1`, `h2[]`, `h3[]`, `loadTime`, `status`, `wordCount`, `internalLinks[]`, `externalLinks[]`, `hasOgImage`, `canonicalUrl`。

当前数据流：`pages[]` → `GraphGeneratorService` → `graphData` → `SiteAudit.report`（JSON）。`techScore` 仅由平均加载时间换算，其余字段未被使用。

代理管理（`proxy-manager.ts`）已对接 Webshare API，生产环境维护 100 个代理池，但爬虫并发逻辑以 `CRAWLER_PROXY_HOST` 是否存在判断"是否有代理"，导致 Webshare 池和本地单代理被等同对待（并发 2，附 400-800ms jitter）。

## Goals / Non-Goals

**Goals:**
- 在现有 `ScrapedPage[]` 数据之上，零额外爬取地生成 SEO 问题报告
- 三维评分（0-100）：技术健康 / 内容质量 / SEO 合规
- 15 类问题检测，每条问题含中文说明 + 修复指引 + 受影响页面列表
- 将 `issueReport` 持久化至 `SiteAudit.report` JSON（无 schema 变更）
- Webshare 代理池模式下并发从 2 提升至 8，去除不必要 jitter

**Non-Goals:**
- 不引入额外爬取（Core Web Vitals、Lighthouse、backlink 等需要外部 API）
- 不修改数据库 schema
- Phase 2 功能（AI 修复建议、历史对比、PDF 导出）不在本次范围

## Decisions

### 1. AuditAnalyzer 作为纯函数服务

**决定**：`audit-analyzer.ts` 导出纯函数 `analyzeAudit(pages: ScrapedPage[]): AuditIssueReport`，无副作用，无外部依赖。

**原因**：便于单测，便于在 API route 内任意位置调用，不引入新的类或单例。

**备选**：作为 class service（类似 `GraphGeneratorService`）——但无状态场景下纯函数更简洁。

### 2. 存储位置：扩展现有 JSON 字段

**决定**：`SiteAudit.report` 已是 `Json?` 字段，将结构从 `{ graphData, techScore }` 扩展为 `{ graphData, techScore, issueReport }`。

**原因**：无需数据库迁移，与现有读写路径兼容，issueReport 体积可控（问题列表，非原始 pages）。

**备选**：新增 `SiteAudit.issueReport Json?` 列——需要 `prisma migrate`，对 Vercel 生产部署增加风险。

### 3. 代理模式区分策略

**决定**：以 `WEBSHARE_API_KEY` 是否存在作为"代理池模式"标志，`CRAWLER_PROXY_HOST` 存在且无 `WEBSHARE_API_KEY` 为"单代理模式"。

```typescript
const isWebsharePool = !!process.env.WEBSHARE_API_KEY;
const isLocalProxy   = !!process.env.CRAWLER_PROXY_HOST && !isWebsharePool;
const concurrency    = isWebsharePool ? 8 : isLocalProxy ? 2 : 5;
const jitter         = isLocalProxy; // 仅单代理模式加抖动
```

**原因**：Webshare 池每请求轮转不同 IP，无需限速；本地 Clash 单 IP 需要抖动避免触发速率限制。

**备选**：通过新增 `CRAWLER_CONCURRENCY` 环境变量手动配置——灵活但需要用户操心，不如自动感知。

### 4. 评分公式

每个维度从 100 分开始，按问题扣分：

```
技术健康 = 100
  - 死链比例 × 40        (每 1% 死链扣 0.4 分，最多 -40)
  - 平均加载时间惩罚      (>1s 线性扣分，>5s 最多 -30)
  - canonical 缺失率 × 30

内容质量 = 100
  - H1 缺失率 × 35
  - 薄内容比例 × 30      (<300 词)
  - 标题不合规率 × 35    (缺失/过长/过短)

SEO 合规 = 100
  - Meta 描述缺失率 × 30
  - OG 图缺失率 × 25
  - 全站重复标题/描述惩罚 × 25
  - Meta 描述过长率 × 20
```

所有维度 clamp 到 [0, 100]。

## Risks / Trade-offs

- **issueReport 数据量**：受影响页面列表仅存 URL + 简短 detail 字符串，不存完整 page 对象，控制单次审计报告在 ~50KB 以内。
- **并发 8 可能触发目标站点限流**：爬取自己站点（scaletotop.com）无此问题；爬取第三方站点需注意。Webshare 轮转 IP 能缓解大多数限流，但无法保证 100%。若报错率上升，`crawler.service.ts` 已有 `errorCount > 2 → currentLimit = 1` 的退避策略，可自动降级。
- **历史审计数据缺少 issueReport**：旧 audit 记录的 `report` JSON 中无 `issueReport` 字段，体检报告标签页需做空值处理，提示"此次历史审计无体检数据，请重新扫描"。

## Migration Plan

1. 部署新代码（无 schema 变更，无需 `prisma migrate`）
2. 历史审计记录展示兼容：`issueReport` 为 null 时渲染空状态提示
3. 回滚：删除新增文件 + 还原 4 个修改文件，无数据库影响
