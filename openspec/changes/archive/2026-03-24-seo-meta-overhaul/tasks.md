## 1. OG 图动态生成路由

- [x] 1.1 新建 `src/app/api/og/route.tsx`，使用 `next/og` 的 `ImageResponse` 生成 1200×630 品牌 OG 图：纯黑背景(#0a0a0a) + 白色网格底纹(rgba(255,255,255,0.04)) + 品牌名 "ScaletoTop"(白色 96px bold) + 渐变分割线(#00ff88→#00d4ff 3px) + 中文 tagline + 右下角域名水印 + 底部渐变条(#00ff88→#00d4ff 6px)
- [x] 1.2 访问 `/api/og` 本地验证图片正确渲染，检查尺寸为 1200×630，品牌色与设计稿一致

## 2. 删除 /course 页面与清理链接

- [x] 2.1 删除 `src/app/(public)/course/page.tsx`
- [x] 2.2 在页脚组件中找到并删除指向 `/course` 的所有链接/文本（包含已 disabled 的条目）
- [x] 2.3 全局搜索 `/course` 确认无其他内部链接残留

## 3. /pricing 拆分 Server/Client

- [x] 3.1 将 `src/app/(public)/pricing/page.tsx` 的组件代码移入新建文件 `src/app/(public)/pricing/PricingClient.tsx`，保留 `"use client"` 声明
- [x] 3.2 重写 `src/app/(public)/pricing/page.tsx` 为 Server Component，export `metadata` 对象（title、description、canonical、openGraph.images），并渲染 `<PricingClient />`
- [x] 3.3 验证 `/pricing` 页面功能正常（购买按钮、session 状态显示无异常）

## 4. 首页 Metadata

- [x] 4.1 在 `src/app/(public)/page.tsx` 添加 `export const metadata: Metadata`，设置 title 为 `ScaletoTop | 帮中国出海企业每月新增 50+ 优质询盘`，description 为 `专为中国出海企业打造。通过精准广告投流、SEO 内容矩阵和自动化跟进工具，帮你建立可预测、低成本的海外获客闭环。`
- [x] 4.2 为首页 metadata 添加 `alternates.canonical`（`https://www.scaletotop.com`）和 `openGraph.images`（指向 `/api/og`）

## 5. 博客列表页 Metadata

- [x] 5.1 在 `src/app/(public)/blog/page.tsx` 添加 `export const metadata: Metadata`，设置 title 为 `出海营销实战博客 | ScaletoTop`，description 为 `深度拆解出海企业获客方法：广告投放策略、SEO 内容矩阵、自动化工具应用，助你系统化提升海外业务增长。`
- [x] 5.2 为博客列表页添加 `alternates.canonical` 和 `openGraph.images`

## 6. 工具页 Metadata

- [x] 6.1 确认 `src/app/(public)/tools/page.tsx` 是 Server Component（不含 `"use client"`）
- [x] 6.2 添加 `export const metadata: Metadata`，title 为 `出海营销工具箱 | ScaletoTop`，description 为 `AI 驱动的出海营销工具集：多语言内容生成、站点 SEO 分析、市场竞争情报，一站式提升海外获客效率。`
- [x] 6.3 为工具页添加 `alternates.canonical` 和 `openGraph.images`

## 7. 博客文章页动态 OG 图

- [x] 7.1 检查 `src/app/(public)/blog/[slug]/page.tsx` 的 `generateMetadata` 是否已存在
- [x] 7.2 在 `generateMetadata` 中补全 `openGraph.images`：优先使用 `content.coverImage?.storageUrl`，无封面图时回退到 `/api/og`
- [x] 7.3 同步设置 `alternates.canonical` 为文章的完整 URL（`https://www.scaletotop.com/blog/${slug}`）
