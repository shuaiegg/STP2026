# 首次印象与外壳重做 — 任务清单

> 顺序推进：前门止血 → 首屏惊喜 → 专业外壳 → 双语收尾。
> ⚠️ 完成标准新增一条：**真机跑通 auth 流**（tsc/build 不足以验证 better-auth 运行时）。
> admin 中文 UI；用户侧双语。保持 `localeCookie:false`、root 不 `useLocale`。

---

## Sprint 1 — 前门止血（阻断级，最先）

### 1.1 429 限流
- [x] 1.1.1 `auth.ts` rateLimit：max 提到合理值（~100/60s）；给 `/get-session` 加更高 customRules 配额
- [x] 1.1.2 收敛客户端 `useSession`：单一全局订阅（PostHogAuthListener 等共用一处），其余从 context 读
- [x] 1.1.3 验证：登录 + 浏览 10+ 页，浏览器无 429（真机）

### 1.2 设密码（零二次验证码、可选可跳）
- [x] 1.2.1 运行时确认核心 better-auth 是否有"已认证设密码"API（A 路）
- [x] 1.2.2 A 不可行 → 用 `auth.$context.password.hash` 写/更新 Account credential 账户（B 路）；都不行 → 砍掉（OTP-only）
- [x] 1.2.3 设密码步永远可跳过，不阻断进入；文案/错误双语
- [x] 1.2.4 验证（真机）：OTP 登录后设密码无二次码；设后可用密码直登；跳过也能进

### 1.3 Google 登录
- [x] 1.3.1 核对 `/api/auth/callback/google` 在 Google Console 白名单；consent scopes；baseURL/trustedOrigins 对齐生产
- [x] 1.3.2 确认登录用 client 与 GSC 数据授权（/api/auth/google-callback）互不干扰
- [x] 1.3.3 验证（真机）：新用户 Google 一键登录回跳成功 + 域名 token 不丢

### 1.4 站点删除入口
- [x] 1.4.1 首屏上下文条 / 站点列表卡补站点级菜单（设置 / 删除）+ 确认弹窗（复用 DeleteSiteButton/AlertDialog）
- [x] 1.4.2 验证：可从首屏删除当前站点，删除后正确跳转/刷新

---

## Sprint 2 — 首屏"逐条点亮"被理解（核心哇塞）

### 2.1 流式揭示
- [x] 2.1.1 OnboardingClient：把 audit SSE 事件（dna_extracted/done/competitors_inferred）渲染成有分量的逐条点亮（非 loading 文案）
- [x] 2.1.2 揭示顺序：① 业务理解（DNA）② 页数+健康分+问题 ③ 机会（异步/引导连 GSC）
- [x] 2.1.3 ①② 同步等待（接受 10–20s，点亮掩盖）；③ 完成后追加或引导

### 2.2 DNA 可靠性 + 降级
- [x] 2.2.1 实测 crawler DNA 提取产产质量 + 确认落库（修上次"全库 0 本体"）
- [x] 2.2.2 DNA 失败/空/低质 → 降级为"网站体检"（页数+健康分+问题），**绝不显示错误的业务理解**
- [x] 2.2.3 降级文案仍专业、双语

### 2.3 稳态首屏
- [x] 2.3.1 GrowthHome 首屏"被理解"卡复用 DNA/竞品/缺口；无数据时与降级一致
- [x] 2.3.2 验证（真机）：新域名 onboarding 全程逐条点亮；DNA 失败路径不空白/不乱说

### 2.4 坏页面作为审计发现（呈现层）
> 核心层已落地：HTTP 错误状态（4xx/5xx）不再触发熔断/中止审计，只有传输失败（超时/DNS/连接拒绝）才熔断（`crawler.service.ts` / `fetcher.ts`，`transport` 标志）。本节做"呈现"。
- [ ] 2.4.1 `crawlWithConcurrency` 收集 `{ url, status }` 坏页面清单，经 `performFullAuditWithProgress` 返回（扩展 `SiteAuditResult`，见代码 TODO）
- [ ] 2.4.2 save 路由把坏页面写入 `issueReport`（或独立字段）
- [ ] 2.4.3 审计结果 UI 展示"N 个页面返回错误"+ 可展开 URL/状态码清单（双语）
- [ ] 2.4.4 验证：含坏页面的站点审计完成，且坏页面在结果里作为可操作发现呈现

