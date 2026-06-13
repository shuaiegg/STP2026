# 双语上线 — 手动操作清单（site-i18n-bilingual）

> 代码部分（Sprint 1-3）已完成并提交。本清单是**只能由你手动执行/验证**的事项，每项含「操作」和「检查点」。
> 状态图例：⬜ 待办 · ✅ 完成 · ⚠️ 需注意
>
> 最后更新：2026-06-13

---

## A. 上线前（部署前必须完成）

### A1. ⬜ systeme.io 后台预建 `_en` 标签

**为什么**：英文用户注册/咨询时，代码会尝试打 `{基础标签}_en` 后缀标签（如 `registered_en`）。systeme.io API **不会自动创建标签**（已知坑），标签必须先在后台手工建好，否则打标签静默失败。

**操作**：
1. 登录 systeme.io → Contacts → Tags
2. 找出当前所有触发标签的中文/基础名（在本项目 `/dashboard/admin/integrations` 页可看到已配置的标签名：`SYSTEME_TAG_ON_REGISTER` / `_ONBOARDING` / `_PURCHASE` / `_CREDITS_LOW` / `_CONSULTATION` 对应的标签）
3. 为每个标签创建一个 `_en` 后缀的对应英文标签。例如基础标签叫 `stp-register`，就新建 `stp-register_en`

**检查点**：
- [ ] 5 个触发场景对应的 `_en` 标签都已在 systeme.io 后台存在
- [ ] 标签名与代码拼接规则一致（基础名 + `_en`，无空格/大小写差异）

---

### A2. ⬜ 隐私政策页补充 Cookie/分析说明（任务 3.2.3）

**为什么**：上了 Cookie 同意横幅（PostHog/GTM 改为同意后才启动），但隐私政策正文还没说明"我们用哪些 cookie、PostHog/GTM 做什么、如何拒绝"。英文站主动服务英国/欧盟访客，GDPR 要求这段说明。

**操作**：这是文案任务，可由我代写中英双语段落补进 `[locale]/(public)/privacy/page.tsx`。需要你确认：是否同意我来补这段（约一屏，说明 PostHog 匿名分析 + GTM + cookie 同意机制）。

**检查点**：
- [ ] privacy 页中英版本都有 cookie/分析说明段落
- [ ] 提到用户可通过同意横幅拒绝非必要 cookie

---

## B. 部署时

### B1. ⬜ 确认生产环境变量

**操作**：在 Coolify（或部署平台）确认以下变量已设置且正确：
- `NEXT_PUBLIC_APP_URL` = `https://www.scaletotop.com`（影响 canonical/hreflang/sitemap/og 的绝对 URL）

**检查点**：
- [ ] `NEXT_PUBLIC_APP_URL` 指向生产域名（不是 localhost / 预览域名）

---

### B2. ⬜ Coolify 补 Google OAuth 凭证（飞轮断点 ⑥→①）

**为什么**：生产环境缺 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`，GSC 连接会报 invalid_request，站点情报的关键词数据回不来。**这条与 i18n 无关，但拖了很久、5 分钟可清。**

**操作**：
1. Google Cloud Console → 该项目 OAuth 凭证，复制 Client ID / Secret
2. Coolify 环境变量添加 `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
3. 核对 `GOOGLE_REDIRECT_URI` 指向生产回调地址，且该地址在 Google Console 的 redirect URI 白名单内
4. 重新部署使变量生效

**检查点**：
- [ ] scaletotop.com 在 `/dashboard/site-intelligence` 能完成 GSC 连接（不报 invalid_request）
- [ ] 连接后能看到关键词数据回流

---

## C. 部署后线上验收

### C1. ⬜ 双语基础渲染（任务 3.4.1 / 3.4.3）

**操作**：浏览器分别访问以下 URL。

**检查点**：
- [ ] `https://www.scaletotop.com/` → 英文首页，页面源码 `<html lang="en">`
- [ ] `https://www.scaletotop.com/zh` → 中文首页，`<html lang="zh-Hans">`
- [ ] `/en/pricing` → 308 跳转到 `/pricing`（en 不应带前缀）
- [ ] `/zh/pricing` → 200 中文定价页
- [ ] 旧中文链接（如有人发过的 `/pricing`）现在落到英文版 —— 由语言建议横幅接住，不报错
- [ ] 中文老用户全流程（注册/登录/咨询/博客）在 `/zh/` 下无回归

---

### C2. ⬜ 语言建议横幅（任务 3.4 验收）

**操作**：用浏览器语言模拟测试（可在浏览器设置切换首选语言，或用 `curl -H "Accept-Language: zh-CN"`）。

**检查点**：
- [ ] 中文浏览器访问英文页（`/`）→ 顶部出现"看起来您偏好中文 — 要切换到中文版吗？"横幅
- [ ] 英文浏览器访问中文页（`/zh`）→ 出现 "Switch to English?" 横幅
- [ ] 点击切换 → 跳到对应语言版本，且之后刷新不再弹横幅（cookie 记忆生效）
- [ ] 点"继续用当前语言"关闭 → 之后不再弹

