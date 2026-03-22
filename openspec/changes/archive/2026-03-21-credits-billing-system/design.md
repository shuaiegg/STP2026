## Context

ScaletoTop 已有完整的积分消耗基础设施（`chargeUser()`、`CreditTransaction`、`SkillConfig` 表），但变现闭环缺失：

- `/dashboard/billing` 是纯占位符，用户无法购买积分
- Webhook 使用金额汇率换算积分（每 $1 = 100 credits），无法支持自定义套餐定价
- 注册用户默认 0 积分，首次使用即碰壁（`SITE_AUDIT_BASIC` cost 为 0，尚未启用计费）
- `better-auth` 没有 `afterSignUp` 回调，需要通过注册 API route 后置逻辑赠送积分

**外部依赖**：Creem.io（Merchant of Record），已在 dashboard 创建 3 个产品，Webhook Secret 已配置，需新增 `CREEM_API_KEY` 用于服务端调用。

---

## Goals / Non-Goals

**Goals:**
- 打通「注册 → 体验 → 购买积分」完整转化漏斗
- Checkout session 携带 `metadata.credits`，webhook 直接读取，不依赖金额换算
- 修复现有 webhook 两个 bug（`event.type` → `event.eventType`，金额换算 → metadata）
- 注册时自动赠送 5 积分，启用 `SITE_AUDIT_BASIC` 积分计费（cost=5）
- 计费页展示余额、套餐卡、消费记录

**Non-Goals:**
- 订阅制（后期实现）
- 积分月度重置、过期机制
- SEM 功能
- Admin 积分调整 UI（直接通过 seed 更新 SkillConfig）

---

## Decisions

### D1: 产品配置维护在 `src/lib/billing/products.ts`（单一数据源）

将 `productId → { credits, price, label }` 维护在一个常量文件中，Checkout API 和计费页面都从这里读取。

**Why**: 避免产品 ID 散落在前端和后端两处导致不一致；Creem 产品 ID 是固定的，不需要数据库存储。

**Alternatives considered**:
- 存入数据库：过度工程化，产品数量固定为 3，且需要管理界面。
- 硬编码在路由文件中：Checkout API 和页面会分别维护，易失同步。

### D2: Checkout API 在服务端调用 Creem REST API（不用 SDK）

`POST /api/billing/checkout` 接收 `productId`，校验后直接调用 `https://api.creem.io/v1/checkouts`（Bearer token），返回 `checkoutUrl`。

**Why**: Creem 官方 SKILL.md 推荐方式；避免引入额外 SDK 依赖；请求体简单（product_id + metadata + success_url）。

**Alternatives considered**: npm 安装 creem SDK — 目前 Creem 无官方 Node SDK，第三方包维护不确定。

### D3: 注册赠送积分通过拦截 better-auth 注册 API route 实现

better-auth 不提供 `afterSignUp` server hook，但所有注册请求经过 `/api/auth/[...all]/route.ts`。在该 route 中检测注册事件类型后执行积分赠送。

**Why**: 比修改 `auth.ts` 更直接；better-auth 的 `databaseHooks` 支持 `user.create.after`，可以在此 hook 中调用 prisma 事务。

**实际方案**：使用 `better-auth` 的 `databaseHooks.user.create.after` hook（在 `auth.ts` 中配置），在用户记录插入后立即执行赠送逻辑。这样不需要修改 API route。

**Alternatives considered**:
- 在注册 UI 提交后调用 Server Action — 客户端可跳过，不可靠。
- 定时 Job 检测 0 积分用户 — 有延迟，体验差。

### D4: Webhook 事件字段修复（`eventType` 非 `type`）

Creem 实际发送的 webhook payload 使用 `eventType` 字段而非 `type`。同时将积分来源从 `amountPaidCents * rate / 100` 改为 `metadata.credits`。

**Why**: `metadata.credits` 在 Checkout 创建时已写入，是产品配置的权威来源；与金额解耦后可随时更改套餐积分数而无需修改 webhook。

### D5: SkillConfig 积分消耗通过 seed-skills.ts 更新

更新 `prisma/seed-skills.ts` 中 `SITE_AUDIT_BASIC` 的 `cost`（0 → 5），并 upsert `GEO_WRITER_FULL`（35 → 15）、添加 `COMPETITOR_ANALYSIS`（8 积分）。

**Why**: 与现有 seed 模式一致；`npx prisma db seed` 可重复执行。

---

## Risks / Trade-offs

**[重复赠送积分]** → 如果用户注册流程异常重试，`databaseHooks.user.create.after` 可能触发多次。
Mitigation：在赠送前查询用户现有 `CreditTransaction` 中 `type=BONUS` 且 `description` 包含"注册赠送"的记录，若已存在则跳过。

**[Checkout 幂等性]** → 用户重复点击购买按钮可能创建多个 Checkout session。
Mitigation：Creem session 在用户完成支付前只会触发一次 webhook，重复创建 session 不会重复扣款；前端按钮加 loading 防止多次点击。

**[Webhook metadata 为空]** → 早期测试创建的 Checkout 没有 `metadata.credits`。
Mitigation：Webhook 中若 `metadata.credits` 为空则返回 400（而非静默忽略），日志记录 checkout ID，便于排查。

**[CREEM_API_KEY 未配置]** → 本地开发缺失时 Checkout API 报 500。
Mitigation：Checkout API 启动时检查环境变量，缺失时返回明确错误信息。

**[GEO_WRITER_FULL 成本从 35 → 15]** → 现有用户可能已基于 35 积分建立预算预期。
Mitigation：当前用户量处于早期，降价对用户是正向改变；通过 seed upsert 更新不影响已有 CreditTransaction 记录。

---

## Migration Plan

1. 添加 `CREEM_API_KEY` 到 `.env.local` 和 Vercel 环境变量
2. 部署新代码（`products.ts`、Checkout API、Billing 页面、Webhook 修复、auth hook）
3. 运行 `npx prisma db seed` 更新 SkillConfig 积分消耗

**Rollback**:
- Webhook 修复是向后兼容的（旧 checkout 无 metadata.credits 会返回 400 而不是错入账）
- Billing 页面和 Checkout API 是新增，无破坏性
- SkillConfig 可通过 Admin UI 手动回滚 cost 值

---

## Open Questions

- **Creem success_url**: 支付成功后跳转到 `/dashboard/billing?success=1`，是否需要额外验证（防止用户手动构造 URL 触发成功提示）？→ 目前仅做 UI 提示，无安全风险，webhook 才是真正入账触发点。
- **积分不足引导**: 操作前检查 `user.credits < skill.cost` 时跳转 `/dashboard/billing`，还是弹 Modal？→ 跳转更简单，先实现跳转，Modal 后续优化。
