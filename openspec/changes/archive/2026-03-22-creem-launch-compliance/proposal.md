## Why

Creem.io 上线前需通过账户审核（Account Review），审核通过后才能激活收款。对照 Creem 的 10 项审核清单，当前网站存在 4 个硬性缺口会直接导致审核被拒，另有 3 个软性问题需同步修复。本次变更的目标是打通上线收款的最后一公里。

## What Changes

### 🔴 硬性缺口（不修复将被 Creem 拒绝）

- **定价页与实际售价不符**：`/pricing` 显示旧套餐（100积分/$9.9），与计费系统（50/$9、130/$19、300/$39）完全不一致，属于"虚假信息"
- **`/contact` 页面不存在**：Footer 有链接但落地页 404，客服邮件无法公开访问
- **Dashboard 内无客服邮件**：Creem 明确要求支持邮件在 dashboard 内可见
- **无独立退款政策页**：需要独立 `/refund` 页面说明响应时限（3个工作日）

### 🟡 同步修复（提升审核通过率 + 业务合规性）

- **重写隐私条款**（双语中英）：现有版本过于简短，缺少 GDPR 标准章节（数据保留期、跨境传输、Cookie 政策等）
- **重写服务条款**（双语中英）：缺少退款流程描述、积分不可转让声明、争议解决条款
- **Admin 退款功能**：在管理后台新增对用户积分手动退款/调整的操作入口，配合退款政策实际执行

## Capabilities

### New Capabilities

- `contact-page`: 独立联系页面，展示品牌客服邮件 `support@scaletotop.com`，含简单联系表单（客户端 mailto）
- `refund-policy-page`: 独立退款政策页 `/refund`，明确 3 个工作日响应承诺、退款范围（技术故障）、不退款场景（已消耗积分）
- `admin-credit-refund`: 管理后台为指定用户增加/扣减积分，并记录 REFUND 类型 CreditTransaction，含操作备注

### Modified Capabilities

- `billing-page`: 更新定价页，与实际计费套餐同步（50/$9、130/$19、300/$39），删除旧占位套餐
- `legal-pages`: 重写隐私条款和服务条款为双语版本（中文主体 + 英文附录），补充缺失的法律标准章节
- `dashboard-support-visibility`: 在用户 dashboard（侧边栏或设置页）添加品牌客服邮件的可见展示

## Impact

新增文件：
- `src/app/(public)/contact/page.tsx` — 联系页面
- `src/app/(public)/refund/page.tsx` — 退款政策页
- `src/app/(protected)/dashboard/admin/(admin-only)/credit-refund/page.tsx` — 积分退款管理页
- `src/app/api/admin/credit-adjust/route.ts` — 积分调整 API（管理员权限）

修改文件：
- `src/app/(public)/pricing/page.tsx` — 更新为实际套餐定价
- `src/app/(public)/privacy/page.tsx` — 重写为双语合规版本
- `src/app/(public)/terms/page.tsx` — 重写为双语合规版本
- `src/components/layout/MainLayout.tsx` — Footer 补充退款政策链接
- `src/app/(protected)/dashboard/` 相关布局 — 添加客服邮件展示
