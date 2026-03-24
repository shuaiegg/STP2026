## Context

站点审计引擎分四层：**Fetcher**（HTTP 采集）→ **Parser**（HTML 解析）→ **Analyzer**（问题检测 + 评分）→ **UI**（展示 + 交互）。本次所有 bug 均在代码层面，无需 DB schema 变更。

## Goals / Non-Goals

**Goals:**
- 修复 CJK 词数统计，消除中文站点系统性误报
- 修复 Business DNA 正则，恢复该功能
- 修复 AuditHistoryPanel URL 参数，恢复跨页跳转
- 保护用户积分：审计失败退款、审计成功自动保存
- 修正评分模型语义：canonical 属 SEO 分而非技术分
- 新增 MISSING_SITEMAP 检测
- 提升 LLM 聚类质量：预过滤无效页面

**Non-Goals:**
- 不引入外部 SEO API（Lighthouse、PageSpeed Insights）
- 不修改 Prisma schema
- 不实现按页面重要性加权评分
- 不实现 sitemap 自动生成建议

## Decisions

### 1. CJK 词数统计：混合语言估算

**问题**：`bodyText.split(' ').length` 对中文失效。"让你的海外业务每月稳定新增50+优质询盘" 按空格分割只算 1-2 词。

**方案**：
```typescript
function estimateWordCount(text: string): number {
  // 提取并计数 CJK 字符（汉字、日文、韩文）
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  // 提取并计数西文词汇（按空格分割的非空 token）
  const latinWords = text.replace(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g, ' ')
                         .split(/\s+/).filter(Boolean).length;
  // CJK: 1 字符 ≈ 0.6 英文词（估算信息密度）
  return Math.round(cjkChars * 0.6 + latinWords);
}
```

**THIN_CONTENT 阈值**：维持 300，但意义变为"等效英文词数"。一篇 500 中文字的文章估算 ≈ 300 词，恰好过线，符合直觉。

**备选**：统一用字符数，阈值改为 600。被否：字符数对英文不公平（英文 600 字符约 100 词）。

---

### 2. Business DNA 正则修复

**问题**：`crawler.service.ts:343` 的 `/\\{[\\s\\S]*\\}/` 在 JS regex 字面量中等价于匹配 `\{...\}`，永远匹配不到正常 JSON。

**方案**：直接修正为 `/\{[\s\S]*\}/`，与同文件 `clusterPages`（line 405）保持一致。

**一行改动，零风险。**

---

### 3. 审计失败退款

**流程**：
```
POST /api/dashboard/site-intelligence/audit
  ↓ chargeUser() 扣积分
  ↓ SSE stream 开始
  ↓ [熔断器触发] CrawlerCircuitBreakerError
  ↓ send({ type: 'error', ... })
  ↓ [新增] refundUser(session.user.id, 'SITE_AUDIT_BASIC', '审计失败退款')
  ↓ controller.close()
```

**注意**：普通网络错误（单页 404、超时）不退款；只有熔断器触发（站点完全不可达）才退款。

**退款 API**：复用现有 `CreditTransaction` 机制，类型为 `REFUND`。

---

### 4. 审计完成自动保存

**当前行为**：`done` 事件触发后设置 `status = 'GALAXY_CONSTRUCTED'`，用户需手动点"持久化同步"。

**新行为**：
- 如果 `activeSiteId` 存在（已绑定站点），`done` 事件后自动调用 `handleSaveSite()`，用户无需操作
- 如果无 `activeSiteId`（临时扫描），保留手动保存按钮，但在顶部显示 warning banner："⚠️ 扫描结果未保存，离开页面将丢失"
- 移除 `status === 'GALAXY_CONSTRUCTED' && !activeAuditId` 的显示条件判断——改为仅在"无 siteId"时显示

**浏览器关闭保护**（可选，P3）：对临时扫描添加 `beforeunload` 事件，提示用户数据未保存。

---

### 5. MISSING_SITEMAP 检测

