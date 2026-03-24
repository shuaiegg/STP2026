## Why

Mobile PageSpeed 得分 69/100，LCP 达到 7.0 秒，主要原因是 hero H1 从 `opacity-0` 开始动画（LCP 元素不可见导致测量延迟）、Google Fonts 通过外部 `<link>` 加载（额外 DNS+TCP 往返）、以及首页 Server Component 等待 DB 查询后才开始 streaming。同时，四个核心页面（homepage、pricing、tools、blog）缺少 JSON-LD 结构化数据，影响 Google 富摘要和 AI 引擎引用能力。

## What Changes

- **动画修复**：去掉 hero 元素的 `opacity-0` 初始状态，`slideInUp` keyframe 只保留 `transform` 动画，不再改变 `opacity`。LCP 元素一渲染即可见。
- **字体自托管**：将 `layout.tsx` 中的 Google Fonts `<link>` 替换为 `next/font/google`，在 Vercel edge 自托管字体，消除外部 DNS 往返。
- **Suspense Streaming**：首页 "Featured Content" 博客卡片区包裹 `<Suspense>`，hero 及静态内容立即 stream，DB 查询异步进行，改善 TTFB 和 FCP。
- **JSON-LD 结构化数据**：新增 schema builder 工具函数和极简 `<JsonLd>` 组件，在以下页面注入对应 schema：
  - `/` → `Organization` + `WebSite`
  - `/blog` → `Blog` (CollectionPage)
  - `/blog/[slug]` → `BlogPosting` + `BreadcrumbList`（优先使用 `seoMeta.schemaJson`，否则自动生成）
  - `/pricing` → `Service`
  - `/tools` → `WebApplication`

## Capabilities

### New Capabilities
- `jsonld-structured-data`: 页面级 JSON-LD schema 注入能力，包含 builder 工具函数、JsonLd 渲染组件，以及各页面类型的 schema 配置

### Modified Capabilities
- `homepage-acquisition`: hero 动画行为变更（去掉 opacity-0 初始状态）；字体加载方式变更（next/font 替换 Google Fonts link）；增加 Suspense streaming
- `page-seo-metadata`: 在现有 `generateMetadata` 基础上，各页面新增 JSON-LD script 输出（seoMeta.schemaJson 字段首次在前端渲染）

## Impact

**修改文件**：
- `src/app/layout.tsx` — 字体加载方式（next/font/google）
- `src/app/globals.css` — slideInUp keyframe 动画定义
- `src/app/(public)/page.tsx` — 去掉 opacity-0，Suspense 包裹博客区，注入 Organization + WebSite schema
- `src/app/(public)/blog/page.tsx` — 注入 Blog schema，补充 H2 结构
- `src/app/(public)/blog/[slug]/page.tsx` — 注入 BlogPosting + BreadcrumbList schema
- `src/app/(public)/pricing/page.tsx` — 注入 Service schema
- `src/app/(public)/tools/page.tsx` — 注入 WebApplication schema

**新增文件**：
- `src/lib/schema.ts` — schema builder 工具函数
- `src/components/JsonLd.tsx` — JSON-LD 渲染组件
- `public/logo-512.png`、`public/logo-192.png` — 已生成，供 Organization logo 使用

**依赖变更**：
- `next/font/google` 为 Next.js 内置，无需新增依赖
- `sharp` 已存在（用于字体优化 subsetting）

**不涉及**：数据库 schema、API 路由、认证逻辑、admin 后台
