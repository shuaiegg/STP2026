## Context

better-auth 的 `additionalFields` 已将 `credits` 暴露在 session 对象中（`session.user.credits`），所以 header 显示余额**无需额外 API 调用**，直接读 session 即可。`layout.tsx` 已是 Client Component，可直接使用 `authClient.useSession()`。

`SkillConfig` 表存储每个工具的积分成本，但工具页面目前未加载此配置。工具成本展示需要在工具页面加一次 `GET /api/skills/list`（已有端点）读取对应 skill 的 cost。

---

## Goals / Non-Goals

**Goals:**
- 修复 webhook 幂等漏洞（P0，防止资金损失）
- 在 dashboard 所有页面的 header 持久展示积分余额
- 余额 < 10 时主动提示用户充值
- 工具执行前展示积分成本（P2，按工具逐一接入）

**Non-Goals:**
- 实时 WebSocket 余额更新（session 刷新间隔已足够，支付后页面跳转会刷新 session）
- 积分消耗动画效果
- 工具历史消耗统计图表（属于未来的 analytics 功能）

---

## Decisions

### D1: header 余额从 session 读取，不单独轮询

`authClient.useSession()` 返回的 `session.user.credits` 在 session 刷新时更新（better-auth 每次请求会检查 session updateAge）。支付完成后用户从 Creem 跳回 `?success=1`，页面重载自然刷新 session，余额会更新。

**Why**: 零额外请求，最简实现。唯一缺点是 webhook 到账后若用户不刷新页面，余额不会实时变化——但这是可接受的，toast 已提示"几分钟内到账"。

### D2: 低积分阈值固定为 10

10 积分约等于 2 次站点审计或半篇文章，是一个合理的预警线，不需要用户配置。

### D3: 工具成本展示从 SkillConfig 读取，不硬编码

工具页面启动时调用 `/api/skills/list` 获取当前 skill 的 cost，展示在执行按钮旁。这样积分定价调整时无需改前端代码。

### D4: 低积分横幅放在 layout 主内容区顶部，非侧边栏

侧边栏空间有限，且已有客服邮件展示。横幅放在 `<main>` 区域顶部，固定高度，不影响各页面的主内容布局。

---

## Technical Notes

**Webhook 幂等修复位置**：`route.ts` 第 54 行 `try` 块开头，在 `prisma.$transaction` 之前插入查询。

**session.user.credits 类型**：better-auth `additionalFields` 声明为 `number`，但实际 session 返回可能是 `string`（JSON 序列化问题），建议用 `Number(session.user.credits)` 做安全转换。

**工具页面接入范围**（P2，本次仅实现 StellarWriter 和 Site Audit 两个高频工具）：
- `src/app/(protected)/dashboard/tools/` — StellarWriter
- `src/app/(protected)/dashboard/site-intelligence/instant-audit/` — 即时审计

---

## Risks

**[Session 余额延迟]** → 工具扣积分后，header 余额不会立即变化，直到下次页面跳转触发 session 刷新。
Mitigation: 工具执行成功后触发 `router.refresh()` 刷新 Server Component，或调用 `authClient.refreshSession()`。

**[工具 SkillConfig 查询失败]** → 如果 `/api/skills/list` 超时或出错，工具按钮应 fallback 到不显示成本（不阻塞工具使用）。
