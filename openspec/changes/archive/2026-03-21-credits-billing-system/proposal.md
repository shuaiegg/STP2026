## Why

ScaletoTop 的变现链路目前完全断裂：计费页面是占位符，用户无法购买积分，工具也无法真正触发付费。webhook 虽已实现但依赖金额汇率换算积分，无法支持灵活定价。本次建立完整的积分购买链路，并在注册环节赠送体验积分，打通「注册 → 体验 → 付费」的核心转化漏斗。

## What Changes

- **重写计费页面**：展示三档积分套餐（50/130/300 积分），含推荐标签、单价对比、当前余额和消费记录
- **新增 Checkout API**：`POST /api/billing/checkout`，验证产品 ID，通过 Creem API 创建 checkout session，metadata 写入 `{ userId, credits }`
- **新增产品配置常量**：`src/lib/billing/products.ts`，维护 productId → credits 映射，作为唯一数据源
- **修复 Webhook**：将积分来源改为读取 `metadata.credits`（移除金额汇率），修复事件字段 `eventType`（Creem 实际字段名）
- **注册赠送积分**：新用户注册后自动赠送 5 积分并记录 `BONUS` 类型 CreditTransaction
- **工具重定价**：审计 5 积分，StellarWriter 15 积分，竞争对手分析 8 积分（更新 SkillConfig seed）
- **积分不足引导**：操作前余额检查触发不足时跳转计费页

## Capabilities

### New Capabilities

- `credits-purchase-flow`: 用户选择套餐 → Creem checkout → webhook 入账的完整购买链路
- `registration-credit-bonus`: 新用户注册自动赠送体验积分
- `billing-page`: 积分余额展示、套餐购买入口、消费历史记录

### Modified Capabilities

- `credit-system`: webhook 积分入账逻辑（从汇率换算改为 metadata 读取）

## Impact

- `src/app/(protected)/dashboard/billing/page.tsx` — 完全重写（当前为占位符）
- `src/app/api/billing/checkout/route.ts` — 新增
- `src/lib/billing/products.ts` — 新增产品配置常量
- `src/app/api/webhooks/creem/route.ts` — 修改积分来源逻辑
- `src/lib/auth.ts` 或注册回调 — 新增注册赠送逻辑
- `prisma/seed.ts` 或 admin UI — 更新 SkillConfig 积分消耗
- 依赖：`CREEM_API_KEY` 环境变量（新增），`CREEM_WEBHOOK_SECRET` 已有
