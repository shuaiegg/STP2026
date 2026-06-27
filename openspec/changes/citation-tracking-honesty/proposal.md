## Why

产品多处对外宣称"追踪 AI 引用 / AI citation tracking"，但实现并不查任何大模型——`/api/cron/verify` 只用 DataForSEO 查 **Google SERP**，文章 URL 进前 100 即标 `status: 'CITED'`、`citationSource: 'Google SERP'`（见 backlog）。**这是名实不符的对外宣传，MVP 上线前必须诚实化**，否则构成虚假宣传、损害可信度。

真机定位到的虚假/误导文案：
- `messages/en.json` "Closed-loop citation tracking … across search engines **and AI response engines** in real-time"（**假**：未查任何 AI 引擎）、"citation tracking"、"GEO citation tracking"
- 首页 `citation-tracker` 图 + alt "AI Citation … Tracker"
- library 文章状态徽章 `CITED / NOT_CITED`（暗示被 AI 引用，实为 Google 排名）
- geo-writer "前往控制台追踪引用"

**注意区分**：产品的 **GEO 定位本身是真的**——审计确实分析"内容是否够格被 AI 引用"（结构/证据/Schema，见 `audit-analyzer`、`proofDensity`）。本变更**只修"追踪 AI 引用"这个动作的宣称**，不动 GEO 优化定位与"提升被引概率"这类内容质量建议。

## What Changes

- 把用户可见的"追踪 AI 引用 / AI citation tracking / 监测 AI 引擎引用"改为**诚实表述**：**搜索可见度 / 收录与排名追踪**（Google SERP）。
- `messages/en.json` + `messages/zh.json`：移除"AI response engines"实时监测等措辞；"citation tracking" → "search visibility / ranking tracking"。
- 首页 citation-tracker 区块文案 + 图 alt 调整为"搜索可见度/排名追踪"。
- library 状态徽章 `CITED/NOT_CITED` 文案改为"已收录/已排名" vs "未收录"（保留 enum 值，仅改展示文案）。
- geo-writer "追踪引用" → "追踪收录/排名"。
- **保留**：GEO 优化定位、审计的"AI 可引用度/GEO 就绪度"、"提升被引概率"的内容质量建议（这些是真的）。

## Capabilities

### New Capabilities

- `citation-tracking-honesty` — 对外只宣称实际具备的能力（搜索可见度/排名追踪），不宣称未实现的 AI 引用追踪。

### Modified Capabilities

无接口/数据变更（`TrackedArticle.status` enum、cron 逻辑不变）——仅用户可见文案与营销表述。

## Impact

- **定位**：公开页（首页，双语,获客)+ dashboard（library）。**i18n**：改动主要在 `messages/en.json` + `messages/zh.json`，须双语一致。
- **文件**（预估）：`messages/en.json`、`messages/zh.json`、`src/app/[locale]/(public)/page.tsx`、`library/ArticleList.tsx`、`geo-writer/page.tsx`、首页 citation-tracker 图素材/alt。
- **无破坏性**：不改 enum / DB / cron 行为；纯文案。
- **关联**：真正做 GEO 引用追踪（接大模型查询）见 backlog；`proofDensity` 作为真·GEO 信号已在 `content-asset-blueprint`。