**数据流**：`CrawlerStrategy.discoverUrls` → `CrawlerStrategy.crawlSitemap` 内部已知 sitemap 是否成功。

**透传方案**：
```typescript
// types.ts - SiteAuditResult 新增字段
sitemapFound: boolean;

// strategy.ts - crawlSitemap 返回状态
static async discoverUrls(domain: string): Promise<{ urls: string[]; sitemapFound: boolean }> { ... }

// audit-analyzer.ts - analyzeAudit 接收新参数
export function analyzeAudit(pages: ScrapedPage[], meta?: { sitemapFound?: boolean }): AuditIssueReport
```

**问题定义**：`MISSING_SITEMAP`，warning 级别，影响页面：`[domain]`（站点级别，非具体页面）。

**评分影响**：纳入 `seoScore` 扣分：`sitemapFound ? 0 : 10`。

---

### 6. Canonical 评分迁移

**现状**：
```typescript
// techScore（错误位置）
const canonicalMissingRate = missingCanonical.length / totalPages;
techScore = 100 - deadLinkPenalty - loadTimePenalty - (canonicalMissingRate * 30)
```

**修正**：
```typescript
// techScore：仅衡量可访问性 + 性能
techScore = 100 - (deadLinkRatio * 40) - loadTimePenalty

// seoScore：加入 canonical
seoScore = 100 - (missingMetaDescRate * 30) - (missingOgImageRate * 25)
         - duplicatePenalty - (metaDescTooLongRate * 20)
         - (canonicalMissingRate * 15)   // 权重从 30 调为 15，避免 seoScore 过于苛刻
         - (sitemapFound ? 0 : 10)       // MISSING_SITEMAP 惩罚
```

---

### 7. clusterPages 预过滤

**现状**：所有采集到的页面，包括 `/login`、`/privacy`、`/terms`，都发给 LLM 聚类。

**方案**：在 `clusterPages` 调用前，用 URL path 对 `TOPIC_BLACKLIST` 做预过滤：

```typescript
const meaningfulPages = pages.filter(p => {
  const path = new URL(p.url).pathname.toLowerCase();
  return !TOPIC_BLACKLIST.some(term => path.includes(term));
});
// 只把 meaningfulPages 发给 LLM，其余直接标记 topic = 'System/Boilerplate'
```

**中文黑名单补充**：
```typescript
// constants.ts 追加
'登录', '注册', '隐私', '条款', '协议', '政策', '关于', '联系', '帮助', '常见问题'
```

---

### 8. sampleUrls 确定性采样

**现状**：`sort(() => Math.random() - 0.5)` — 每次运行结果不同。

**方案**：用 URL 字符串做简单哈希替代随机排序：

```typescript
function hashUrl(url: string): number {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// 替换 .sort(() => Math.random() - 0.5)
const shuffled = [...urls].sort((a, b) => hashUrl(a) - hashUrl(b));
```

同一站点、同一批 URL，每次采样结果相同，历史评分可横向比较。

---

### 9. ORPHAN_PAGE 排除 sitemap 页面

**现状**：`analyzeAudit` 不知道哪些 URL 是从 sitemap 发现的。

**方案**：`analyzeAudit` 新增可选参数 `meta.sitemapUrls?: string[]`，在构建 `referencedUrls Set` 时预先加入 sitemap URL：

```typescript
if (meta?.sitemapUrls) {
  meta.sitemapUrls.forEach(u => referencedUrls.add(u));
}
```

从 sitemap 发现的页面，即使无内链指向，也不标记为孤儿。

---

### 10. AuditHistoryPanel URL 参数修复

**现状**：
```typescript
href={`/dashboard/site-intelligence/instant-audit?site=${encodeURIComponent(domain)}`}
```

**修正**：
```typescript
href={`/dashboard/site-intelligence/instant-audit?siteId=${siteId}&auditId=${audit.id}`}
```

`AuditHistoryPanel` 已有 `siteId` prop，直接使用即可。

---

