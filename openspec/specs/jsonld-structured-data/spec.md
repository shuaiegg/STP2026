## ADDED Requirements

### Requirement: JSON-LD schema builder utility
系统 SHALL 提供 `src/lib/schema.ts`，包含纯函数 builder，用于生成各页面类型的 Schema.org 对象。

#### Scenario: Builder 函数返回合法 Schema.org 对象
- **WHEN** 调用任意 builder 函数（如 `buildOrganization()`）
- **THEN** 返回值 SHALL 包含 `@context: "https://schema.org"` 和正确的 `@type` 字段
- **THEN** 返回值 SHALL 为纯 JavaScript 对象，无副作用

#### Scenario: buildArticle 从 post 数据自动生成 BlogPosting
- **WHEN** 调用 `buildArticle(post)` 并传入包含 `title`、`publishedAt`、`summary`、`slug` 的 post 对象
- **THEN** 返回 `@type: "BlogPosting"` 对象
- **THEN** `headline` 为 `post.title`，`datePublished` 为 ISO 8601 格式，`url` 为完整绝对路径

---

### Requirement: JsonLd 渲染组件
系统 SHALL 提供 `src/components/JsonLd.tsx`，接受 schema 对象并输出 `<script type="application/ld+json">`。

#### Scenario: JSON-LD script 在 SSR HTML 中存在
- **WHEN** 爬虫或 PageSpeed 工具请求任意已注入 JSON-LD 的页面
- **THEN** HTML 源码 SHALL 包含 `<script type="application/ld+json">` 标签
- **THEN** 该标签 SHALL 在页面首次 HTML 响应中出现（不依赖客户端 JS 执行）

---

### Requirement: 首页注入 Organization + WebSite schema
`/` 页面 SHALL 在 HTML 中输出 `Organization` 和 `WebSite` 两个 JSON-LD 对象。

#### Scenario: Organization schema 包含必填字段
- **WHEN** 爬虫抓取 `https://www.scaletotop.com/`
- **THEN** JSON-LD SHALL 包含 `@type: "Organization"`，`name: "ScaletoTop"`，`url: "https://www.scaletotop.com"`
- **THEN** `logo` 字段 SHALL 指向绝对 URL 且为 PNG/JPG 格式图片（`/logo-512.png`）

#### Scenario: Google Rich Results Test 通过
- **WHEN** 使用 Google Rich Results Test 检测首页
- **THEN** Organization schema SHALL 无错误（warning 可接受）

---

### Requirement: 博客文章页注入 BlogPosting + BreadcrumbList schema
`/blog/[slug]` 页面 SHALL 输出 `BlogPosting` 和 `BreadcrumbList` 两个 JSON-LD 对象。

#### Scenario: 优先使用 seoMeta.schemaJson
- **WHEN** 文章的 `seoMeta.schemaJson` 字段非空
- **THEN** 页面 SHALL 使用 `seoMeta.schemaJson` 的内容作为 JSON-LD 输出
- **THEN** 不再自动生成 BlogPosting schema

#### Scenario: 无 seoMeta 时自动生成 BlogPosting
- **WHEN** 文章的 `seoMeta.schemaJson` 为空或不存在
- **THEN** 系统 SHALL 调用 `buildArticle(post)` 自动生成 BlogPosting schema

#### Scenario: BreadcrumbList 始终注入
- **WHEN** 任意博客文章页渲染
- **THEN** JSON-LD SHALL 包含 `BreadcrumbList`，条目为：首页 → 博客 → 当前文章标题

---

### Requirement: Pricing 页注入 Service schema
`/pricing` 页面 SHALL 输出 `Service` 类型的 JSON-LD。

#### Scenario: Service schema 包含基本描述
- **WHEN** 爬虫抓取 `/pricing`
- **THEN** JSON-LD SHALL 包含 `@type: "Service"`，`serviceType`，`provider`（指向 Organization）

---

### Requirement: Tools 页注入 WebApplication schema
`/tools` 页面 SHALL 输出 `WebApplication` 类型的 JSON-LD。

#### Scenario: WebApplication schema 包含基本描述
- **WHEN** 爬虫抓取 `/tools`
- **THEN** JSON-LD SHALL 包含 `@type: "WebApplication"`，`name`，`url`，`applicationCategory`

---

### Requirement: 博客列表页注入 Blog schema
`/blog` 页面 SHALL 输出 `Blog`（CollectionPage）类型的 JSON-LD。

#### Scenario: Blog schema 存在
- **WHEN** 爬虫抓取 `/blog`
- **THEN** JSON-LD SHALL 包含 `@type: "Blog"`，`name`，`url`
