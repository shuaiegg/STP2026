## Context

scaletotop.com 的根布局（`src/app/layout.tsx`）定义了一套全局 fallback metadata，但各公共页面均未覆盖，导致 SEO 审计工具检出大量重复标签问题。同时 `/course` 是一个只有一行占位文字的空页面，引发 Critical 级问题。本次修复涉及多个公共路由文件、定价页的组件架构调整，以及一个新的 OG 图生成 API 路由。

## Goals / Non-Goals

**Goals:**
- 消除 DUPLICATE_TITLE、DUPLICATE_META_DESC、MISSING_CANONICAL、MISSING_OG_IMAGE 四类 SEO 问题
- 删除 `/course` 占位页，彻底清除 MISSING_H1 Critical 问题
- 建立可复用的 OG 图生成基础设施，供未来页面扩展

**Non-Goals:**
- JSON-LD 结构化数据（单独 change）
- 多语言 metadata（i18n change 中处理）
- `/tools/geo-writer` 等子页面 metadata
- 修改 root layout 的全局 fallback（保留作为最终兜底）

## Decisions

### D1：OG 图使用 `next/og` ImageResponse 而非静态文件

**决策**：新建 `src/app/api/og/route.tsx`，通过 `ImageResponse` 动态生成 OG 图。

**理由**：静态图片无法参数化（未来支持按页面定制标题文案），且 `next/og` 是 Next.js 16 内置能力无需额外依赖。营销页面指向 `/api/og`，博客文章页直接使用 `coverImage.storageUrl`。

**设计规格（1200×630px）**：
```
背景：#0a0a0a（纯黑）
网格底纹：rgba(255,255,255,0.04) 线条，间距 40px
品牌名：ScaletoTop，white，96px，bold
渐变分割线：#00ff88 → #00d4ff，高度 3px，宽度 600px
中文 tagline：帮中国出海企业建立可预测的海外获客系统
             white 70% opacity，36px
域名水印：scaletotop.com，右下角，#8a8a8a，24px
底部渐变条：#00ff88 → #00d4ff，高度 6px，全宽
```

**备选方案**：静态 `/public/og-default.png`——优点简单，缺点不可扩展，未来无法按页面定制。

---

### D2：`/pricing` 拆分为 Server wrapper + Client 组件

**决策**：将现有 `pricing/page.tsx`（`"use client"`）重命名为 `pricing/PricingClient.tsx`，新建 `pricing/page.tsx` 作为 Server Component，只负责导出 metadata 并渲染 `<PricingClient />`。

**理由**：Next.js App Router 规定 `metadata` 只能从 Server Component 导出。`/pricing` 依赖 `authClient.useSession()` 必须是 Client Component，拆分是唯一符合框架约定的做法。功能零影响。

**备选方案**：将 `useSession` 移入子组件——改动范围更大，且 pricing 页面的会话依赖是核心逻辑，不应拆散。

---

### D3：`/course` 直接删除，不使用 `noindex`

**决策**：删除 `src/app/(public)/course/page.tsx` 文件及所有内部链接（页脚）。

**理由**：课程功能暂无上线时间表，保留空页面持续触发 Critical SEO 问题，且对搜索引擎没有任何 SEO 价值。删除后若出现 404 属预期行为（未被正式推广过）。`noindex` 是临时方案，删除更干净。

---

### D4：各页面 metadata 文案

| 页面 | Title | Description |
|------|-------|-------------|
| `/` | ScaletoTop \| 帮中国出海企业每月新增 50+ 优质询盘 | 专为中国出海企业打造。通过精准广告投流、SEO 内容矩阵和自动化跟进工具，帮你建立可预测、低成本的海外获客闭环。 |
| `/blog` | 出海营销实战博客 \| ScaletoTop | 深度拆解出海企业获客方法：广告投放策略、SEO 内容矩阵、自动化工具应用，助你系统化提升海外业务增长。 |
| `/pricing` | 积分套餐与定价 \| ScaletoTop | 灵活按需付费，无月费订阅压力。AI 内容生成、站点 SEO 体检等工具按积分计费，小团队也能高效出海。 |
| `/tools` | 出海营销工具箱 \| ScaletoTop | AI 驱动的出海营销工具集：多语言内容生成、站点 SEO 分析、市场竞争情报，一站式提升海外获客效率。 |

格式约定：`关键词 | ScaletoTop`（独特内容在前，品牌名作后缀）。

---

### D5：canonical URL 通过 `metadata.alternates.canonical` 注入

**决策**：在每个页面的 metadata 对象中设置 `alternates: { canonical: 'https://www.scaletotop.com/<path>' }`，Next.js 自动渲染为 `<link rel="canonical">`。

**理由**：Next.js 原生支持，无需手动在 `<head>` 写标签，与框架最佳实践一致。

## Risks / Trade-offs

- **`/api/og` 首次请求冷启动延迟（约 100-300ms）** → 可接受；OG 图由社交媒体爬虫抓取，不影响用户加载路径。Vercel 会在首次生成后缓存。
- **删除 `/course` 若已有外部链接** → 风险极低，该页面从未正式推广；如确需兼容可在 `next.config.ts` 添加 redirect，但目前不必要。
- **`/pricing` 拆分后若有状态需要从 Server 传入 Client** → 当前 pricing 页面不依赖服务端 props，拆分后 `<PricingClient />` 无需任何 server props，风险为零。

## Migration Plan

1. 创建 `/api/og` 路由并本地验证生成效果
2. 逐页添加 metadata（顺序：`/` → `/blog` → `/tools` → `/pricing`）
3. `/pricing` 拆分：先创建 `PricingClient.tsx`，再替换 `page.tsx`，确保功能正常
4. 删除 `/course/page.tsx`，移除页脚链接
5. 补全 `/blog/[slug]` 的 og:image

无需数据迁移，无需 feature flag，所有改动均可独立回滚（每步均为独立文件修改）。
