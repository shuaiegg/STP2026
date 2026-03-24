## MODIFIED Requirements

### Requirement: Homepage hero communicates primary benefit for SEO beginners
The homepage hero section SHALL lead with a specific, benefit-driven headline that speaks to Chinese overseas businesses starting their SEO/GEO journey. The headline SHALL NOT use vague marketing superlatives. Hero elements SHALL be immediately visible on render — no element in the hero section SHALL use `opacity-0` as an initial CSS state. Entry animations SHALL only animate `transform` (position), not `opacity`.

#### Scenario: Hero headline is benefit-led, not feature-led
- **WHEN** a visitor lands on the homepage
- **THEN** the hero headline SHALL communicate a concrete outcome (e.g., ranking, visibility, traffic) — not a feature name
- **THEN** the hero sub-headline SHALL clarify who the product is for (e.g., 出海企业, overseas businesses)

#### Scenario: Hero CTA is specific and friction-reducing
- **WHEN** a visitor views the hero CTA
- **THEN** the primary CTA button SHALL describe a specific action (e.g., "分析我的网站", "免费开始")
- **THEN** a micro-copy line SHALL appear below the CTA clarifying no credit card is required or the free tier offer

#### Scenario: Hero H1 is the LCP element and visible on first paint
- **WHEN** PageSpeed Insights measures the homepage on mobile
- **THEN** the hero H1 SHALL be the LCP element
- **THEN** the LCP SHALL be measured at the time the H1 first paints visibly (not after animation completes)
- **THEN** no hero element SHALL have `opacity: 0` at time of first render

## ADDED Requirements

### Requirement: Homepage blog section uses Suspense streaming
Homepage 的 "Featured Content" 博客卡片区 SHALL 使用 React Suspense 包裹，使 hero 和静态区块不依赖 DB 查询即可开始 streaming。

#### Scenario: Hero 在 DB 查询完成前已渲染
- **WHEN** 首页 Server Component 开始渲染
- **THEN** hero、metrics、logos、how-it-works、methods、testimonials 等静态区块 SHALL 在 `getPublishedContent()` 返回前开始 stream
- **THEN** 博客卡片区 SHALL 在 DB 查询完成后填充

#### Scenario: 博客卡片加载中显示 skeleton
- **WHEN** 博客卡片区的 DB 查询尚未完成
- **THEN** 页面 SHALL 显示 3 个占位 skeleton 卡片
- **THEN** skeleton 卡片高度 SHALL 与实际卡片高度接近，避免 CLS

### Requirement: 字体通过 next/font/google 自托管
首页（及全站）所使用的 Plus Jakarta Sans、Instrument Sans、JetBrains Mono 字体 SHALL 通过 `next/font/google` 加载，不使用外部 Google Fonts `<link>` 标签。

#### Scenario: 无外部字体请求
- **WHEN** 浏览器加载首页
- **THEN** network 请求中 SHALL NOT 出现对 `fonts.googleapis.com` 或 `fonts.gstatic.com` 的请求
- **THEN** 字体文件 SHALL 由 Vercel CDN 提供（域名为站点域名或 Vercel CDN 域名）

#### Scenario: font-display swap 生效
- **WHEN** 字体文件尚未加载完成时
- **THEN** 文字 SHALL 使用系统 fallback 字体渲染（不出现 FOIT）
- **THEN** 字体加载完成后 SHALL 自动 swap
