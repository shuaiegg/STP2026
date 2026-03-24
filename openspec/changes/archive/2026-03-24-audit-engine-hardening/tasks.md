## P0 — Bug 修复与积分保护（必须先做）

### 1. CJK 词数统计修复

- [x] 1.1 在 `parser.ts` 中新增 `estimateWordCount(text: string): number` 纯函数，对 CJK 字符（`\\u4e00-\\u9fff\\u3040-\\u30ff\\uac00-\\ud7af`）用 `× 0.6` 估算，西文按空格分词计数
- [x] 1.2 将 `extractPageData` 中的词数统计逻辑从 `bodyText.split(' ').length` 替换为 `this.estimateWordCount(bodyText)`

### 2. Business DNA 正则容错

- [x] 2.1 在 `crawler.service.ts` 的 `extractBusinessDna` 中，将 JSON 提取正则从 `match(/\\\\{[\\\\s\\\\S]*\\\\}/)` 修复为 `match(/\\{[\\s\\S]*\\}/)` (移除多余反斜杠)

### 3. AuditHistoryPanel URL 参数修复

- [x] 3.1 在 `AuditHistoryPanel.tsx` 中，将所有跳转至 `instant-audit` 的 Link 参数从 `?site=${domain}` 统一修正为 `?siteId=${siteId}`

### 4. 审计失败自动退款

- [x] 4.1 在 `src/lib/billing/credits.ts` 中新增 `refundUser(userId, skillName, reason)` 方法
- [x] 4.2 在 `audit/route.ts` 的 catch 块中，识别 `CrawlerCircuitBreakerError` 并调用 `refundUser` 进行自动退款，同时在 SSE 中发送 `refunded: true` 标记

### 5. 审计完成自动保存

- [x] 5.1 在 `instant-audit/page.tsx` 中，当 SSE 收到 `done` 事件且 `activeSiteId` 存在时，自动调用 `handleSaveSite()`
- [x] 5.2 在 HUD 状态栏增加 `SAVING_RESULTS` 状态显示（提示：正在自动保存…）

## P1 — 逻辑增强与黑名单

### 6. MISSING_SITEMAP 检测

- [x] 6.1 修改 `discoverUrls` 返回类型，增加 `sitemapFound: boolean` 字段
- [x] 6.2 在 `analyzeAudit` 中新增 `MISSING_SITEMAP` 问题检测（如果 `sitemapFound` 为 false 则报 Warning）

### 7. 评分权重迁移

- [x] 7.1 在 `analyzeAudit` 中，将 `canonicalMissingRate` 的扣分项从 `techScore` 移动到 `seoScore`
- [x] 7.2 将 `MISSING_SITEMAP` 扣分项（10分）加入 `seoScore`

### 8. 中文 Boilerplate 过滤

- [x] 8.1 在 `constants.ts` 的 `TOPIC_BLACKLIST` 中追加：`登录, 注册, 隐私, 条款, 协议, 政策, 关于, 联系, 帮助, 常见问题, 退款`

### 9. 孤儿页检测优化

- [x] 9.1 在 `analyzeAudit` 中计算 `referencedUrls` 时，如果 `sitemapFound` 为 true，将 sitemap 中的所有 URL 加入白名单以避免误报

### 10. 智能采样确定性优化

- [x] 10.1 在 `crawler.service.ts` 中新增 `hashUrl(url: string): number` 辅助函数
- [x] 10.2 在 `sampleUrls` 中将 `Math.random()` 替换为基于 `hashUrl` 的排序，确保同一站点多次审计的采样页面一致

## P2 — UX 与交互打磨

### 11. 状态标签本地化

- [x] 11.1 在 `instant-audit/page.tsx` 中定义 `STATUS_LABELS` 映射对象，将英文常量（如 `SCANNING_GALAXY`）映射为中文描述（如 `页面深度扫描中…`）

### 12. 历史记录按需加载

- [x] 12.1 在 `instant-audit/page.tsx` 中，如果点击的历史记录没有 `graphData`，则触发 `fetchSpecificAudit` 获取详情
- [x] 12.2 在历史记录列表项中，为没有 `graphData` 的项增加一个小图标或"加载"标记

### 13. Toast 替换 Alert

- [x] 13.1 在 `instant-audit/page.tsx` 中引入 `sonner` 的 `toast`
- [x] 13.2 将 `handleSaveSite` 等方法中的 `alert()` 替换为 `toast.error()` 或 `toast.success()`

### 14. 节点 Issue 联动

- [x] 14.1 在节点详情面板（HUD）增加"命中 SEO 问题"区域，列出该 URL 关联的所有 `issueItem`

### 15. ScoreTrend 相对化

- [x] 15.1 修正 `scoreTrend` 计算逻辑：不应总是对比 `history[1]`，而应对比当前查看的 `auditId` 在历史队列中的前一个记录

## P3 — 细节完善

### 16. Delta 对比增强

- [x] 16.1 在 `HealthReport.tsx` 的 Delta Banner 中，对于持续存在的问题，如果受影响页面数发生变化，显示 `DUPLICATE_TITLE: ↓ 2页` 格式

### 17. 临时扫描离开页面警告

- [x] 17.1 当 `!activeSiteId && status === 'GALAXY_CONSTRUCTED' && !activeAuditId` 时，注册 `window.beforeunload` 事件，弹出"扫描结果尚未保存，确认离开？\"提示
- [x] 17.2 保存成功后（`activeAuditId` 设置后）移除 `beforeunload` 监听
