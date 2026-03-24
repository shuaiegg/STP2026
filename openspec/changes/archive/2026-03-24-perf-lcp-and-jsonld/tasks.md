## 1. LCP 动画修复

- [ ] 1.1 修改 `src/app/globals.css`：更新 `slideInUp` keyframe，去掉 `opacity: 0 → 1` 变化，只保留 `transform: translateY(16px) → translateY(0)`
- [ ] 1.2 修改 `src/app/(public)/page.tsx`：去掉 hero badge、H1、subtitle、CTA 区块上的 `opacity-0` className

## 2. 字体自托管迁移

- [ ] 2.1 修改 `src/app/layout.tsx`：删除 `<link href="https://fonts.googleapis.com/...">` 及两个 `preconnect` 标签
- [ ] 2.2 在 `src/app/layout.tsx` 中使用 `next/font/google` 引入 Plus Jakarta Sans（weights: 400,500,600,700,800）、Instrument Sans（ital,wght: 0,400;0,500;0,600;0,700;1,400;1,500）、JetBrains Mono（weights: 400,500,600），所有字体设置 `display: 'swap'`
- [ ] 2.3 修改 `src/app/globals.css` 的 `@theme inline`：将 `--font-display`、`--font-sans`、`--font-mono` 映射到 next/font 生成的 CSS 变量

## 3. Suspense Streaming

- [ ] 3.1 在 `src/app/(public)/page.tsx` 中创建独立异步 Server Component `FeaturedPosts`，将 `getPublishedContent()` 调用移入其中
- [ ] 3.2 创建 `PostsSkeleton` 组件：3 个固定高度（`h-[320px]`）的占位卡片，样式与实际卡片一致（border、rounded-lg、bg-white）
- [ ] 3.3 在首页 JSX 中用 `<Suspense fallback={<PostsSkeleton />}>` 包裹 `<FeaturedPosts />`

## 4. JSON-LD 基础设施

- [ ] 4.1 创建 `src/components/JsonLd.tsx`：接受 `data: object` prop，输出 `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />`
- [ ] 4.2 创建 `src/lib/schema.ts`：实现 `buildOrganization()` 函数，包含 `name`、`url`、`logo`（绝对 URL `/logo-512.png`）字段
- [ ] 4.3 在 `src/lib/schema.ts` 中实现 `buildWebSite()` 函数，包含 `name`、`url` 字段
- [ ] 4.4 在 `src/lib/schema.ts` 中实现 `buildArticle(post)` 函数，生成 `BlogPosting`，包含 `headline`、`datePublished`（ISO 8601）、`description`、`url`、`image`（若有 coverImage）、`author`（Organization）
- [ ] 4.5 在 `src/lib/schema.ts` 中实现 `buildBreadcrumb(items: {name: string, url: string}[])` 函数，生成 `BreadcrumbList`
- [ ] 4.6 在 `src/lib/schema.ts` 中实现 `buildService()` 函数，生成 pricing 页 `Service` schema
- [ ] 4.7 在 `src/lib/schema.ts` 中实现 `buildWebApp()` 函数，生成 tools 页 `WebApplication` schema
- [ ] 4.8 在 `src/lib/schema.ts` 中实现 `buildBlog()` 函数，生成 blog 列表页 `Blog` schema

## 5. 各页面注入 JSON-LD

- [ ] 5.1 修改 `src/app/(public)/page.tsx`：在 return 顶层注入 `<JsonLd data={buildOrganization()} />` 和 `<JsonLd data={buildWebSite()} />`
- [ ] 5.2 修改 `src/app/(public)/blog/page.tsx`：注入 `<JsonLd data={buildBlog()} />`
- [ ] 5.3 修改 `src/app/(public)/blog/[slug]/page.tsx`：读取 `post.seoMeta?.schemaJson`，优先使用其内容；否则调用 `buildArticle(post)`；同时注入 `buildBreadcrumb([{ name: '首页', url: '/' }, { name: '博客', url: '/blog' }, { name: post.title, url: '/blog/' + post.slug }])`
- [ ] 5.4 修改 `src/app/(public)/blog/[slug]/page.tsx`：确认 `getPublishedContentBySlug` 的查询包含 `seoMeta { schemaJson }` 字段（如未包含则更新 Prisma 查询）
- [ ] 5.5 修改 `src/app/(public)/pricing/page.tsx`：注入 `<JsonLd data={buildService()} />`
- [ ] 5.6 修改 `src/app/(public)/tools/page.tsx`：注入 `<JsonLd data={buildWebApp()} />`

## 6. 验证

- [ ] 6.1 本地运行 `npm run build && npm run start`，确认无构建错误
- [ ] 6.2 在浏览器查看首页 HTML 源码，确认 `<script type="application/ld+json">` 存在且格式正确
- [ ] 6.3 在浏览器查看首页 HTML 源码，确认无 `fonts.googleapis.com` 请求
- [ ] 6.4 本地 DevTools Network 面板确认字体由本地/CDN 提供，无外部 Google Fonts 请求
- [ ] 6.5 使用 Google Rich Results Test（或 schema.org validator）验证首页、定价页、工具页、博客页的 JSON-LD 无错误
- [ ] 6.6 部署后使用 PageSpeed Insights 重新测试首页 mobile 分数，记录 LCP 新数值
