# Sprint 1 — PostHog 全面追踪规格

## 完整事件清单

| 事件名 | 触发时机 | 关键属性 | 端（客户端/服务端） |
|--------|---------|---------|-----------------|
| `homepage_cta_clicked` | 首页 CTA 按钮点击 | `cta: 'primary'|'secondary'` | 客户端 |
| `pricing_viewed` | 定价页加载 | — | 客户端 |
| `pricing_plan_selected` | 定价页套餐按钮点击 | `plan, credits, price` | 客户端 |
| `blog_article_read` | 文章滚动进度 | `slug, category, read_pct: 50|100` | 客户端 |
| `signup_started` | 注册表单提交 / OAuth 点击 | `method: 'email'|'google'` | 客户端 |
| `signup_completed` | 注册成功 | `method` | 客户端 |
| `onboarding_started` | Onboarding 开始分析 | — | 客户端 |
| `onboarding_completed` | Onboarding 分析完成 | `domain` | 客户端 |
| `first_site_added` | 首次添加站点（siteCount 0→1）| `domain` | 客户端 |
| `gsc_connected` | GSC OAuth 回调成功 | `siteId` | 客户端 |
| `ga4_connected` | GA4 OAuth 回调成功 | `siteId` | 客户端 |
| `content_plan_created` | 内容计划创建 | `siteId` | 客户端 |
| `billing_page_viewed` | 计费页加载 | `credits_remaining` | 客户端 |
| `skill_executed` | AI Skill 执行完成 | `skill_name, credits_cost, duration_ms, success` | 服务端 |
| `credits_low` | credits 低于 50 | `remaining` | 服务端 |
| `purchase_completed` | Creem checkout.completed | `product_id, credits_added, amount_usd` | 服务端 |
| `article_saved_to_library` | 文章保存到 Library | `word_count, skill_used` | 客户端 |
| `consultation_submitted` | Consultation 表单提交 | — | 客户端 |
| `mcp_tool_called` | MCP 工具调用（Sprint 5）| `tool_name, success` | 服务端 |

## 服务端客户端实现

```typescript
// src/lib/analytics/posthog-server.ts
import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

function getClient() {
  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return client;
}

export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  // 只在有 key 时追踪，静默失败
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  try {
    getClient().capture({ distinctId, event, properties });
  } catch {
    // 追踪失败不影响业务
  }
}
```

## 注意事项

- 服务端的 `distinctId` 统一用 `userId`（better-auth session.user.id）
- 客户端已在 `PostHogAuthListener.tsx` 里 `posthog.identify(userId)`，确保两端事件合并到同一 Person
- credits_low 事件需配合 `User.lastCreditWarningAt` 防止频繁触发（24h 间隔）
- 开发环境下客户端 PostHog 不初始化（现有逻辑），服务端可以追踪（但建议在开发环境也跳过）
