## 1. Schema 变更（🔴 最先执行，其他任务依赖此步骤）

- [x] 1.1 在 `prisma/schema.prisma` 的 `CreditTransaction` model 中新增字段：`externalId  String?`，并在末尾添加索引 `@@index([externalId])`
- [x] 1.2 执行 `npx prisma db push`（开发）或 `npx prisma migrate dev --name add-external-id-to-credit-transaction`（生产），然后 `npx prisma generate`

## 2. Webhook 更新（🔴）

- [x] 2.1 在 `src/app/api/webhooks/creem/route.ts` 的 `checkout.completed` 处理块中，将 `creditTransaction.create` 的 `data` 对象新增 `externalId: checkout.id`
- [x] 2.2 新增 `refund.created` 事件处理块：
  - 从 `event.data` 取 `checkout_id`（即原购买的 checkout ID）
  - 用 `externalId = checkout_id AND type = PURCHASE` 查找原 CreditTransaction
  - 检查是否已存在 `externalId = event.data.id AND type = REFUND` 的记录（幂等保护）
  - 执行 Prisma 事务：`user.credits` 减去 `min(purchase.amount, user.credits)`，创建 `type=REFUND` CreditTransaction（`externalId = event.data.id`，`amount = -(实际扣除数)`）
  - 若 checkout_id 找不到对应记录，`console.warn` 后返回 200

## 3. 订单查询 API（🟡）

- [x] 3.1 新增 `src/app/api/admin/orders/route.ts`，GET 路由，验证 ADMIN 角色
- [x] 3.2 接受查询参数：`email`（用户邮件过滤，可选）、`page`（默认 1）、`limit`（默认 20）
- [x] 3.3 查询 `CreditTransaction.findMany` where `type = PURCHASE`，include `user { email, name }`，orderBy `createdAt desc`
- [x] 3.4 对每条结果，检查是否存在对应的 REFUND 记录（通过 description 或 externalId 关联），返回 `isRefunded: boolean`

## 4. 订单管理页（🟡）

- [x] 4.1 新增 `src/app/(protected)/dashboard/admin/(admin-only)/orders/page.tsx`（Client Component）
- [x] 4.2 页面顶部：邮件搜索框 + 搜索按钮
- [x] 4.3 订单表格列：用户邮件、积分数、Creem Checkout ID（带一键复制按钮）、下单时间、状态（已退款 badge / 正常）
- [x] 4.4 历史订单（externalId 为 null）在 checkout ID 列显示灰色"历史订单"文字
- [x] 4.5 分页：每页 20 条，底部上一页/下一页按钮
- [x] 4.6 在 `src/app/(protected)/layout.tsx` Admin 导航列表中新增"订单管理"入口，图标用 `ShoppingBag`，链接至 `/dashboard/admin/orders`
