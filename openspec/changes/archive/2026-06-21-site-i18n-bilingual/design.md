# 全站双语 i18n 基建 — 设计决策

## 总原则

**不是两个站，是一个系统加一个"语言维度"。** 一套代码、一个数据库、一次部署，语言贯穿四层：

| 层 | 语言由什么决定 | 管理方式 |
|----|--------------|---------|
| 访客层 | URL（`/` = en，`/zh/` = zh）+ NEXT_LOCALE cookie | 路由自动，无需管理 |
| 静态文案层 | `messages/en.json` / `messages/zh.json` | Git 管理，随代码提交 |
| 内容层 | `Content.locale` + `translationGroupId` | admin 内容列表语言筛选/配对 |
| 用户层 | `User.locale`（注册时的界面语言） | 自动记录，设置页可改 |

---

## 决策 1：URL 结构 — 英文根路径，中文 `/zh/` 前缀

```
/                → 英文首页          /zh             → 中文首页
/blog            → 英文博客列表       /zh/blog        → 中文博客列表
/blog/[slug]     → 英文文章          /zh/blog/[slug] → 中文文章
/pricing         → 英文定价          /zh/pricing     → 中文定价
```

**理由**：
- 长期主站定位是英文；站点当前接近零权重，现在定英文根路径的成本是历史最低点，避免未来全站 301 迁移
- 中文获客是渠道驱动（知乎/公众号/微信直接发 `/zh/` 链接），不依赖根路径自然发现；裸访问根路径的中文访客由语言建议横幅接住
- next-intl `localePrefix: 'as-needed'`，defaultLocale = `'en'`（en 无前缀，zh 强制前缀）

**代价（接受）**：现有中文页面 URL 全部从 `/xxx` 变为 `/zh/xxx`，需要 301 重定向规则。站点收录极少，损耗可接受，且越晚做损耗越大。

**路由结构**：只有 `(public)` 进入 `[locale]` 段：

```
src/app/
  [locale]/(public)/...     ← 现 (public) 整体平移
  (protected)/dashboard/... ← 不动（不翻译）
  admin/setup/              ← 不动
  api/...                   ← 不动
```

`src/middleware.ts` 现有 matcher 只覆盖 `/admin /dashboard /api/auth /login`——next-intl middleware 与 auth middleware 需要合并：先跑 locale 解析，再跑现有 auth 逻辑；matcher 扩展覆盖 `(public)` 路径（注意排除 `/api`、`/_next`、静态资源）。`/login` 等 auth 页在 `(public)` 内，移入 `[locale]` 后 matcher 同步更新。

---

## 决策 2：绝不按 IP 跳转，用 Accept-Language 建议横幅

**为什么不用 IP**：
1. Googlebot 主要从美国 IP 抓取，IP 强制跳转 = 中文版对 Google 不可见（官方点名的反模式）
2. **我们的中文买家是出海创业者，人在英美新**——IP 恰好对核心客群给出错误判断；浏览器 `Accept-Language`（`zh-CN`）才是正确信号

**机制**（三层）：
```
① URL 永远决定页面语言（/zh/* 对任何人都是中文）—— SEO 安全
② middleware 读 Accept-Language ≠ 当前 locale 且无 NEXT_LOCALE cookie
   → 页面顶部渲染建议横幅（"切换到中文版?" / "Switch to English?"）
③ 用户点击切换或关闭 → 写 NEXT_LOCALE cookie，之后不再打扰
```

语言切换器常驻导航。横幅是 Server Component 注入的轻量条，不阻塞 LCP。

---

## 决策 3：内容模型 — locale 字段 + 可选翻译配对

```prisma
model Content {
  // ...现有字段
  locale             String    @default("zh")   // 'zh' | 'en'，存量内容全是中文
  translationGroupId String?                    // 同组 = 互为翻译，用于 hreflang
  @@index([locale, status, visibility, publishedAt(sort: Desc)])
}
```

- **配对是可选的、预期是少数**：中英文内容策略本来不同（中文写出海获客话题，英文写垂直 SEO/GEO 话题），不强制互译
- `translationGroupId` 为同一 uuid 的两条记录互为翻译；hreflang 只在配对存在时输出
- slug 全局唯一约束保留（中英文 slug 天然不同，无冲突）
- Notion 同步默认 `locale: 'zh'`；geo-writer「另存为博客草稿」按生成语言传 locale
- 博客列表/分类/详情查询全部加 `WHERE locale = $current`

**admin 内容管理增量**：列表语言筛选 tab（全部/EN/ZH）+ 每行 locale 徽标 + 配对状态列；编辑页可手动关联/解除翻译对。

---

## 决策 4：静态文案 — messages 文件进 Git，不做文案后台

- `messages/en.json` + `messages/zh.json`，next-intl 标准结构，按页面命名空间组织（`home.*`、`pricing.*`、`consultation.*`...）
- 独立开发者 = 营销人员就是自己，文案改动走代码提交，不建 DB 文案管理
- 现有 `const COPY` 提取（仅 4 个文件已做）作为迁移起点，其余 inline 文案借此一次性抽干净
- **英文文案不是翻译**：英文 voice 独立撰写（禁止机翻腔），中文规则（统一用"您"）不适用于英文，英文 voice 准则后续在 `homepage-plg-repositioning` change 中定义

---

## 决策 5：按语言的页面可见性

```typescript
// src/lib/i18n/page-availability.ts
const PAGE_LOCALES: Record<string, Locale[]> = {
  '/consultation': ['zh', 'en'],
  '/case-studies': ['zh'],        // 示例：中文独有页
  // 缺省 = 两种语言都可用
};
```

