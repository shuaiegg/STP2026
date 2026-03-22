## 1. 产品配置与基础设施

- [x] 1.1 新增 `src/lib/billing/products.ts`，导出 `CREDIT_PRODUCTS` 数组（3个套餐 ：50/$9、130/$19、300/$39），包含 `productId`、`credits`、`price`、`label`、`recommended` 字段
- [x] 1.2 在 `.env.local` 中添加 `CREEM_API_KEY=` 占位注释，在 `CLAUDE.md` 的环境变量表中记录该变量

## 2. Checkout API

- [x] 2.1 新增 `src/app/api/billing/checkout/route.ts`：POST 路由，鉴权（`auth.api.getSession`），接收 `{ productId }`，验证是否在 `CREDIT_PRODUCTS` 中
- [x] 2.2 调用 Creem API `POST https://api.creem.io/v1/checkouts`（Bearer `CREEM_API_KEY`），body 包含 `product_id`、`metadata: { userId, credits }`、`success_url: /dashboard/billing?success=1`
- [x] 2.3 返回 `{ checkoutUrl }` 或错误响应（400/401/500）

## 3. Webhook 修复

- [x] 3.1 修改 `src/app/api/webhooks/creem/route.ts`：将 `event.type` 改为 `event.eventType`
- [x] 3.2 将积分来源从 `amountPaidCents * CREDIT_CONVERSION_RATE / 100` 改为 `parseInt(checkout.metadata?.credits)`
- [x] 3.3 若 `metadata.credits` 为空或 0，返回 HTTP 400 并记录 checkout ID（移除旧 的"Zero credits"静默返回逻辑）
- [x] 3.4 更新 CreditTransaction description 文案，反映新的积分来源（移除汇率描述）

## 4. 注册赠送积分

- [x] 4.1 在 `src/lib/auth.ts` 的 `betterAuth` 配置中添加 `databaseHooks.user.create.after` hook
- [x] 4.2 Hook 逻辑：检查用户是否已有 `type=BONUS` 且 `description` 含"注册赠送"的 CreditTransaction，若无则执行 `prisma.$transaction`：`user.update({ credits: { increment: 5 } })` + `creditTransaction.create({ type: 'BONUS', amount: 5, description: '注册赠送' })`

## 5. SkillConfig 积分消耗更新

- [x] 5.1 修改 `prisma/seed-skills.ts`：将 `SITE_AUDIT_BASIC` 的 `cost` 从 0 改为 5，`isActive` 改为 true
- [x] 5.2 在 `seed-skills.ts` 中 upsert `GEO_WRITER_FULL`（cost: 15）和 `COMPETITOR_ANALYSIS`（cost: 8，新增）
- [x] 5.3 运行 `npx prisma db seed` 应用更新（或提供运行指令）

## 6. 计费页面重写

- [x] 6.1 重写 `src/app/(protected)/dashboard/billing/page.tsx`：Server Component，从 Prisma 获取用户当前积分余额和最近 10 条 CreditTransaction
- [x] 6.2 实现积分余额卡片（余额数字 + "积分" 标签）
- [x] 6.3 实现三个套餐卡片（读取 `CREDIT_PRODUCTS`），标准包带"推荐"badge，每卡显示：积分数、价格、单价（$/积分）、相较入门包的节省百分比
- [x] 6.4 实现购买按钮：客户端 `onClick` 调用 `POST /api/billing/checkout`，拿到 `checkoutUrl` 后 `window.location.href` 跳转；按钮加 loading 状态防重复点击
- [x] 6.5 实现 `?success=1` 检测：页面加载时若 URL 含 `success=1` 则显示成功 toast/提示（"支付成功！积分将在几分钟内到账"）
- [x] 6.6 实现消费记录列表：显示最近 10 条 CreditTransaction，每行含日期、中文类型 标签（购买/使用/赠送/退款）、金额（正负）、描述

## 7. 积分不足引导

- [x] 7.1 在即时审计触发点（`src/app/(protected)/dashboard/site-intelligence/instant-audit/page.tsx`）发起扫描前检查积分余额，若 < 5 则显示"积分不足"提示并渲染跳转 `/dashboard/billing` 的链接按钮，阻止扫描发起
