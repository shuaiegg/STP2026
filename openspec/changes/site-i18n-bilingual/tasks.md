# 全站双语 i18n 基建 — 任务清单

---

## Sprint 1 — i18n 路由基建 + 静态文案抽取（~4-5 天）

> 目标：`(public)` 全部页面在 `/`（en）和 `/zh/`（zh）下渲染，文案全部进 messages 文件

### 1.1 next-intl 集成

- [x] 1.1.1 安装 `next-intl`（v4.13.0），创建 `src/i18n/`（`routing.ts` + `request.ts` + `navigation.ts`；`localeDetection: false` 落实"不自动跳转"决策）
- [x] 1.1.2 创建 `messages/en.json` + `messages/zh.json` 骨架（common/nav/footer/banner 已填实，页面命名空间留空待 1.2）
- [x] 1.1.3 `(public)` 平移为 `[locale]/(public)`（git mv 保留历史），新增 `[locale]/layout.tsx`（locale 校验 + setRequestLocale + NextIntlClientProvider），根 layout `<html lang>` 经 `getLocale()` 动态化；MainLayout（nav/footer 共享件）改用 i18n Link + useTranslations（dashboard 链接保持 next/link 不加前缀）
- [x] 1.1.4 合并 middleware：admin 重定向/dashboard 保护逻辑保留，公开路径走 intlMiddleware；matcher 改为排除式（api/_next/_vercel/静态文件）；登录态访问 `/login` 与 `/zh/login` 均跳 dashboard
- [x] 1.1.5 `npm run build` 通过；生产服务验证：`/` lang=en 英文导航、`/zh` lang=zh-Hans 中文导航、`/en/pricing` 307→`/pricing`、`/zh/pricing` 200、未登录 `/dashboard` 307→`/login`

### 1.2 文案抽取（中文为基准，英文独立撰写）

- [x] 1.2.1 已有 `const COPY` 的 4 个文件（首页/about/consultation×2）迁移到 messages
- [x] 1.2.2 其余 `(public)` 页面 inline 文案全部抽取：blog 列表/详情框架、pricing、tools、login/register/forgot/reset、contact、case-studies、legal（privacy/terms/refund）、导航/页脚
- [x] 1.2.3 英文文案初版撰写（直接可发布的质量，禁机翻腔；首页/定价的深度重写留给 `homepage-plg-repositioning`，此处先可用版本）
- [x] 1.2.4 zod 校验错误信息、toast 文案、表单占位符按 locale 处理

### 1.3 语言切换与建议横幅

- [x] 1.3.1 导航语言切换器（en ⇄ zh，目标语言无对应页面时跳目标语言首页）
- [x] 1.3.2 `LanguageSuggestionBanner`：Accept-Language ≠ 当前 locale 且无 `NEXT_LOCALE` cookie 时展示；切换/关闭均写 cookie；**绝不自动跳转**
- [x] 1.3.3 页面级可见性 `src/lib/i18n/page-availability.ts`：未支持语言 `notFound()`，导航/页脚按 locale 过滤

### 1.4 301 重定向

- [x] 1.4.1 ~~next.config redirects~~ **设计修订**：静态页根路径 URL 被 en 版复用，无法 301（详见 design.md「URL 平移策略（修订）」）；改为 ① 静态页靠语言建议横幅接住中文访客 ② 博客详情按内容 locale 智能 308 跳转（见 1.4.2）
- [x] 1.4.2 博客详情智能跳转：zh 文章落在 en URL（旧收录链接）→ 308 到 `/zh/blog/[slug]`，保留外链权重（`blog/[slug]/page.tsx`）

---

## Sprint 2 — 内容语言维度 + SEO（~3-4 天）

> 目标：博客双语轨道可用，搜索引擎正确理解两种语言

### 2.1 Prisma Schema

- [x] 2.1.1 `Content` 增加 `locale String @default("zh")` + `translationGroupId String?` + `@@index([locale, status, visibility, publishedAt(sort: Desc)])`
- [x] 2.1.2 `User` 增加 `locale String @default("zh")`
- [x] 2.1.3 `ConsultationRequest` 增加 `locale String @default("zh")`
- [x] 2.1.4 `npx prisma db push` + `npx prisma generate` 已对**生产库**执行（2026-06-13 经 information_schema 核实 locale/translationGroupId 列存在）；存量数据靠 default 全标 zh

### 2.2 内容查询与生产入口