### 11. 历史记录无 graphData 的按需加载

**现状**：第 6 条以后的历史记录，`audit.graphData` 为 null，点击 `handleHistoryClick` 静默返回。

**方案**：检测到 `!audit.graphData` 时，不直接返回，而是发起单条审计 fetch：

```typescript
const handleHistoryClick = async (audit: AuditHistoryItem) => {
  if (!audit.graphData && activeSiteId) {
    // 按需加载
    await fetchSpecificAudit(activeSiteId, audit.id);
    return;
  }
  // ...原有逻辑
};
```

视觉上：历史列表项加 loading spinner，点击后进入加载状态。

---

### 12. scoreTrend 修正

**现状**：`techScore - auditHistory[1].techScore`，查看第 N 条历史时比较的永远是第 2 新的记录。

**修正**：根据 `activeAuditId` 在 `auditHistory` 中找到当前记录的索引 `idx`，取 `auditHistory[idx + 1]` 作为对比基准：

```typescript
const activeIdx = auditHistory.findIndex(a => a.id === activeAuditId);
const prevAudit = activeIdx >= 0 && activeIdx + 1 < auditHistory.length
  ? auditHistory[activeIdx + 1]
  : null;
const scoreTrend = (prevAudit?.techScore != null && techScore != null)
  ? techScore - prevAudit.techScore
  : null;
```

---

### 13. 节点详情关联 issue

**现状**：点击星图节点，侧边面板只显示标题、权重、加载时间、URL。

**方案**：当 `selectedNode` 非 null 且 `issueReport` 存在时，过滤出命中该 URL 的 issue 列表：

```typescript
const nodeIssues = issueReport?.issues?.filter(
  issue => issue.affectedPages?.some((p: any) => p.url === selectedNode.meta?.url)
) ?? [];
```

在节点详情面板底部，用简化版 `IssueCard`（只显示 code badge + title）展示 `nodeIssues`。

---

### 14. Delta 对比：增强到受影响页面数

**现状**：比较 issue code 的出现/消失。`DUPLICATE_TITLE` 从影响 5 页降到 2 页，显示"无变化"。

**方案**：对同时存在于新旧报告的 issue code，额外比较 `affectedPages.length`：

```typescript
const persistentIssueChanges = Array.from(currentCodes)
  .filter(code => previousCodes.has(code))
  .map(code => {
    const cur = issueReport.issues.find(i => i.code === code);
    const prev = previousIssueReport.issues.find(i => i.code === code);
    const delta = (cur?.affectedPages.length ?? 0) - (prev?.affectedPages.length ?? 0);
    return { code, title: cur?.title, delta };
  })
  .filter(c => c.delta !== 0);
```

在 Delta banner 里新增一行：每个有变化的持久 issue 显示 `↓ 2页` 或 `↑ 1页`。

---

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| CJK 词数估算系数（0.6）不精准 | 此系数来自实测（500 汉字≈300 词），可配置 constant |
| 自动保存可能在 SSE 传输不完整时触发 | `done` 事件只在服务端 `controller.close()` 前推送，数据完整性有保障 |
| sampleUrls 改为确定性后，小站点（<100页）不受影响（全量扫描） | 仅大站点有感知，属预期 |
| ORPHAN_PAGE 加入 sitemap URL 后，真正孤儿被漏报（sitemap 里有但内链没有） | sitemap 中有即可被爬虫发现，不属于真正孤儿；这是修正，非漏报 |
| 退款 API 并发问题 | 使用数据库事务保证幂等性，与现有 CreditTransaction 机制一致 |

## Migration Plan

无需 DB migration。所有变更为代码层面，部署后立即生效：
- 历史审计记录不受影响（CJK 词数修复仅影响新扫描）
- 历史记录中无 `sitemapFound` 字段时，`analyzeAudit` 对其做 null 兜底
- 评分模型变化（canonical 迁移）会导致新旧分数不可直接比较；建议在 UI 上标注"评分模型已于 2026-03-24 更新"
