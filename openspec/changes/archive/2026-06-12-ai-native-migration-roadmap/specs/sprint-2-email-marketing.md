# Sprint 2 — 邮件营销规格

## 职责分工

```
Resend（src/lib/email.ts 扩展）         systeme.io（src/lib/email/systeme.ts）
────────────────────────────────        ────────────────────────────────────
欢迎邮件（注册后即时）                    注册引导序列（7天，多封）
密码重置（better-auth 接入）             onboarding 完成后的升级引导序列
低积分预警（< 50 credits）               7天未活跃再营销序列
购买成功确认                             14天未消耗 credits 再营销
审计完成通知                             （在 systeme.io 平台配置自动化规则）
Consultation 提交确认
```

## 文件结构

```
src/lib/email/
  templates/
    welcome.ts             # sendWelcomeEmail(user)
    credits-warning.ts     # sendCreditsWarningEmail(user, remaining)
    purchase-success.ts    # sendPurchaseSuccessEmail(user, creditsAdded)
    audit-complete.ts      # sendAuditCompleteEmail(user, siteId, domain)
    consultation-confirm.ts # sendConsultationConfirmEmail(email, name)
  systeme.ts               # addContact(email, name, tags[])
```

## systeme.io API 集成

```typescript
// src/lib/email/systeme.ts
const BASE_URL = 'https://api.systeme.io/api';

export async function addContact(email: string, name: string, tags: string[] = []) {
  const res = await fetch(`${BASE_URL}/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': process.env.SYSTEME_IO_API_KEY!,
    },
    body: JSON.stringify({ email, fields: [{ slug: 'full_name', value: name }], tags }),
  });
  if (!res.ok) {
    console.error('[systeme.io] Failed to add contact:', await res.text());
  }
}
```

**标签命名约定**：
- `registered` — 注册完成，触发引导序列
- `onboarding_completed` — 完成首次站点分析
- `inactive_7d` — 注册 7 天未完成 onboarding
- `inactive_14d` — 注册 14 天未消耗 credits
- `consultation_request` — 提交了咨询表单

## Prisma 变更

```prisma
model User {
  // 新增字段（防止低积分邮件重复发送）
  lastCreditWarningAt  DateTime?
}
```

## 触发点汇总

| 邮件 | 触发文件 | 条件 |
|------|---------|------|
| 欢迎邮件 | `src/app/actions/auth.ts` | 注册成功后 |
| 密码重置 | `src/lib/auth.ts` | better-auth sendResetPassword |
| 低积分预警 | `src/app/api/skills/execute/route.ts` | credits < 50 且距上次发送 > 24h |
| 购买确认 | `src/app/api/webhooks/creem/route.ts` | checkout.completed |
| 审计完成 | 审计完成回调位置 | audit status → COMPLETED |
| 咨询确认 | Consultation Server Action | 表单提交成功 |

## n8n 再营销 Workflow

**Workflow 1：7天未完成 Onboarding**
```
Cron（每日 10:00）
  → HTTP Request: GET /api/admin/users?registered_before=7d&site_count=0
  → 遍历用户列表
  → HTTP Request: POST systeme.io /contacts（打 inactive_7d 标签）
```

**Workflow 2：14天未消耗 Credits**
```
Cron（每日 10:00）
  → 查询 User 表：registered > 14天 AND CreditTransactions 中无 CONSUMPTION 类型
  → 打 inactive_14d 标签
```
