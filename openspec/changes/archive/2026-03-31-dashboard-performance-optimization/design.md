## Context

应用服务器（美国西部）与数据库（Supabase 孟买，ap-south-1）之间 RTT ~220ms。better-auth 使用 Prisma 数据库适配器，`getSession()` 每次都查数据库。单次页面加载会触发 6-7 次 session 查询，加上数据查询约 2.4 秒纯网络开销。目前代码中没有任何服务端缓存，API 路由几乎都是裸返回（无 `Cache-Control` 头）。

关键文件现状：
- `src/lib/auth.ts` — better-auth 配置，无任何 session 缓存
- `src/lib/site-intelligence/sites.ts` — `getSiteById` 每次直接查 Prisma，被 `generateMetadata` 和 page component 各调一次
- `src/app/(protected)/dashboard/page.tsx` — `getUserData` 包含 8 个并行 Prisma 查询，无缓存
- 大部分 `/api/dashboard/sites/[siteId]/*` 路由 — 无 `Cache-Control` 头

## Goals / Non-Goals

**Goals:**
- 消除重复的 session DB 查询（目标：每次请求 0 次 session DB 查询）
- 消除同一请求周期内的重复 Prisma 查询（`getSiteById` 双重调用）
- 为只读 API 路由添加 HTTP 缓存头，让浏览器缓存响应
- 不引入新的外部依赖

**Non-Goals:**
- 不引入 Redis 或其他外部缓存层
- 不重构 OverviewPanel 的客户端数据获取逻辑
- 不引入 SWR/React Query
- 不解决数据库地理延迟根本问题（DB 迁移是独立操作）

## Decisions

### 决策 1：使用 better-auth 内置 `cookieCache` 而非自己实现 session 缓存

**选择**：在 `auth.ts` 中配置 `session.cookieCache`，让 session payload 加密写入 cookie。

**为什么**：
- better-auth 已内置此能力，零依赖，一行配置
- Cookie 由 `BETTER_AUTH_SECRET` 加密，安全性与数据库存储等同
- 服务端解密 cookie 的 CPU 开销远小于一次 DB round trip（~220ms）

**替代方案排除**：
- *内存 LRU 缓存*：多进程/多实例下 session 不共享，Node.js 重启后失效，不适合生产
- *Redis*：引入新依赖和运维成本，对于仅解决 session 查询问题过重
- *JWT*：better-auth 默认是数据库 session，切换需要较大架构改动，且失去服务端强制失效能力

**TTL 设定**：`maxAge: 300`（5 分钟）。Session 数据（用户角色、ID）变化频率极低，5 分钟内的缓存不会引起权限延迟问题。用户登出时 cookie 会被清除，不存在安全风险。

---

### 决策 2：使用 Next.js `unstable_cache` 包装 Prisma 查询

**选择**：用 `unstable_cache` 包装 `getSiteById` 和 `getUserData`，设置 tag-based 失效。

**为什么**：
- Next.js App Router 内置，无额外依赖
- 支持 `revalidateTag` 精准失效，不会缓存过期脏数据
- 在同一请求周期内自动去重（React cache 语义），解决 `generateMetadata` + page 双重查询问题
- `unstable_cache` 在 Next.js 15+ 已趋稳定（尽管名称仍带 `unstable_` 前缀）

**替代方案排除**：
- *React `cache()`*：仅在单次请求周期内有效，不跨请求，无法减少相邻用户的 DB 压力
- *手动 in-memory 缓存*：多实例不共享，且需要自己实现失效逻辑

**Tag 设计**：
```
site-{siteId}     → getSiteById 缓存，站点数据更新时失效
user-{userId}     → getUserData 缓存，用户数据更新时失效
```

**TTL 设定**：
- `getSiteById`：60 秒。站点配置（domain、name、integrations）变化频率低。
- `getUserData`（dashboard 聚合）：30 秒。包含 credits 余额，余额变化后需要 `revalidateTag('user-{userId}')`。

**写操作失效点**：
- 站点创建/更新/删除 → `revalidateTag('site-{siteId}')`
- 用户 credits 变更（支付 webhook、技能执行）→ `revalidateTag('user-{userId}')`

---

### 决策 3：HTTP 缓存头使用 `private` + `stale-while-revalidate`

**选择**：`Cache-Control: private, max-age=N, stale-while-revalidate=M`

**为什么**：
- `private` 确保只有用户浏览器缓存，不被 CDN/代理缓存（数据是用户私有的）
- `stale-while-revalidate` 让浏览器在缓存过期后仍立即返回旧数据，同时后台刷新，用户感知零等待
- 无需引入任何库，纯 HTTP 标准

**各路由 TTL 设定**：
| 路由 | max-age | stale-while-revalidate | 理由 |
|------|---------|------------------------|------|
| `/audits` | 60s | 120s | 审计历史不频繁变化 |
| `/competitors` | 120s | 240s | 竞争对手数据变化极少 |
| `/semantic-gap` | 300s | 600s | 语义分析结果稳定 |
| `/strategy` | 60s | 120s | 策略板数据可能被用户编辑 |

## Risks / Trade-offs

**[风险] Cookie 体积增大**
→ Session payload 加密后约增加 1-2KB cookie 体积。现代浏览器 cookie 限制 4KB/条，不会超限。可监控 `Set-Cookie` 响应头大小确认。

**[风险] `unstable_cache` API 可能在未来 Next.js 版本变更**
→ 该 API 在 Next.js 15 已稳定使用，`unstable_` 前缀是历史遗留。变更时影响范围局限于 `sites.ts` 和 `dashboard/page.tsx`，迁移成本低。

**[风险] 缓存失效遗漏导致数据短暂过时**
→ 需要审查所有写操作入口并补全 `revalidateTag` 调用。最坏情况是用户看到 30-60 秒内的旧数据，不影响数据完整性，只影响新鲜度。

**[Trade-off] cookieCache 启用后 session 撤销有最多 5 分钟延迟**
→ 如果管理员强制登出某个用户（ban 操作），该用户的 cookie 仍可在 5 分钟内通过验证。当前系统无此类强制登出需求，可接受。如未来需要此能力，可将 cookieCache TTL 降低到 60 秒。

## Migration Plan

1. 先上线 `cookieCache`（独立改动，风险最低，效果最大）
2. 再上线 `unstable_cache` 包装层（需确认所有写操作都有对应的 `revalidateTag`）
3. 最后补全 API 路由缓存头（纯加法，无风险）

**回滚**：每项改动独立可回滚。`cookieCache` 回滚只需删除配置项；`unstable_cache` 回滚只需去掉包装函数；HTTP 缓存头回滚只需删除 header。

## Open Questions

- better-auth `cookieCache` 是否与当前使用的 `emailOTP` 插件兼容？需要查阅 better-auth 文档确认插件间无冲突。
- `getUserData` 中的 `credits` 字段：哪些写操作路径（技能执行、Creem webhook）需要触发 `revalidateTag('user-{userId}')`？需要在实施时逐一梳理。
