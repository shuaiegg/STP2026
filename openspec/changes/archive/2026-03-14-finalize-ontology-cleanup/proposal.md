## Why

`site-intelligence-evolution` 变更已全部实现并合并，但遗留两处技术债：`Site.businessOntology` 废弃字段仍占用数据库列（无代码写入，但未删除），以及 `semantic-gap` API 的响应 key 沿用旧名 `businessOntology`（实际返回的是 `SiteOntology` 对象），造成命名误导。本次做最终收尾清理。

## What Changes

- **`prisma/schema.prisma`** — **BREAKING** 删除 `Site.businessOntology Json?` 字段，运行 migration 彻底移除数据库列
- **`/api/dashboard/sites/[siteId]/semantic-gap/route.ts`** — 将两处响应体中的 `businessOntology: latestOntology` 改名为 `ontology: latestOntology`
- **`src/app/(protected)/dashboard/site-intelligence/[siteId]/components/OverviewPanel.tsx`** — 将读取 `semanticData?.businessOntology` 的三处引用改为 `semanticData?.ontology`

## Capabilities

### New Capabilities
<!-- 本次为纯清理变更，无新增能力 -->

### Modified Capabilities
<!-- 无规范层行为变更，仅命名修正 -->

## Impact

- **受影响文件（3 个）**：
  - `prisma/schema.prisma`
  - `src/app/api/dashboard/sites/[siteId]/semantic-gap/route.ts`
  - `src/app/(protected)/dashboard/site-intelligence/[siteId]/components/OverviewPanel.tsx`
- **需要 `prisma migrate dev`**：删除 `Site.businessOntology` 列（不可回滚，需确认无历史数据依赖）
- **无 API 行为变更**：`semantic-gap` 端点响应结构变化（key 改名），前端同步更新，外部调用方无影响