### 2.5 揭示屏重做："真实问题清单"证明我们看了你的站（design 决策 9–12）
> 数据已存在（`audit-analyzer.ts` 的 `IssueItem[]`）；这是呈现 + 语言 + 叙事升级。
- [ ] 2.5.1 语言修复：洞察(DNA/问题/竞品)跟 `User.locale`；en 用户审英文站必须全英文（修 prompt locale 真正生效 + LLM 不遵守时兜底/二次纠正）
- [ ] 2.5.2 指标卡 → 真实问题清单：每条 = 严重度图标 + 标题 + 受影响页数 + 怎么修；P0/P1 排前；颜色=严重度
- [ ] 2.5.3 具体到页面：用 `affectedUrls` 点名真实页面（"你的 /pricing 缺 meta description"）
- [ ] 2.5.4 渐进展开：默认 top 3–5，"查看全部 N 条"展开
- [ ] 2.5.5 修溢出 + token 化：指标/卡片正常字号换行，去掉等宽硬塞；brand-* + rounded-lg
- [ ] 2.5.6 诚实框定：顶部 "Preliminary scan · 已扫 X/N 页"（双语）
- [ ] 2.5.7 空态转行动：竞品空 → "添加竞品看缺口"输入；无 GSC → "连接 GSC 看真实排名"
- [ ] 2.5.8 叙事主线：懂你 → 你的网站卡在哪 → 机会 → [解锁]（非三等价盒子，有开场句）
- [ ] 2.5.9 GEO 露出：揭示屏至少 1 条 GEO-readiness 发现（头条优先用「AI 爬虫准入」）。**依赖 `geo-readiness-audit` change**——该维度就绪则消费其 GEO issue/geoScore；未就绪则优雅降级（不显示 GEO 条，不阻塞首屏）
- [ ] 2.5.10 验证（真机）：en 审 scaletotop 全英文；问题清单具体到页;空竞品给行动入口;无溢出

---

## Sprint 3 — 侧边栏 IA + 视觉归一

### 3.1 侧边抽屉导航
- [x] 3.1.1 DashboardShell/TopNav → 侧边抽屉：主导航 = 诊断 / 生产 / 衡量（+ 站点选择 + 设置）
- [x] 3.1.2 桌面常驻、移动端折叠抽屉；当前站点上下文置顶
- [x] 3.1.3 底部/顶部用户区预留：语言切换 · 积分 · 头像
- [x] 3.1.4 全 token 化（brand-*）、rounded-lg、hover:shadow-md；过设计检查

### 3.2 auth 页视觉归一
- [x] 3.2.1 login 页移除 brutalist 残留（`shadow-[8px_8px_0_0_rgba(10,10,10,1)]`、`border-brutalist`、grid-bg/blur 装饰）
- [x] 3.2.2 改 brand-* + rounded-lg + 干净卡片，与 dashboard 视觉一致

### 3.3 边做边双语
- [x] 3.3.1 重写的 shell/auth/首屏组件字符串同步抽 `messages/{en,zh}.json` `dashboard.*`，过 check:cjk

---

## Sprint 4 — 双语收尾 + 切换器

### 4.1 语言切换器
- [x] 4.1.1 切换器组件（侧边栏/用户区）：`authClient.updateUser({ locale })` → `router.refresh()` 即时重渲染
- [x] 4.1.2 验证：切换即时生效并写回 User.locale；刷新后保持

### 4.2 双语收尾
- [x] 4.2.1 dashboard 剩余用户侧 UI 字符串双语化（admin 保持中文，不动）
- [x] 4.2.2 en/zh key 对齐校验；过 check:cjk

---

## 交付验收（design「验收基准」全项）
- [x] V1 登录+浏览 10+ 页无 429；新用户 Google 登录回跳成功（真机）
- [x] V2 设密码零二次码可跳过（或已砍为 OTP-only）；OTP 流完整（真机）
- [x] V3 站点可从首屏/列表删除（带确认）
- [x] V4 新域名 onboarding 逐条点亮；DNA 失败降级为网站体检而非空白/错误
- [x] V5 侧边栏诊断/生产/衡量主导航；auth 页无 brutalist 残留
- [x] V6 语言切换器即时生效 + 写回；admin 中文、用户侧双语
- [x] V7 `tsc` + `build` + `check:cjk` 通过

---

## 已知偏差 / 推迟
- 真·AI 引用测量、agent autoExecute、内容分发层、pgvector 站点画像 —— 后续独立 change
- 公共页全静态化（移 `<html>` 出 root）—— 当前数据层缓存已够快，暂不做
