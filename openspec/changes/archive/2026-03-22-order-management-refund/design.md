## Context

Creem 退款流程（已确认）：

```
Admin 在本系统看到订单 + checkout ID
  → 去 Creem Dashboard 手动发起退款
  → Creem 处理退款
  → Creem 触发 refund.created webhook
  → 本系统 webhook handler 自动扣减用户积分
```

Creem `refund.created` webhook payload 结构（根据 Creem 文档）：
```json
{
  "eventType": "refund.created",
  "data": {
    "id": "ref_xxx",
    "checkout_id": "ch_xxx",
    "amount": 900,
    "currency": "usd"
  }
}
```

通过 `checkout_id` 找到对应的 `CreditTransaction.externalId`，查出该笔购买了多少积分，再扣减。

---

## Goals / Non-Goals

**Goals:**
- 每笔购买在数据库中留存 Creem checkout ID 以便追溯
- `refund.created` webhook 自动扣积分，无需 Admin 手动操作
- Admin 有页面查看所有订单（按用户过滤），能快速找到 checkout ID 复制到 Creem Dashboard

**Non-Goals:**
- 通过代码发起 Creem 退款（API 不支持）
- 订单状态实时同步（不轮询 Creem）
- 部分退款处理（全额退款即可）

---

## Decisions

### D1: externalId 存 checkout ID（非 payment ID）

Creem `checkout.completed` payload 里的 `checkout.id`（如 `ch_xxx`）是最稳定的外部标识，在 Creem Dashboard 也可直接搜索。`refund.created` 里的 `checkout_id` 字段也能关联回来。

**Why**: 双向可查：从我们系统找 Creem 订单（用 externalId 搜 Creem Dashboard），从 Creem webhook 找我们记录（用 checkout_id 查 externalId）。

### D2: refund.created 扣积分策略

找到 `externalId = checkout_id` 的 PURCHASE 交易，取其 `amount` 作为要扣回的积分数。用 Prisma 事务：

```
1. 找到原 PURCHASE CreditTransaction（by externalId）
2. 扣减用户积分：credits - purchase.amount
3. 创建 REFUND CreditTransaction（amount = -purchase.amount，externalId = ref_xxx）
4. 防止重复：检查是否已存在 externalId = ref_xxx 的记录
```

若积分不足（用户已消耗），扣到 0 为止（不允许负数余额）。

### D3: 订单管理页仅展示，不提供"一键退款"按钮

退款必须由 Admin 在 Creem Dashboard 操作，本系统无法代劳。页面提供：
- 订单列表（分页）
- 用户邮件过滤
- 每条显示 checkout ID（一键复制）、积分数、金额、时间
- 状态标记：是否已退款（检查是否存在对应的 REFUND 记录）

**Why**: 避免设计一个"假退款"按钮（只扣积分不退款）误导用户；真实退款在 Creem，积分扣减由 webhook 自动处理。

---

## Migration Plan

1. 修改 `prisma/schema.prisma`
2. `npx prisma db push`（开发）/ `npx prisma migrate dev`（生产）
3. `npx prisma generate`
4. 更新 webhook handler
5. 部署新订单管理页
6. 验证：完成一笔测试支付 → 确认 externalId 写入 → 在 Creem Dashboard 退款 → 确认 webhook 触发 + 积分扣减

---

## Risks

**[已消耗积分的退款]** → 用户购买 50 积分后消耗完毕，再退款，积分将被扣到 0（已是 0 则无法再扣）。
Mitigation: 退款扣积分扣到 0 为止，不产生负数。在订单页展示"剩余可退积分"提示 Admin。

**[externalId 历史数据为空]** → 新字段上线前的历史购买记录 externalId 为 null，订单页无法显示 checkout ID。
Mitigation: 历史记录标注"历史订单（无 checkout ID）"，不影响新订单追溯。
