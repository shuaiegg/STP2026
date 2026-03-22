## Context

ScaletoTop 处于 Creem.io 上线前的最后合规阶段。Creem 的账户审核是人工审核，24-48 小时内完成，审核不通过需重新提交。当前有 4 个硬性缺口（定价不一致、联系页 404、Dashboard 无客服邮件、无退款页）会直接触发拒绝，必须全部修复后再提交审核。

**关键约束**：
- Admin 退款功能只需在现有 `/admin` 路由体系内新增一个页面，无需修改 Prisma schema（`REFUND` 类型已存在）
- 法律文件（隐私条款、服务条款）需要覆盖 SaaS + AI 服务 + 国际支付三个维度
- 双语策略：中文为主体（面向中国出海用户），英文附在同一页面下方（面向 Creem 审核人员和国际用户）

---

## Goals / Non-Goals

**Goals:**
- 通过 Creem 账户审核，激活收款
- 客服邮件 `support@scaletotop.com` 在公开网站和 dashboard 内均可见
- 退款政策有独立页面，承诺 3 个工作日响应
- Admin 可手动为用户增减积分（含退款操作）
- 法律文件达到国际 SaaS 合规水平

**Non-Goals:**
- 实际对接 Creem 退款 API（本阶段手动处理退款请求）
- 多语言 i18n 框架（双语直接写在同一页面，不引入 next-intl 等）
- Cookie 同意弹窗（GDPR 合规的下一步，本次不实现）

---

## Decisions

### D1: 定价页改为纯展示 + 跳转计费页的 CTA

定价页 `/pricing` 更新为展示当前 3 个套餐，价格与 `CREDIT_PRODUCTS` 数据源保持一致，但不在此页面实现购买逻辑——保留「立即购买」按钮跳转至 `/dashboard/billing`。

**Why**: 定价页是 Server Component，购买逻辑在 `BillingClient`（Client Component）。复用已有逻辑，避免两处维护。

### D2: 法律文件双语策略：中文主体 + 英文折叠展示

同一页面：中文版完整展示，英文版在「English Version」折叠区域内。两种语言内容对等，不相互引用。

**Why**: 避免引入 i18n 框架的复杂度；Creem 审核人员能直接访问英文内容；中国用户默认看中文。

### D3: Admin 积分调整 API 使用 Server Action + 独立路由

新增 `POST /api/admin/credit-adjust` API Route（不用 Server Action），接收 `{ userId, amount, type, note }`，验证 ADMIN 角色后执行 Prisma 事务（更新 User.credits + 创建 CreditTransaction）。

**Why**: 与现有 `chargeUser()` 模式一致；Server Action 不适合从 admin 页面的 form submit 直接调用，REST API 更易于前端表单处理和错误展示。

**amount 的符号约定**：REFUND 类型传正数（加回积分），CONSUMPTION 类型传负数（扣减），由 API 统一处理。

### D4: Dashboard 客服邮件展示在侧边栏底部

在用户 dashboard 侧边栏的底部（现有 Settings 链接下方）新增一个小型客服提示区，显示 `support@scaletotop.com` + 邮件图标。

**Why**: 侧边栏是 dashboard 内所有页面的持久性可见区域，满足 Creem「在用户 dashboard 内可见」的要求，且改动最小。

---

## Risks / Trade-offs

**[手动退款流程]** → 用户申请退款后需 Admin 手动操作，如果团队忙碌可能超过 3 个工作日响应承诺。
Mitigation：退款政策页注明 3 个工作日响应，Admin 页面显示待处理天数提醒。

**[定价页与计费系统硬编码同步]** → `CREDIT_PRODUCTS` 更新时需手动同步定价页。
Mitigation：定价页直接 import `CREDIT_PRODUCTS` 读取数据，单一数据源，无需手动同步。

**[法律文件非专业法律顾问审查]** → 生成的隐私条款和服务条款未经律师审核，可能存在法律漏洞。
Mitigation：内容覆盖 GDPR/CCPA 标准章节，满足 Creem 审核；专业法律审查作为后续步骤。

---

## Migration Plan

1. 提交代码，部署到生产
2. 邮件服务商创建 `support@scaletotop.com` 邮箱
3. 在 Creem Dashboard 提交账户审核

**Rollback**: 所有变更均为新增/修改页面，无 Prisma schema 变动，无破坏性。

---

## Open Questions

- 退款政策中的「技术故障退款」是否需要定义具体触发条件（如：生成失败不扣积分已有保护，退款仅针对已扣但无法使用的情况）？→ 暂定：仅系统 bug 导致积分扣除但工具未执行时可申请退款，正常使用后不退。
- Admin 积分调整是否需要操作日志（记录哪个 Admin 做了调整）？→ 暂不实现，CreditTransaction.description 字段记录操作备注已足够追溯。
