# Dashboard 英文化 — 设计决策

## 决策 1：locale 来源 = User.locale，不进 URL

`(protected)` 不加 `[locale]` 段。dashboard 是登录态产品，语言是用户属性不是页面属性：

```
登录 → session 携带 User.locale
  → (protected)/dashboard/layout.tsx 读取
  → NextIntlClientProvider locale={user.locale} messages={...}
  → 设置页切换 locale → 更新 User.locale → router.refresh()
```

- 与公开站的衔接：访客在 `/`（en）注册 → `User.locale = 'en'` → 进 dashboard 自动英文，全程语言一致
- messages 文件复用 `site-i18n-bilingual` 的 `messages/{en,zh}.json`，新增 `dashboard.*` 命名空间（文件过大时拆 `messages/dashboard.{en,zh}.json` 按需加载）

## 决策 2：AI 输出语言 — outputLocale 贯穿 skill 执行链

冰山的解法分两类，处理方式不同：

| 类型 | 例子 | 解法 |
|------|------|------|
| **静态标签/枚举** | 审计维度名、评级文案（"优秀/待改进"）、图表轴标签 | 后端只输出稳定 key（`tech_seo` / `grade_a`），前端经 messages 渲染——**数据与语言解耦，历史数据自动多语言** |
| **AI 生成文本** | 审计摘要、改进建议、策略描述 | skill 执行上下文增加 `outputLocale`，prompt 模板按 locale 注入输出语言指令 |

```typescript
// base-skill 执行上下文
interface SkillContext {
  // ...现有
  outputLocale?: 'zh' | 'en'   // 默认取 User.locale
}
```

- 优先做"静态标签 key 化"——一次性把 analyzer 输出里的中文标签改成 key，是收益最大的一刀（历史报告也能正确渲染）
- AI 生成文本按 locale 出双语 prompt 指令；**英文输出质量需抽查**（用 content-scorecard 的语言质量维度抽 2-3 份报告人工校验）

## 决策 3：Phase 切分以"英文漏斗关键路径"为界

```
Phase 1（与 homepage-plg 同期，~4 天）        Phase 2（可后置，~3 天）
─────────────────────────────────          ─────────────────────
注册后跳转 / onboarding                      library（文章库/编辑）
instant-audit 运行页 + 报告页                 tools 列表页
site-intelligence 列表 + [siteId] 核心视图    billing / settings 全量
TopNav / 侧边导航 / 通用组件(Button等共享件)    策略看板 / 语义分析 AI 输出
instant-audit 的 AI 输出（摘要/建议）          geo-writer 界面文案
                                            CJK 残留扫描脚本进 CI
```

判断标准：英文用户从 hero 进来 90 秒动线上会看到的每一个屏 = Phase 1；其他 = Phase 2。Phase 2 的触发条件可以是数据驱动（PostHog 出现首批 locale=en 的真实活跃用户）。

## 决策 4：中文残留防线

- Phase 1 验收用人工走查（关键路径屏数有限）
- Phase 2 加脚本：`scripts/check-cjk.ts` 扫描指定目录的 JSX 字符串字面量中的 CJK 字符（排除 admin 与注释），进 `npm run lint` 流程——防止后续开发回归出中文

## 风险

- **messages 体积**：dashboard 字符串量大（~600 处），单文件会膨胀 → 按命名空间拆文件按需加载
- **AI 英文输出质量未知**：与 geo-writer 同源问题，靠 scorecard 抽查兜底；发现系统性问题归因到具体 prompt 单独修
- **共享组件双边影响**：23 个含中文的共享组件部分被 admin/public 复用，改动需回归两侧

## 验收基准

- 英文新用户从 `/` hero → 注册 → onboarding → 审计报告全程无中文（截屏走查）
- `User.locale` 在设置页切换后 dashboard 即时切换语言
- instant-audit 报告：英文用户得到英文摘要与建议；同一报告数据用中文账号查看时静态标签正确显示中文（key 化验证）
- 中文用户全流程无回归
- Phase 2 完成后：`scripts/check-cjk.ts` 对用户侧 dashboard 目录零报警
