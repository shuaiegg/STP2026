## Context

首页 mobile LCP 为 7.0s（目标 <2.5s），核心原因已通过 PageSpeed + 代码审查定位到三处：
1. Hero H1 使用 `opacity-0` 作为初始状态，CSS animation 结束前 LCP 无法触发
2. Google Fonts 通过外部 `<link>` 加载（无 `display=swap`），字体文件下载阻塞文字渲染
3. 首页 Server Component 串行等待 `getPublishedContent()` DB 查询，TTFB 被 DB 延迟拖慢

同时，`SeoMeta.schemaJson` 字段已在数据库中存在且 admin 可配置，但从未在公开页面输出过；Homepage、pricing、tools、blog 四个页面完全缺失 JSON-LD。

## Goals / Non-Goals

**Goals:**
- LCP 从 7.0s 降至目标 <3.5s（mobile），趋向 <2.5s
- Hero 入场动画视觉效果完全保留
- 字体加载消除外部 DNS 往返，改为 Vercel edge 自托管
- `/blog` 首屏 stream 不依赖 DB 查询
- 5 个核心页面获得正确 JSON-LD，通过 Google Rich Results Test
- `SeoMeta.schemaJson` 内容首次在前端渲染生效

**Non-Goals:**
- 不修改 admin 后台的 SeoMeta 编辑界面
- 不改动 Prisma schema 或数据库
- 不处理 `/blog` 列表页的内容补充（薄内容问题单独处理）
- 不引入新的第三方依赖

## Decisions

### D1：动画修改方式 — 只去掉 opacity，保留 transform

**决策**：修改 `slideInUp` keyframe，去掉 `opacity: 0 → 1` 变化，只保留 `transform: translateY(16px) → translateY(0)`。同时从 hero 元素的 className 中去掉 `opacity-0`。

**理由**：LCP 算法不计算 `opacity: 0` 的元素，只要元素初始可见，LCP 立即触发。动画效果（从下方滑入）完全保留，用户体验无变化。

**备选方案**：完全移除入场动画 → 被否定，动画是品牌调性的一部分。

### D2：字体加载 — next/font/google 替换 `<link>`

**决策**：在 `layout.tsx` 中使用 `next/font/google` 加载 Plus Jakarta Sans、Instrument Sans、JetBrains Mono，通过 CSS 变量注入到 `@theme inline` 中。

**理由**：`next/font/google` 在构建时下载字体并从 Vercel CDN 提供，消除运行时对 `fonts.googleapis.com` 的外部请求。自动添加 `font-display: swap`，文字用 fallback 字体立即渲染，字体加载完成后 swap。

**注意**：Noto Sans SC（CJK fallback）不通过 next/font 加载，保留在 CSS `font-family` stack 中作为系统字体 fallback，避免下载数 MB 的中文字体文件。

**备选方案**：在 Google Fonts URL 加 `&display=swap` → 仍有外部请求，只解决 FOIT，不解决网络往返。

### D3：Suspense Streaming — 仅包裹 DB 依赖区块

**决策**：将首页 "Featured Content" 区块拆分为独立异步组件 `<FeaturedPosts />`，包裹在 `<Suspense fallback={<PostsSkeleton />}>` 中。Hero、Metrics Bar、Client Logos、How It Works、Method Combination、Testimonials 等静态区块立即 stream。

**理由**：Hero（LCP 元素）完全是静态 `COPY` 常量，不需要任何 DB 数据。当前实现中 `await getPublishedContent()` 阻塞了整个页面的 HTML 输出。分离后，TTFB 降低，FCP/LCP 更早触发。

**Skeleton 设计**：3 个占位卡片，保持与实际卡片相同的 `aspect-[16/10]` 比例和高度，避免 CLS。

### D4：JSON-LD 架构 — 集中 builder + 极简组件

**决策**：
```
src/lib/schema.ts      ← 纯函数 builder，返回 Schema.org 对象
src/components/JsonLd.tsx  ← <script type="application/ld+json"> 包装器
```

各页面直接在 Server Component 中调用 builder，传入 `<JsonLd>`，紧跟页面 JSX 返回的顶层节点。

**理由**：Next.js App Router 官方推荐方式，SSR 时已在 HTML 中，爬虫无需执行 JS。不引入外部 schema 库（如 `schema-dts`），避免依赖膨胀。

**builder 函数清单**：
- `buildOrganization()`：固定常量，返回 Organization schema
- `buildWebSite()`：返回 WebSite schema（含 `url`）
- `buildArticle(post)`：从 Content 对象生成 BlogPosting schema
- `buildBreadcrumb(items)`：生成 BreadcrumbList
- `buildService()`：pricing 页 Service schema
- `buildWebApp()`：tools 页 WebApplication schema

**blog post schema 优先级**：`seoMeta.schemaJson`（管理员自定义）> `buildArticle(post)`（自动生成）

### D5：logo URL — 使用已生成的 PNG

**决策**：Organization schema 的 `logo` 字段使用 `https://www.scaletotop.com/logo-512.png`（已在 `public/` 生成）。

**理由**：Google Rich Results 推荐绝对 URL 且尺寸 ≥112×112 的图片。SVG 虽然技术上受支持，但部分工具不识别。512×512 PNG 满足所有验证器要求。

## Risks / Trade-offs

**[风险] next/font 与现有 CSS 变量冲突**
→ `next/font/google` 会生成自己的 CSS 变量名（如 `--font-plus-jakarta-sans`）。需要在 `@theme inline` 中手动将 `--font-display` 等映射到 next/font 生成的变量，确保 Tailwind 类名不断。验证方式：构建后检查 `font-display` class 是否正常渲染。

**[风险] Suspense fallback 引起 CLS**
→ Skeleton 占位高度必须与实际内容高度接近。使用固定高度的 skeleton 卡片（`h-[320px]`）而非依赖内容撑开，避免内容加载后布局抖动。

**[风险] slideInUp 修改影响其他使用处**
→ `slideInUp` keyframe 和 `.animate-slide-in-up` 类在多个页面使用（blog post、pricing 等）。去掉 opacity 动画后，这些页面的元素不再有淡入效果，只有位移效果。这是可接受的折衷，位移动画本身已足够表达入场感。

**[风险] JSON-LD 数据准确性**
→ Organization 的 `contactPoint`、`areaServed` 等字段需要确认业务信息。初期只填写必填字段（`name`、`url`、`logo`），避免填写不准确信息触发 Google 警告。

## Migration Plan

1. 部署为标准 Vercel 构建（`npx prisma generate && next build`），无需数据库变更
2. 上线后立即用 [Google Rich Results Test](https://search.google.com/test/rich-results) 验证 5 个页面的 JSON-LD
3. 24 小时后在 PageSpeed Insights 重新测试 homepage mobile 分数
4. 如字体渲染异常，回滚方案：恢复 `layout.tsx` 的 `<link>` 标签（5 分钟内可回滚）
5. 如 Suspense 导致 CLS，调整 skeleton 高度后重新部署

## Open Questions

- **Pricing 页 schema 类型**：`Service` 还是 `Product` + `AggregateOffer`？后者可以争取 Google 价格富摘要，但需要精确的价格字段。当前先用 `Service`，后续单独优化。
- **WebSite SearchAction**：是否添加 `SearchAction` 到 WebSite schema（支持 Google Sitelinks 搜索框）？当前站内没有搜索功能，暂不添加。
