# 全站双语（英文根路径）i18n 基建 — 提案

## Why

ScaletoTop 当前是纯中文站点，没有任何 i18n 基础设施（无 next-intl、无 `[locale]` 路由段，`Content` 模型无语言字段，大部分页面文案 inline 在 JSX 中）。但战略上有三个事实要求双语：

1. **客户是出海企业，他们的战场是英文市场**。我们的工具（geo-writer / Site Intelligence / 引用追踪）交付的核心价值是英文 SEO/GEO，必须有英文内容轨道来 dogfooding 验证方法论——"用自己的工具把自己写进 ChatGPT/Perplexity 的引用"是未来最强的销售素材。
2. **英文内容轨道需要完整的英文落地路径**。被 AI 引用的英文文章把访客带进来，落到中文首页线索就死了。英文漏斗页（首页/定价/咨询）是英文内容实验的配套设施，不是市场扩张野心。
3. **长期主站定位是英文**（英文市场大、付费意愿强、创始人具备英文交付能力）。站点当前接近零权重，把英文放根路径的迁移成本是历史最低点；等 `/en/` 积累了排名再迁根路径是纯损耗。

战略姿势保持"门开着，军队不动"：GTM 主战场仍是中文出海客户（知乎/公众号/微信渠道驱动），英文市场作为内容实验的免费副产品被动探测，用数据决定是否加注。

## What Changes

1. **i18n 路由基建**：next-intl + `[locale]` 路由段（仅 `(public)` 路由组），英文在根路径 `/`，中文在 `/zh/` 前缀
2. **静态文案抽取**：所有 `(public)` 页面文案迁移到 `messages/en.json` + `messages/zh.json`（Git 管理，不进 DB）
3. **内容语言维度**：`Content.locale` + `translationGroupId`（可选翻译配对），博客列表/详情按语言过滤，admin 内容管理加语言筛选与配对
4. **按语言的页面可见性**：路由声明可用语言，未支持语言返回 404，导航/页脚按语言渲染链接
5. **SEO 纪律**：sitemap 按语言生成、hreflang 只在翻译对真实存在时输出、JSON-LD `inLanguage`、语言切换器处理"无对应版本"
6. **语言建议横幅**：基于 `Accept-Language`（非 IP）的非强制切换建议 + cookie 记忆，绝不自动跳转
7. **用户语言属性**：`User.locale` 注册时记录，驱动事务邮件模板语言、systeme.io 触发标签 locale 映射、PostHog person property
8. **合规**：GDPR cookie 同意横幅（门控 PostHog），核实 Creem 是否为 Merchant of Record（VAT 代缴）

## Capabilities

### 新增

- `i18n-routing`: next-intl 集成，`[locale]` 路由段，英文根路径 + `/zh/` 前缀，middleware locale 解析
- `i18n-messages`: 双语 messages 文件体系，`(public)` 页面文案全部抽取
- `content-locale`: `Content.locale` + `translationGroupId` 字段，博客按语言过滤，admin 语言管理
- `locale-page-visibility`: 按语言控制页面/内容可见性（页面级 404 + 内容级过滤 + 导航级渲染）
- `locale-seo`: 分语言 sitemap、条件 hreflang、JSON-LD inLanguage、分语言 OG metadata
- `language-suggestion-banner`: Accept-Language 建议横幅 + NEXT_LOCALE cookie，无强制跳转
- `user-locale`: `User.locale` 字段及其下游消费（邮件/营销/分析）
- `cookie-consent`: GDPR 同意横幅，PostHog 改为同意后启动

### 修改

- `src/lib/notion/sync.ts`: 同步内容默认 `locale: 'zh'`
- `src/app/actions/blog-draft.ts`: geo-writer 另存博客草稿传入 locale
- `src/lib/email.ts` + 模板: 按 `user.locale` 选择中/英模板（admin 通知邮件保持中文）
- `src/lib/integrations/systeme-triggers.ts`: 触发键支持 locale 后缀标签映射（`{tag}_en` 约定）
- `src/app/sitemap.ts` / `src/app/robots.ts`: 分语言 URL + alternates
- `src/components/providers/PostHogProvider`: 同意门控 + locale 属性

### 不变

- admin 后台（`/dashboard/admin/*`）保持中文，不翻译
- dashboard 工具界面（`(protected)`）第一期不翻译（英文自助用户出现后再评估）
- Notion 同步流程机制不变（仅默认打 zh 标）
- 现有中文内容的 URL 迁到 `/zh/` 前缀（需 301，站点新、损耗可接受）

## Non-Goals（明确不做）

- dashboard / admin 界面英文化
- 文章自动翻译功能（"一键翻译成英文版" skill 留待后续）
- 中文 AI 引擎（豆包/Kimi/DeepSeek/元宝）引用检测
- 英文市场主动 GTM（投放、社区运营、英文销售流程）
- systeme.io 英文营销序列内容编写（仅打通标签机制）
