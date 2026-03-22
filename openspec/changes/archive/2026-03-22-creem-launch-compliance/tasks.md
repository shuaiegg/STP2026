## 1. 定价页修复（🔴 最高优先级）

- [x] 1.1 修改 `src/app/(public)/pricing/page.tsx`：import `CREDIT_PRODUCTS` 常量，替换硬编码的旧套餐数 据（100/$9.9、350/$29），展示 3 个真实套餐卡（50/$9、130/$19、300/$39）
- [x] 1.2 保留页面视觉风格，更新价格、积分数、特性描述；「推荐」badge 加在标准包（130积分）
- [x] 1.3 购买按钮改为：已登录 → `/dashboard/billing`，未登录 → `/register`（通过 `useSession` 判断）

## 2. 联系页面（🔴）

- [x] 2.1 新增 `src/app/(public)/contact/page.tsx`，展示 `support@scaletotop.com` 为可点击 `mailto:` 链 接，页面标题"联系我们 / Contact Us"
- [x] 2.2 页面包含简短中英双语说明，承诺 3 个工作日内回复

## 3. Dashboard 客服邮件展示（🔴）

- [x] 3.1 找到 dashboard 侧边栏组件（`src/components/` 或 `src/app/(protected)/dashboard/` 布局），在底 部 Settings 链接下方新增客服区域
- [x] 3.2 展示：「需要帮助？」+ `support@scaletotop.com` 的 `mailto:` 链接，带邮件图标

## 4. 退款政策页（🔴）

- [x] 4.1 新增 `src/app/(public)/refund/page.tsx`，包含：退款范围（系统故障）、不退款场景（正常使用）、3个工作日响应承诺、联系方式 `support@scaletotop.com`
- [x] 4.2 内容双语：中文主体 + 英文附录
- [x] 4.3 在 `src/components/layout/MainLayout.tsx` Footer 的法律链接区域新增"退款政策"链接指向 `/refund`

## 5. 隐私条款重写（🟡）

- [x] 5.1 重写 `src/app/(public)/privacy/page.tsx`，中文部分覆盖：数据收集范围、使用方式、第三方处理商（Supabase/PostHog/Resend/Anthropic/DeepSeek/Gemini/Creem）、用户权利、数据保留期、跨境传输说明
- [x] 5.2 补充说明：支付由 Creem.io 作为 Merchant of Record 处理，ScaletoTop 不存储银行卡数据
- [x] 5.3 在同一页面底部新增完整英文版（English Version）折叠区域，内容与中文对等
- [x] 5.4 联系邮件从 `jack@scaletotop.com` 替换为 `support@scaletotop.com`

## 6. 服务条款重写（🟡）

- [x] 6.1 重写 `src/app/(public)/terms/page.tsx`，中文部分覆盖：服务描述、账户要求、积分系统规则（不可转让/不可兑现）、可接受使用政策、AI 内容免责、退款条款（链接至 /refund）、责任限制、管辖法律、终止条款
- [x] 6.2 可接受使用政策明确禁止：自动化滥用、违法内容生成、未经授权转售 AI 输出
- [x] 6.3 在同一页面底部新增完整英文版折叠区域
- [x] 6.4 联系邮件替换为 `support@scaletotop.com`

## 7. Admin 积分退款功能（🟡）

- [x] 7.1 新增 `src/app/api/admin/credit-adjust/route.ts`：POST 路由，验证 ADMIN 角色，接收 `{ userId, amount, type, note }`，执行 Prisma 事务（`user.update credits` + `creditTransaction.create`），amount 为 正数加积分、负数扣积分
- [x] 7.2 新增 `src/app/(protected)/dashboard/admin/(admin-only)/credit-refund/page.tsx`：搜索用户（按邮件）、显示当前余额、输入调整金额（正/负）、类型选择（REFUND/CONSUMPTION）、必填备注、提交按钮
- [x] 7.3 在 Admin 侧边栏导航中添加「积分管理」入口链接至 `/dashboard/admin/credit-refund`
