## ADDED Requirements

### Requirement: Per-page unique metadata
每个公共营销页面 SHALL 导出独立的 metadata，包含唯一的 title、description、canonical URL 和 og:image。

#### Scenario: 首页 metadata 唯一
- **WHEN** 搜索引擎或 SEO 工具抓取 `https://www.scaletotop.com/`
- **THEN** 页面 `<title>` 为 `ScaletoTop | 帮中国出海企业每月新增 50+ 优质询盘`
- **THEN** `<meta name="description">` 内容包含「出海企业」「获客闭环」等核心词
- **THEN** `<link rel="canonical">` 指向 `https://www.scaletotop.com/`
- **THEN** `<meta property="og:image">` 指向品牌 OG 图路由

#### Scenario: 博客列表页 metadata 唯一
- **WHEN** 搜索引擎抓取 `https://www.scaletotop.com/blog`
- **THEN** `<title>` 为 `出海营销实战博客 | ScaletoTop`
- **THEN** `<link rel="canonical">` 指向 `https://www.scaletotop.com/blog`

#### Scenario: 定价页 metadata 唯一
- **WHEN** 搜索引擎抓取 `https://www.scaletotop.com/pricing`
- **THEN** `<title>` 为 `积分套餐与定价 | ScaletoTop`
- **THEN** `<link rel="canonical">` 指向 `https://www.scaletotop.com/pricing`

#### Scenario: 工具页 metadata 唯一
- **WHEN** 搜索引擎抓取 `https://www.scaletotop.com/tools`
- **THEN** `<title>` 为 `出海营销工具箱 | ScaletoTop`
- **THEN** `<link rel="canonical">` 指向 `https://www.scaletotop.com/tools`

---

### Requirement: OG 图动态生成路由
系统 SHALL 提供一个 `/api/og` 路由，返回符合品牌视觉的 OG 图（1200×630px）。

#### Scenario: 默认 OG 图正确渲染
- **WHEN** 社交媒体爬虫请求 `https://www.scaletotop.com/api/og`
- **THEN** 返回 `Content-Type: image/png` 的 1200×630 图片
- **THEN** 图片包含品牌名 "ScaletoTop" 和中文 tagline
- **THEN** 背景为纯黑（#0a0a0a），底部有品牌渐变条（#00ff88 → #00d4ff）

#### Scenario: 所有营销页面引用 OG 图路由
- **WHEN** SEO 工具检查 `/`、`/blog`、`/pricing`、`/tools` 任意一个页面的 og:image
- **THEN** og:image 元标签指向同一个品牌 OG 图路由

---

### Requirement: 博客文章页使用封面图作为 OG 图
博客文章页 SHALL 使用文章的 `coverImage.storageUrl` 作为 og:image，若封面图不存在则回退到默认 OG 图路由。

#### Scenario: 有封面图的文章
- **WHEN** 社交媒体分享 `/blog/[slug]`（该文章有 coverImage）
- **THEN** og:image 为该文章的 `coverImage.storageUrl`

#### Scenario: 无封面图的文章
- **WHEN** 社交媒体分享 `/blog/[slug]`（该文章无 coverImage）
- **THEN** og:image 回退到 `/api/og`

---

### Requirement: /course 页面已删除
系统 SHALL 不再提供 `/course` 路由，访问该路径返回 Next.js 默认 404。

#### Scenario: 访问已删除的课程页
- **WHEN** 用户或爬虫访问 `https://www.scaletotop.com/course`
- **THEN** 返回 404 状态码

#### Scenario: 页脚无 /course 链接
- **WHEN** 用户浏览任意公共页面的页脚
- **THEN** 页脚中不显示任何指向 `/course` 的链接或文本