- 页面级：访问未支持语言的路径 → `notFound()`
- 导航/页脚：按当前 locale 过滤链接渲染
- **三条 SEO 纪律**（违反任何一条都是负分）：
  1. sitemap 按语言生成，中文独有页绝不出现在英文 sitemap
  2. hreflang 只在对应版本真实存在时输出（页面级按 PAGE_LOCALES，文章级按 translationGroupId）
  3. 语言切换器在目标语言无对应版本时跳目标语言首页（不切到 404）

---

## 决策 6：User.locale 及下游消费

```prisma
model User {
  // ...现有字段
  locale String @default("zh")   // 注册时的界面语言
}
```

| 消费方 | 机制 |
|-------|------|
| 事务邮件 | 5 套用户侧模板各加 en 版本，`sendEmail` 按 `user.locale` 选；`consultation-notification`（发给 admin）保持中文 |
| systeme.io | 触发标签约定 `{tag}_en` 后缀：en 用户打 `registered_en`，查无此标签则回落基础标签。标签需先在 systeme.io 手工创建（API 不自动建标签，已知坑） |
| PostHog | `locale` 作为 person property + 全事件 property，漏斗按语言切分——这是"英文市场是否值得加注"的决策数据源 |
| AI 客服（Sprint 3，未来） | 按 locale 选择回复语言，本 change 不实现 |

匿名访客（consultation 表单未注册提交）：`ConsultationRequest` 记录提交时页面 locale，admin 看得到该线索的语言。

---

## 决策 7：GDPR Cookie 同意 — PostHog 改为同意后启动

- 英文站 = 主动服务英国/欧盟访客，PostHog 无同意即跑从"低风险"变成真实合规问题
- 实现：PostHog init 改为 `opt_out_capturing_by_default: true`；同意横幅（所有 locale 统一展示，最简单且最安全）→ 接受后 `opt_in_capturing()` + cookie 记录；拒绝则保持 opt-out
- GTM 已有 production-only 门控，纳入同一同意逻辑
- 同意状态变化本身发一个事件（接受后），用于估算同意率

## 决策 8：Creem Merchant of Record 核实（任务，非代码）

向英国/欧盟个人收订阅费涉及 VAT。需核实 Creem 是否以 MoR 身份代缴税务：
- 是 → 英文定价页可直接用现有 Creem 流程（USD 展示）
- 否 → 英文付费墙暂缓上线，先只开放免费工具，单独评估税务方案

结论写入本 change 的 design 附录，并决定英文定价页是否带购买按钮。

---

## URL 平移策略（修订，2026-06-13）

~~原方案：next.config redirects 把存量中文路径 301 到 `/zh/`。~~

**实现时发现原方案不可行**：英文版复用了根路径 URL（`/pricing` 现在是英文页），同一 URL 不能既 301 又渲染。修订为：

1. **静态页不重定向**——旧链接落到英文版，由语言建议横幅（Accept-Language）接住中文访客
2. **博客详情智能跳转**——`/blog/[slug]` 查无当前 locale 的文章时，按 slug 反查其他语言；命中则 308 到正确前缀（如 `/zh/blog/[slug]`），保留旧收录外链权重
3. 上线后 GSC 提交新 sitemap，监控收录交接

## 实施发现附录（审计修正记录，2026-06-13）

实现与审计过程中沉淀的关键约束，后续开发必须遵守：

1. **`routing.ts` 必须 `localeCookie: false`**：next-intl middleware 默认自动写 `NEXT_LOCALE` 响应 cookie，且 middleware 写的 cookie 会合并进同请求的 `cookies()`——会让建议横幅误判"用户已手动选择过语言"而永不展示。`NEXT_LOCALE` 仅由 LocaleSwitcher/横幅在用户手动选择时写入。
2. **`NextIntlClientProvider` 边界**：只包裹 `[locale]` 子树。root layout 层的客户端组件（如 `CookieConsentBanner`）**不能调用 `useLocale()`**——SSR 直接抛错导致全站 500（且 `ignoreBuildErrors: true` + 构建期不触发，只在生产运行时爆炸）。locale 一律经 props 从 server 端传入。
3. **公开页查询必须显式传 locale**：`getPublishedContent` 不再静默默认 zh（曾导致英文首页展示中文文章）。
4. **注册 locale 检测链**：`NEXT_LOCALE` cookie（用户手动选过，最强信号）→ referer 路径前缀 → `Accept-Language` → `'en'`（站点默认语言）。
5. **代词规范修订**：中文文案统一用"您"（B2B 受众 + 专业可信定位），原"你"规则作废——同步更新于 CLAUDE.md 与 rules/design.md。
6. **本地验证注意**：重启验证前先 `pkill -f "next start"`——残留旧进程占住端口会让你验证到旧构建。

## 验收基准

- `/` 英文首页 200，`/zh` 中文首页 200，互相有 hreflang + x-default
- 中文独有页在英文 sitemap 中不出现，访问 `/[该页]` 返回 404
- 浏览器 `zh-CN` 访问 `/` 出现建议横幅；点击后落 `/zh` 且 cookie 记忆
- 新注册英文用户收到英文 welcome 邮件，systeme.io 打上 `_en` 标签
- PostHog 事件带 locale 属性；未同意前 Network 面板无 PostHog 请求
- `npm run build` 通过，现有中文页面在 `/zh/` 下渲染无回归
