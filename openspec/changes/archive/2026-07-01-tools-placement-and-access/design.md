## Context

- geo-writer 组件在 `[locale]/(public)/tools/geo-writer/page.tsx`(大客户端组件):读 searchParams(keyword/pillar/siteId/plannedArticleId)、调 generate-enrich/generate-stream、用 `@/i18n/navigation` Link、有"目标网站域名"文本框(`form.siteId`=域名)。
- 指向 `/tools/geo-writer` 的入口(已普查):`(public)/tools/page.tsx`、`consultation/ConsultationForm`、`dashboard/tools/page.tsx`、`dashboard/library/page.tsx`、`StrategyBoard`(带 plannedArticleId)、`ContentAssetBlueprint`×3(带 keyword/pillar/siteId)、`registry.ts`、`email/templates/consultation-confirmation`×2。
- `/tools` 公共页列 3 工具,仅 geo-writer 存在(其余 404);`dashboard/tools` 另有一份列表。
- `saveToBlogDraft` 是 ADMIN-only;库编辑"提交修改并入库"= `updateTrackedArticle`(存自己的内容库)。
- 已修:DNA 注入(传 UUID)、内链(siteId)、闭环连接——但都靠 URL 传参,搬进 dashboard 后可改为上下文取,根除脆弱。

## Goals / Non-Goals

**Goals:**
- 生产工具在仪表盘内闭环(无跳转);siteId 走上下文,根除域名/UUID 混淆。
- /tools 成为诚实、转化导向的营销页(无死链)。
- 站内/邮件所有入口正确;旧公共 URL 301 不断。
- 用户视图清理(库"保存";隐藏 admin-only 博客草稿)。

**Non-Goals:**
- 不改 geo-writer 生成/审计/内链/闭环的内部逻辑(只迁移位置与取参)。
- 不做订阅分层闸(另排)、不做公共 demo(纯营销→注册)。
- 不实现 maps-scraper 等其它工具(营销页只展示/标即将推出)。
- 不引入 schema/模型路由变更。

## Decisions

1. **挂载方式(D2=整体搬进)**:在 `(protected)/dashboard/tools/geo-writer/page.tsx` 渲染 geo-writer。优先**把组件抽成共享组件**供 dashboard 路由使用;公共路由保留为 301 重定向。dashboard 包裹在 DashboardShell(有侧边栏)。
   - locale:dashboard 走 `User.locale`(NextIntlClientProvider 已注入),组件内 Link 改 next/link(dashboard 非 locale 路由)。
   - siteId:从**仪表盘当前站点上下文/站点选择器**取(已登录、已有 sites);**移除"目标网站域名"文本框**与 `form.siteId`。keyword/pillar/plannedArticleId 仍可经 query 传入(来自蓝图/策略板)。
2. **/tools 营销页**:静态营销内容(无实时工具)。用 `copywriting` 技能 + `.agents/product-marketing.md` 产出:每个能力一段(结果导向 + 诚实),CTA→注册/免费审计。未实现工具**移除链接或标"即将推出"**(不可点死链)。
3. **改链策略**:
   - **站内**(蓝图/策略板/library/dashboard-tools/registry)→ `/dashboard/tools/geo-writer?...`(保留 keyword/pillar/plannedArticleId query)。
   - **邮件模板**(收件人未登录)→ 指向**营销页**或登录(不指向需登录的 dashboard 深链)。
   - **咨询表单**→ 营销页或登录。
4. **301 重定向**:`src/middleware.ts` 加 `/tools/geo-writer` 与 `/zh/tools/geo-writer` → `/tools`(营销页)或 `/login`。保留 `/tools`(营销页,留在 sitemap)。
5. **清理**:库编辑按钮 "提交修改并入库"→"保存";geo-writer 的"保存为博客草稿"按钮**仅 admin 可见**(检测 role)。

## Risks / Trade-offs

- **组件搬迁**:公共→dashboard 的 layout/locale/auth 适配是主要风险(地址栏 locale、Link 类型、shell 包裹)。建议抽共享组件,两处薄封装。
- **大面积改链**:10+ 处 + 邮件,漏一处就 404/错跳。需全量 grep 校验 + 各入口冒烟。
- **邮件落地**:邮件指向登录后的 dashboard 深链对未登录收件人无意义 → 指营销页/登录。
- **SEO**:公共 geo-writer 若被索引,301 保权重;/tools 营销页对 SEO 更有利(关键词落地页)。
- **onboarding 首跑**:新用户写第一篇必须在 shell 内(第一印象)——搬迁后天然满足。

## Implementation Notes (for Gemini / Antigravity)

**已知遗留冲突:**
- `form.siteId` 是域名文本框,**搬进 dashboard 后删除它**,siteId 从上下文取(根除之前 DNA/内链 bug 的根源)。
- geo-writer 用 `@/i18n/navigation` Link(locale 路由);dashboard 版改 next/link。
- `saveToBlogDraft` ADMIN-only:用户视图隐藏该按钮。
- 已修的 DNA 注入/内链 siteId/闭环连接逻辑要**保留**,只是 siteId 来源从 URL 改上下文。

**禁止触碰范围:**
- 不改 geo-writer 生成/审计/内链/闭环内部逻辑、模型路由、积分。
- 不引入订阅闸、不实现其它工具。

**本 change 边界(只允许改动):**
- 新增:`(protected)/dashboard/tools/geo-writer/page.tsx`(+ 可能抽出的共享组件)。
- 改:geo-writer 组件(siteId 上下文化、locale/Link 适配、博客草稿按钮 admin-only)、`(public)/tools/page.tsx`(营销页)、`middleware.ts`(301)、10+ 处链接、2 封邮件模板、库编辑文案、`messages`(营销页 + 文案,用「您」)。

**其他注意事项:**
- 营销页文案走 `copywriting` 技能 + `.agents/product-marketing.md`;英文引 `rules/voice-en.md`;诚实(无 vaporware/过度宣称)。
- 全量 grep `tools/geo-writer` 确认无残留旧链;各入口(蓝图/策略板/library/onboarding 首跑/邮件)冒烟。
- `tsc` 保持仅 1 预存 auth.ts 错误;i18n-auditor + design-checker。
