# 首页 PLG 重定位（订阅/工具主导）— 提案

## Why

当前首页延续"咨询服务"叙事，但：

1. **没有可分享的商业案例**——咨询主导的叙事需要案例和信任背书支撑，现阶段撑不起来
2. **已有现成的 PLG 王牌没有上场**：instant-audit（即时站点审计）零信任成本、即时给价值，是最强的首页钩子，但它目前锁在登录墙内（`/dashboard/site-intelligence/instant-audit`），首页完全没有引用
3. **双语站需要新文案**——`site-i18n-bilingual` 要求首页文案双语产出；翻译旧首页等于翻译即将扔掉的文案，必须先重定位再写文案（文案只写一次，两种语言原生撰写）

定位转向：**工具/订阅主导，咨询降级为次要 CTA**。首页核心动作 = "输入你的网址 → 拿到 SEO+GEO 体检报告"，把访客直接推进产品价值，而不是推进销售对话。

## What Changes

1. **Hero 重构**：URL 输入框为核心交互（替代纯文案 hero），提交后带域名进注册流程，注册完成立即跑 instant-audit（aha moment 前置）
2. **叙事结构重排**：审计钩子 → 工具能力展示（geo-writer / Site Intelligence / 引用追踪）→ 定价/积分 → 咨询次要入口
3. **英文品牌 voice 定义**：英文文案准则（独立撰写，非翻译），落地为可复用的 voice 文档
4. **双语文案产出**：新首页全部文案写入 `messages/en.json` + `messages/zh.json`（中文走 `scaletotop-copywriter` 规则）
5. **漏斗埋点**：hero 输入 → 注册 → 首次审计完成的 PostHog 漏斗（带 locale 属性）

## Capabilities

### 新增

- `homepage-audit-hero`: URL 输入式 hero，域名透传注册流程，注册后自动触发首次审计
- `homepage-tool-narrative`: 工具/订阅主导的首页区块结构（能力展示、定价引导、咨询次要 CTA）
- `english-brand-voice`: 英文文案 voice 准则文档（`rules/voice-en.md`）
- `hero-funnel-tracking`: `homepage_audit_submitted` → `register` → `first_audit_completed` 漏斗事件

### 修改

- `src/app/[locale]/(public)/page.tsx`: 首页整体重构（依赖 site-i18n-bilingual Sprint 1 完成的路由结构）
- 注册流程：支持 `?domain=` 参数透传，注册成功后进入审计而非通用 onboarding
- `messages/{en,zh}.json`: `home.*` 命名空间全部新写

### 不变

- instant-audit 引擎本身不动（已有 `instant-audit-persistence` 等规格）
- 定价页、咨询页内容本期不重写（仅首页指向它们）
- 公开无登录的"lite 审计"本期不做（见 design 决策 2）

## Non-Goals

- 不做无注册的公开审计（滥用/成本风险，留待有数据后评估）
- 不重做定价模型或积分体系
- 不做英文市场主动投放素材
- dashboard onboarding 流程整体重构不在本期（仅接收 domain 透传）