---

### C3. ⬜ Cookie 同意门控 PostHog/GTM（任务 3.2.4）

**操作**：用浏览器开发者工具 Network 面板，无痕窗口打开站点。

**检查点**：
- [ ] **同意前**：Network 面板**没有** PostHog（`*.posthog.com`）和 GTM（`googletagmanager.com`）请求
- [ ] 点击"接受"后：PostHog/GTM 请求开始出现，事件正常上报
- [ ] 点击"拒绝"后：保持无追踪请求

---

### C4. ⬜ 英文新用户全流程（任务 3.4.2）

**操作**：用一个全新英文邮箱，在英文站（`/`）走完注册。

**检查点**：
- [ ] 注册成功后，`User.locale` = `en`（可在 `/dashboard/admin/users` 查看）
- [ ] 收到的 welcome 邮件是**英文版**
- [ ] systeme.io 后台该联系人打上了 `_en` 后缀标签（依赖 A1 已建好标签）
- [ ] PostHog 该用户的 person property 含 `locale: en`，事件带 locale 属性

---

### C5. ⬜ 英文测试文章 + hreflang（任务 2.4.1-2.4.3）

**为什么**：`Content.locale` 整套机制还没用真实数据验证过。

**操作**：
1. 发布一篇英文测试文章（可等 content-flywheel 通了用 geo-writer 生成，一石二鸟；或手动在 admin 建一篇 `locale=en` 的）
2. 可选：再建一篇中文文章，与英文文章配成翻译对（设同一 `translationGroupId`）

**检查点**：
- [ ] 英文文章只出现在 `/blog`，**不**出现在 `/zh/blog`
- [ ] 中文 sitemap（`/sitemap.xml` 中 `/zh/` 项）不含该英文文章
- [ ] 配对的两篇文章互相输出 hreflang（用 [technicalseo.com hreflang tester](https://technicalseo.com/tools/hreflang/) 或 Screaming Frog 检查）
- [ ] 解除配对后 hreflang 消失
- [ ] 用 [Google Rich Results Test](https://search.google.com/test/rich-results) 验证文章页 BlogPosting 结构数据含 `inLanguage`

---

### C6. ⬜ GSC 提交新 sitemap + 收录基线（任务 3.4.4）

**操作**：
1. Google Search Console → Sitemaps → 提交 `https://www.scaletotop.com/sitemap.xml`
2. 记录当前收录页数作为基线

**检查点**：
- [ ] sitemap 提交成功、无解析错误
- [ ] sitemap 中 en 页在根路径、zh 页带 `/zh` 前缀、各页有 `alternates.languages`
- [ ] 记下提交日期与基线收录数（用于后续监控收录交接）

---

## D. 调研结论（已完成，供决策）

### D1. ✅ Creem 是否 Merchant of Record（任务 3.3）

**结论：是。Creem 是 Merchant of Record。**

- Creem 作为法律意义上的卖家（出现在客户银行账单和发票上），自动按客户所在地计算并代收 VAT/GST/销售税，并向 **190+ 国家**的税务机关代为申报缴纳，覆盖 **EU（经 Estonia OSS）、UK、美国 28+ 州、韩国**。
- 作为使用 Creem 的开发者（卖家），**你无需自行注册、收取或申报 VAT/销售税**。
- 费率：3.9% + $0.40 / 笔，无月费。

**对项目的影响（输出给 `homepage-plg-repositioning` 任务 3.3.2）**：
- ✅ **英文定价页可以直接挂购买按钮**，按 USD 展示，无需因税务问题暂缓英文付费墙。
- 现有 `/api/webhooks/creem` 流程对英文用户同样适用。
- ⚠️ 上线英文收款前仍建议：在 Creem 后台确认账户已开通对应区域、发票抬头/公司信息填写正确。

**来源**：
- [What is a Merchant of Record — Creem Docs](https://docs.creem.io/merchant-of-record/what-is)
- [Creem Pricing](https://www.creem.io/pricing)
- [Best Merchant of Record for SaaS 2026 — Creem](https://www.creem.io/blog/best-merchant-of-record-saas-2026)

---

## 汇总：阻塞英文站正式对外的最小集合

按依赖排序，以下做完即可让英文漏斗完整对外：

1. **A1**（systeme.io `_en` 标签）— 否则英文用户营销标签静默丢失
2. **A2**（隐私政策）— GDPR 合规，服务欧盟/英国访客前应到位
3. **B1 + B2**（环境变量）— 部署正确性 + GSC 数据
4. **C1-C4**（线上验收）— 确认无回归、合规生效
5. C5/C6 可在有真实英文内容后补做（不阻塞机制上线）
