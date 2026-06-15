# activation-coach-layer — 上线前手动事项

> 代码已修复并通过 `tsc` / `check:cjk` / 阶段判定单测 / 真实站点端到端重算。
> 以下是**只能你手动完成**的事项,部署前逐项确认。

## 1. 数据库 ✅ 已就绪(无需操作)
已核实生产库:
- `Site.onboardingStage` 列存在
- `CoachMove` 表 + 索引 `CoachMove_siteId_status_idx` 存在
- `Competitor.reason` 列 + 唯一索引 `Competitor_siteId_domain_key` 存在,且无重复行

> 注意:这些是用 `prisma db push` 直接应用的,**没有 migration 文件**。
> 若以后改用 `prisma migrate dev`,需先 `migrate resolve` 对齐历史,否则会想重建已存在的表。

## 2. Google 登录 OAuth 回调(必须配置,否则 Google 登录回跳失败)
新增了 `socialProviders.google`(复用 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)。
better-auth 的回调地址与 GSC/GA4 用的不同,需在 **Google Cloud Console → 凭据 → OAuth 客户端** 的
"已获授权的重定向 URI" 中**新增**:

```
https://www.scaletotop.com/api/auth/callback/google
https://scaletotop.com/api/auth/callback/google   (若根域也用)
http://localhost:3000/api/auth/callback/google     (本地调试)
```

> 不加这条,点 "Google 登录" 会在 Google 侧报 redirect_uri_mismatch。
> 已有的 GSC/GA4 redirect URI 保留不动。

## 3. 部署后验证清单
- [ ] 已登录用户在首页 hero 输域名 → 直接进 `/dashboard/onboarding`(不再要求注册)
- [ ] 未登录 → `/login`,可用「验证码」或「密码」两种方式登录
- [ ] 验证码登录后出现「设置密码」步骤;设置成功后登出再用密码可直登(验证 `setInitialPassword`)
- [ ] Google 登录可完成回跳(依赖第 2 步)
- [ ] 首页输域名经注册/OAuth 后,域名未丢(落到 onboarding 时已带域名)
- [ ] 新站 onboarding 自动产出:本体 + 竞品候选(可勾选确认)+ 缺口
- [ ] onboarding 完成 → 落到 `/dashboard`(增长主页),不是裸 tab 页
- [ ] 增长主页:阶段标识 + 本周招式(带真实数字理由 + 一键深链)+ 动量 Pulse + 闭环3阶段
- [ ] 招式卡的 CTA 深链能正确切到对应 tab(#integrations / #strategy / #audit 等)
- [ ] 招式卡「忽略(X)」后该建议消失,刷新不再出现
- [ ] 多站用户 `/dashboard` 看到组合概览(每站阶段 + 待办数)

## 4. 阈值可调
生命周期判定阈值集中在 [src/lib/coach/lifecycle.ts](../src/lib/coach/lifecycle.ts) 的 `STAGE_THRESHOLDS`,
真实数据积累后按需调整(展示量 100 / 5000、冷启动页数 30、规模化页数 300)。

## 5. 待后续 change(本期明确未做)
GSC 白手套代接 · 周报邮件 · agent autoExecute · 真·AI 引用测量 · 内容分发层 · pgvector 站点画像。
