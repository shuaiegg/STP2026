## Why

scaletotop.com 所有公共页面共享同一个全局 metadata，导致 SEO 审计检出 DUPLICATE_TITLE、DUPLICATE_META_DESC、MISSING_CANONICAL、MISSING_OG_IMAGE 四类问题，同时 `/course` 占位页触发 Critical 级 MISSING_H1 问题。这些问题直接影响搜索引擎对各页面主题的区分能力，应在正式推广前修复。

## What Changes

- **新增** `/api/og` 路由：使用 `next/og` ImageResponse 生成品牌默认 OG 图（1200×630），供所有营销页面引用
- **新增** 各公共页面独立的 `metadata` export：`/`、`/blog`、`/pricing`、`/tools`，含 title、description、canonical、og:image
- **新增** `/blog/[slug]` 的动态 og:image，使用文章 `coverImage.storageUrl`
- **修改** `/pricing/page.tsx`：拆分为 Server Component wrapper（导出 metadata）+ `PricingClient` 客户端组件
- **删除** `src/app/(public)/course/page.tsx`
- **删除** 页脚组件中指向 `/course` 的链接

## Capabilities

### New Capabilities

- `page-seo-metadata`: 各公共页面的独立 SEO metadata（title、description、canonical、openGraph），以及 OG 图动态生成路由

### Modified Capabilities

（无 spec 级别的需求变更）

## Impact

- **文件变更**：`src/app/(public)/page.tsx`、`blog/page.tsx`、`tools/page.tsx`、`pricing/page.tsx`、`blog/[slug]/page.tsx`、footer 组件
- **新文件**：`src/app/api/og/route.tsx`、`src/app/(public)/pricing/PricingClient.tsx`
- **删除文件**：`src/app/(public)/course/page.tsx`
- **依赖**：需确认 `next` 版本已包含 `next/og`（Next.js 13.3+ 内置，当前 Next.js 16 满足）
- **受众**：公共页面（SEO 初学者获客流量入口），不影响 dashboard
