# Sprint 4 — 工具入口公开化 + 页面实装规格

## 目标

降低工具发现门槛；让 Case Studies 和 Consultation 成为有实际内容的转化页面。本 Sprint 不修改工具核心逻辑，只做入口和内容实装。

## 4.1 工具入口优化

### 导航变更

在公开导航 Header（`src/app/(public)/layout.tsx` 或 Header 组件）中将工具链接改为直接指向 `/tools/geo-writer`，不再只是 `/tools` 列表页。

### 首页新增工具区块

在现有"方法/流程"区块下方，新增 1-2 个工具卡片：

```
┌──────────────────────────────────┐
│  🛠 免费 AI 工具                  │
│                                  │
│  [GEO 内容优化器]                 │
│  为 AI 搜索引擎优化内容，提升      │
│  Citation 概率                   │
│                                  │
│  → 立即试用（免费）               │
└──────────────────────────────────┘
```

工具卡片指向 `/tools/geo-writer`，无需登录可访问（工具本身已是公开页面，确认权限逻辑）。

## 4.2 Case Studies 页面

### 路由

新建 `src/app/(public)/case-studies/page.tsx` 和 `src/app/(public)/case-studies/[slug]/page.tsx`

### 数据结构

```typescript
interface CaseStudy {
  slug: string
  client: string        // 可匿名，如"某跨境电商品牌"
  industry: string
  challenge: string
  solution: string
  results: {
    metric: string
    before: string
    after: string
  }[]
  quote?: string
  duration: string      // 如"3 个月"
}
```

### 内容要求

至少 3 个真实案例（内容由你提供）。每个案例页输出 JSON-LD（`Article` schema）。

### SEO

- `generateMetadata` 输出 `title`、`description`、`openGraph`
- 列表页 breadcrumb JSON-LD

## 4.3 Consultation 表单

### 路由

`src/app/(public)/consultation/page.tsx`（已有路由则更新，没有则新建）

### 表单字段

```
姓名 *
邮箱 *
公司/品牌名称
业务描述（你在做什么、目标市场）*
预算范围（< $500 / $500-2000 / $2000+ / 待定）
```

### 提交 Server Action

```typescript
// src/app/actions/consultation.ts
export async function submitConsultation(data: ConsultationForm) {
  // 1. 发送邮件通知给 jack47.chn@gmail.com（Resend）
  // 2. 发送确认邮件给用户（Resend）
  // 3. systeme.io addContact(email, name, ['consultation_request'])
  // 4. PostHog 追踪 'consultation_submitted'
}
```

### 成功状态

提交成功后显示感谢状态（不跳转页面），告知"24 小时内回复"。

## 新增路由

| 路由 | 组件 | 备注 |
|------|------|------|
| `/case-studies` | `CaseStudiesPage` | 列表 |
| `/case-studies/[slug]` | `CaseStudyDetailPage` | 详情 |
| `/consultation` | `ConsultationPage` | 表单，可能已存在 |

## 验收标准

- 导航中可直接点击进入 geo-writer 工具（不需要经过 /tools 列表）
- Case Studies 有 3 个案例，每个有真实数字
- Consultation 表单提交后，jack47.chn@gmail.com 收到通知邮件，用户收到确认邮件
- systeme.io 中出现打了 `consultation_request` 标签的联系人