- [x] 2.2.1 博客列表/分类/详情/相关文章查询全部加 locale 过滤（`[locale]/(public)/blog/`）
- [x] 2.2.2 `src/lib/notion/sync.ts` upsert 时写 `locale: 'zh'`
- [x] 2.2.3 `src/app/actions/blog-draft.ts`：geo-writer 另存草稿接收并写入 locale（geo-writer UI 增加输出语言选择，默认 en）
- [x] 2.2.4 admin 内容列表：语言筛选 tab（全部/EN/ZH）+ locale 徽标 + 翻译配对状态列
- [x] 2.2.5 admin 内容编辑页：手动关联/解除翻译对（设置/清除 `translationGroupId`）

### 2.3 SEO 基建

- [x] 2.3.1 `src/app/sitemap.ts`：按语言生成 URL + `alternates.languages`；中文独有页/文章不出现在英文侧
- [x] 2.3.2 页面 `generateMetadata`：hreflang（`alternates.languages` + x-default 指向 en）只在对应版本存在时输出；canonical 按 locale
- [x] 2.3.3 博客详情 hreflang 按 `translationGroupId` 配对输出
- [x] 2.3.4 JSON-LD：`WebSite`/`BlogPosting` 增加 `inLanguage`；OG metadata 按 locale（`og:locale`）
- [x] 2.3.5 `/api/og` 支持 locale 参数（字体/文案）

### 2.4 验收

- [ ] 2.4.1 发布一篇英文测试文章：仅出现在 `/blog`，不出现在 `/zh/blog` 与中文 sitemap
- [ ] 2.4.2 配对一组中英文章，互相输出 hreflang；解除配对后 hreflang 消失
- [ ] 2.4.3 Google Rich Results Test 验证 BlogPosting；hreflang 用 Screaming Frog 或 technicalseo.com 工具抽查

---

## Sprint 3 — 用户语言 + 合规（~2-3 天）

> 目标：用户全生命周期语言一致，英文站合规上线

### 3.1 User.locale 下游

- [x] 3.1.1 注册/Google OAuth 回调记录当时界面 locale 到 `User.locale`；dashboard 设置页可修改
- [x] 3.1.2 邮件模板 en 版本 ×5（welcome / credits-warning / purchase-success / audit-complete / consultation-confirmation）；`consultation-notification`（admin 侧）保持中文
- [x] 3.1.3 `src/lib/email.ts` 发送入口按 `user.locale` 选模板（找不到 en 版回落 zh）
- [x] 3.1.4 systeme.io：`addContact` 按 locale 打 `{tag}_en` 后缀标签（代码完成；⚠️ 后台手工预建 `_en` 标签见 `docs/i18n-manual-checklist.md` A1）
- [x] 3.1.5 PostHog：`locale` 写入 person property + 全事件公共属性（中英漏斗切分的决策数据源）
- [x] 3.1.6 consultation 表单提交记录页面 locale；admin 咨询管理展示线索语言

### 3.2 GDPR Cookie 同意

- [x] 3.2.1 `CookieConsentBanner` 组件（双语、所有 locale 统一展示）：接受 / 拒绝，状态存 cookie
- [x] 3.2.2 PostHog init 改 `opt_out_capturing_by_default: true`，接受后 `opt_in_capturing()`；GTM 纳入同一门控
- [ ] 3.2.3 隐私政策页更新 cookie/分析说明（中英双语）
- [ ] 3.2.4 验证：未同意前 Network 无 PostHog/GTM 请求；同意后事件正常

### 3.3 Creem MoR 核实（非代码任务）

- [x] 3.3.1 ✅ Creem **是 MoR**：代收代缴 VAT/GST/销售税至 190+ 国（含 EU via Estonia OSS、UK、US 28+ 州），卖家无需自行注册/申报。结论见 `docs/i18n-manual-checklist.md` D1
- [x] 3.3.2 ✅ 结论：英文定价页**可直接挂购买按钮**（USD，Creem 代缴税）→ 已输出给 `homepage-plg-repositioning`

### 3.4 总验收

- [ ] 3.4.1 design.md「验收基准」全项通过
- [ ] 3.4.2 模拟英文新用户全流程：`/` 落地 → 注册 → 英文 welcome 邮件 → systeme.io `_en` 标签 → PostHog locale 属性
- [ ] 3.4.3 模拟中文老用户回归：`/zh/` 全流程无回归；旧链接 301 正常
- [ ] 3.4.4 GSC 提交新 sitemap，记录收录基线
