## 1. Webhook 幂等修复（🔴 P0，最高优先级）

- [x] 1.1 在 `src/app/api/webhooks/creem/route.ts` 的 `checkout.completed` 处理块中，在 `try` 块的第一行（`prisma.$transaction` 之前）插入幂等检查：查询 `prisma.creditTransaction.findFirst({ where: { externalId: checkout.id, type: "PURCHASE" } })`，若存在则直接 `return NextResponse.json({ success: true, message: "Already processed" })`

## 2. Header 积分余额展示（🟠 P1）

- [x] 2.1 在 `src/app/(protected)/layout.tsx` 的 header 右侧区域（用户名和头像之间），新增积分余额展示：从 `session.user` 取 `credits`，用 `Number(credits)` 做安全转换，显示 `<Zap>` 图标 + 数字
- [x] 2.2 将余额展示包裹在 `<Link href="/dashboard/billing">` 中，添加 `hover:` 高亮效果

## 3. 低积分提示横幅（🟠 P1）

- [x] 3.1 在 `src/app/(protected)/layout.tsx` 的 `<main>` 标签内、`{children}` 之前，条件渲染低积分横幅：当 `Number(session.user.credits) < 10` 时显示
- [x] 3.2 横幅样式：黄色背景（`bg-amber-50 border-b border-amber-200`），展示"您仅剩 X 积分"文字 + "立即充值"按钮（链接至 `/dashboard/billing`），右侧可关闭（`useState` 控制）

## 4. 工具积分成本展示（🟡 P2）

- [x] 4.1 在 `src/app/(protected)/dashboard/site-intelligence/instant-audit/page.tsx` 的扫描按钮旁，新增文字提示：读取 `/api/skills/list` 中 `SITE_AUDIT_BASIC` 的 cost（或直接展示硬编码 5 积分 fallback），显示"消耗 5 积分"灰色小字
- [x] 4.2 当用户积分 < 5 时，扫描按钮改为链接到 `/dashboard/billing`，文字改为"积分不足，点击充值"
- [x] 4.3 在 `src/app/(protected)/dashboard/tools/` 的 StellarWriter 工具触发按钮旁，同样方式展示 15 积分消耗提示，积分不足时展示充值引导
