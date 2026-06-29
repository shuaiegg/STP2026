## 1. 加冕身份精确化

- [x] 1.1 蓝图所有 geo-writer 链接新增 `pillar=<规范话题>`(同 topic 值,语义=不可编辑身份)
- [x] 1.2 geo-writer 读 `pillar` → 独立 state；library/blog-draft 双保存路径 `sourcePillar = pillar`(不用可编辑 keyword)
- [x] 1.3 `home.ts.matchesPillar` 改：sourcePillar 精确相等优先；keywords/title 仅当 sourcePillar 为空(legacy)兜底
- [ ] 1.4 回归：多含 "SEO"/"AI" 词根的支柱不互相过配

## 2. 衡量重定高度

- [x] 2.1 library 文章行 + 蓝图支柱：已连接 URL 主展示 GSC 真实 clicks/impressions/avg position（复用 page-attribution）
- [x] 2.2 二元 SERP 徽章退为次要/移除；`PENDING(有URL)` 文案改中性"表现采集中"（不暗示主动验证）
- [x] 2.3 无 GSC 数据 → "连接 GSC 后查看真实表现"，不展示二元伪状态
- [x] 2.4 措辞延续 citation-tracking-honesty，进 messages（en/zh，用「您」）

## 3. 双模内链

- [x] 3.1 真实内链来源：该站 `TrackedArticle(url 非空)` + GSC `SiteKeywordSnapshot(page)`；按话题相关度挑 3-5 条
- [x] 3.2 内链面板：真实内链可一键"插入正文"（anchor + 真实 URL）
- [x] 3.3 集群建议：支柱未覆盖子话题/缺口 → "去写并回链"动作（不插正文）
- [x] 3.4 替换 `StellarEnricher.generateLinkRecommendations` 模板产出；硬约束：正文绝不插不存在的链接
- [x] 3.5 新站（无真实内容）→ 仅集群建议，正文无内链

## 4. 我们博客发布免回填 —— ❌ 已移除（降级回 backlog）

> 审计发现硬伤,移除孤儿自动回填:
> 1. `saveToBlogDraft` 是 ADMIN-only → 普通用户根本发不到我们博客,前提不成立。
> 2. 孤儿匹配全局按标题、无归属过滤 → SEO 标题高度雷同,会把我们博客 URL 误写到别的用户的草稿(跨用户数据写入)。
> 3. 概念错位:用户 TrackedArticle 绑自有站点,写成 scaletotop.com/blog 后 GSC 归因对不上。
> 正经做法记 backlog:存 Content↔TrackedArticle(contentId)关联,发布按 id 精确回填。手动回填 + 编辑 URL 保留。

- [x] 4.x 移除 `content.ts` 孤儿自动回填代码（保留手动回填/编辑 URL）

## 5. 加冕语义流水线感知

- [x] 5.1 蓝图 `drafted` 支柱主 CTA = "发布并连接"（强化现有回填入口）
- [x] 5.2 有 drafted 待发布支柱时，首要提示"先发布并连接 N 篇"；`crownedTopic`（写新 gap）退为其次
- [x] 5.3 回归：无任何草稿 → 加冕 = top 未覆盖 gap（与现状一致）

## 6. 验证

- [x] 6.1 `npx tsc --noEmit` 仅剩 1 预存 auth.ts 错误，零新增
- [ ] 6.2 蓝图开始写作（带 pillar）→ 改关键词 → 保存 → 加冕精确推进；相邻同词根支柱不过配
- [ ] 6.3 博客草稿发布 → TrackedArticle.url 自动连接 → 进入 GSC 归因
- [ ] 6.4 已连接文章显示 GSC 真实表现；无数据显示诚实提示（无二元伪状态）
- [ ] 6.5 内链：真实可插入正文；集群仅建议；正文无死链；新站仅集群建议
- [ ] 6.6 加冕语义：有待发布草稿优先收口；无草稿回归常态
- [ ] 6.7 i18n-auditor（蓝图/library/公开）+ design-checker（内链/衡量/加冕 UI）
- [x] 6.8 更新 backlog：勾掉本期落地项；保留 deferred（调度器/proofDensity 回流/分发闭环/GSC 自动匹配/直连 CMS/成熟站内容盘点 #4/流水线看板）
