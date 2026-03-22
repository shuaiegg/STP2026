## Why

当前积分购买流程存在一个关键缺口：webhook 只记录了积分变动，没有保存 Creem 的 checkout ID（如 `ch_2ErMHG3ZFrDCWE6EU49jVZ`）。这导致：

1. **退款无法追溯**：Admin 无法在 Creem Dashboard 中找到对应订单，因为两个系统之间没有 ID 关联
2. **无订单视图**：Admin 无法查看用户的历史购买记录，只能看到积分流水
3. **退款后积分不会自动扣回**：Creem 处理退款后会发 `refund.created` webhook，但当前 webhook handler 没有处理该事件，导致退款后用户积分仍保留

注：经调查，Creem 不提供 refund creation API，退款须由 Merchant 在 Creem Dashboard 手动发起，之后 Creem 自动触发 `refund.created` webhook 通知我们系统。

## What Changes

### 数据层

- `CreditTransaction` schema 新增 `externalId String?` 字段，存储 Creem checkout ID
- Webhook handler 保存 `checkout.id` 到 `externalId`
- 处理 `refund.created` 事件：自动扣除用户积分并记录 REFUND 类型流水

### 管理功能

- 新建订单管理页 `/dashboard/admin/orders`：列出所有用户的 PURCHASE 记录，显示 checkout ID（用于在 Creem Dashboard 查找对应订单），支持按用户邮件过滤
- 退款操作流程：Admin 在页面看到订单 → 去 Creem Dashboard 手动退款 → 等待 webhook 自动扣积分（或手动触发积分扣减作为备选）

## Capabilities

### New Capabilities

- `order-management-page`: 管理员订单列表页，展示 PURCHASE 类型的积分流水 + 关联的 Creem checkout ID + 用户信息

### Modified Capabilities

- `credit-system`:
  - `CreditTransaction` 新增 `externalId` 字段
  - webhook 在 `checkout.completed` 时保存 `checkout.id`
  - webhook 新增 `refund.created` 事件处理（扣减积分 + 记录 REFUND 流水）

## Impact

**Schema 变更（需 `npx prisma db push`）：**
- `prisma/schema.prisma` — `CreditTransaction` 加 `externalId String?`

**修改文件：**
- `src/app/api/webhooks/creem/route.ts` — 保存 externalId + 处理 refund.created

**新增文件：**
- `src/app/(protected)/dashboard/admin/(admin-only)/orders/page.tsx` — 订单管理页
- `src/app/api/admin/orders/route.ts` — 订单查询 API
