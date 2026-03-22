## Why

当前 Creem 计费集成在功能上已可用，但存在一个资金安全漏洞和三个明显的用户体验缺口：

1. **资金安全**：`checkout.completed` webhook 无幂等保护——Creem 的自动重试机制会在网络超时时重新发送同一事件，导致用户获得双倍积分（`refund.created` 已有幂等保护，但购买事件没有）
2. **积分余额不可见**：用户需要导航到 `/dashboard/billing` 才能看到余额，使用工具前无法感知积分是否充足
3. **工具执行无成本预告**：工具直接扣减积分，用户不知道每次操作花了多少，缺乏消费感知
4. **低积分无预警**：积分耗尽才发现，中断工作流，影响留存

## What Changes

### 安全修复

- **Webhook 幂等保护**：`checkout.completed` 处理前先查询 `externalId = checkout.id AND type = PURCHASE`，存在则直接返回 200，防止重复入账

### 用户体验

- **Header 积分余额展示**：在 dashboard header 右侧（用户名旁）显示当前积分数，带闪电图标，点击跳转 `/dashboard/billing`。数据从 `session.user.credits` 读取（better-auth additionalFields 已包含）
- **低积分横幅**：当用户积分 < 10 时，dashboard 顶部显示一条黄色提示条"积分不足 10，点击补充"，链接到计费页
- **工具执行成本展示**：在 AI 工具的触发按钮旁或 tooltip 中显示本次消耗积分数（从 `SkillConfig.cost` 读取）

## Capabilities

### Modified Capabilities

- `credit-system`:
  - `checkout.completed` webhook 新增幂等检查

- `dashboard-support-visibility` (借用，实为 header 优化):
  - Dashboard header 新增积分余额展示组件

### New Capabilities

- `low-credits-warning`: 当余额 < 10 时，dashboard 布局层显示持久提示条
- `tool-credit-cost-display`: AI 工具触发前展示本次积分消耗，增强消费透明度

## Impact

**修改文件：**
- `src/app/api/webhooks/creem/route.ts` — 幂等检查（+5行）
- `src/app/(protected)/layout.tsx` — header 积分余额 + 低积分提示条

**可选修改（工具层，按工具逐一接入）：**
- AI 工具触发按钮旁展示 `SkillConfig.cost`（前端读取，无 API 变动）

## Priority

| 优先级 | 项目 | 理由 |
|---|---|---|
| 🔴 P0 | Webhook 幂等修复 | 资金安全，任何时候都可能出现双倍积分 |
| 🟠 P1 | Header 积分余额 | 用户核心感知，影响购买决策 |
| 🟠 P1 | 低积分横幅 | 主动引导充值，提升转化 |
| 🟡 P2 | 工具成本展示 | 增强透明度，减少投诉 |
