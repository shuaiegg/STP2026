# Skills System

## 概述

Skills 是平台的 AI 工具执行引擎。每个 Skill 封装一个具体的 AI 任务（内容生成、SEO 审计、关键词分析等），通过统一的 API 路由执行，并与计费系统深度集成。

---

## 三层架构

```
代码层                           注册层                        数据库层
src/lib/skills/skills/          SkillRegistry (singleton)     SkillConfig 表
──────────────────────          ─────────────────────────     ──────────────
BaseSkill 抽象类                  运行时 Map<name, ISkill>       name
  ↓ 继承                          registerFactory()             displayName
具体 Skill 类                     getSkill(name)                cost（积分）
  ↓ 使用                                                        isActive（开关）
providers/
  GeminiProvider
  ClaudeProvider
  DeepseekProvider
```

| 层 | 控制什么 | 谁操作 |
|---|---|---|
| **代码层** | Skill 的实际逻辑（prompt、调用哪个 AI、解析输出） | 开发者修改代码 |
| **注册层** | 运行时能找到哪些 Skill | 开发者在 `skills/index.ts` 中注册 |
| **数据库层** | 积分定价和启用/禁用开关，不影响逻辑 | Admin UI `/dashboard/admin/skills` 随时调整 |

**关键规则：三层缺一不可。** 只有代码没有注册 → API 找不到 Skill。只有注册没有数据库记录 → `chargeUser()` 报错 "configuration not found"。

---

## 文件结构

```
src/lib/skills/
├── types.ts                   # 所有类型定义（SkillInput, SkillOutput, ISkill 等）
├── base-skill.ts              # 抽象基类，提供 execute()、validateInput()、generateWithAI() 等
├── skill-registry.ts          # 单例注册表，registerFactory() / getSkill()
├── index.ts                   # 导出 getSkillRegistry()
├── skills/
│   ├── index.ts               # registerAllSkills() — 所有 Skill 在此注册
│   ├── stellar-writer.ts      # StellarWriter Skill 实现
│   └── stellar/               # StellarWriter 的子模块
└── providers/
    ├── base-provider.ts
    ├── gemini-provider.ts
    ├── claude-provider.ts
    ├── deepseek-provider.ts
    └── vps-provider.ts
```

---

## 执行路径

### 标准 AI Skill（经由 SkillRegistry）

```
前端 fetch('/api/skills/execute', { skillName, input })
  ↓
src/app/api/skills/execute/route.ts
  ↓ 1. 鉴权（better-auth session）
  ↓ 2. getSkillRegistry().getSkill(skillName)  — 找代码
  ↓ 3. chargeUser(userId, skillName, ...)       — 查 SkillConfig 扣积分
  ↓ 4. skill.execute(input)                    — 执行逻辑
  ↓ 5. 记录 SkillExecution + CreditTransaction
  ↓ 6. captureServerEvent('skill_executed')    — PostHog 追踪
返回 { success, output, remainingCredits }
```

### 站点审计（独立路由，不经由 SkillRegistry）

```
OnboardingClient / instant-audit
  ↓
src/app/api/dashboard/site-intelligence/audit/route.ts
  ↓ chargeUser(userId, 'SITE_AUDIT_BASIC', ...)   — 直接查 SkillConfig
  ↓ CrawlerService.performFullAuditWithProgress()  — SSE 流式返回
  ↓ 审计失败时 refundUser(userId, 'SITE_AUDIT_BASIC', ...)
```

> 站点审计没有走 SkillRegistry，是独立实现的 SSE 流式接口，只借用 `chargeUser()` 计费。

---

## 当前已注册的 Skills

| 代码 name（Registry key） | SkillConfig name（计费 key） | 积分成本 | 说明 |
|---|---|---|---|
| `stellar-writer` | `GEO_WRITER_FULL` | 15 | AI 深度内容生成 |
| `stellar-writer`（audit mode） | `GEO_WRITER_AUDIT` | 5 | 仅 SERP + 关键词分析 |
| —（独立路由）| `SITE_AUDIT_BASIC` | 5 | 站点 SEO 全站扫描 |

> ⚠️ 注意：代码中的 `skill.name`（Registry key）与数据库中的 `SkillConfig.name`（计费 key）**可以不同**。
> StellarWriter 在代码里叫 `stellar-writer`，但计费时根据参数区分用 `GEO_WRITER_FULL` 或 `GEO_WRITER_AUDIT`。

---

## 新增一个 Skill 的完整流程

### Step 1 — 创建 Skill 类

```ts
// src/lib/skills/skills/keyword-analyzer.ts
import { BaseSkill } from '../base-skill';
import { GeminiProvider } from '../providers/gemini-provider';
import { SkillInput } from '../types';

export class KeywordAnalyzerSkill extends BaseSkill {
    name = 'keyword-analyzer';
    description = '关键词竞争度与搜索意图分析';
    version = '1.0.0';
    category = 'seo' as const;
    protected preferredProvider = 'gemini' as const;

    protected getRequiredInputs(): string[] {
        return ['keywords'];  // validateInput() 自动校验
    }

    protected async executeInternal(input: SkillInput) {
        const provider = new GeminiProvider();
        const { response } = await this.generateWithAI(provider, `
            分析以下关键词的搜索意图和竞争度：${input.keywords.join(', ')}
            返回 JSON 格式：{ keyword, intent, difficulty, suggestions[] }
        `);
        return {
            data: this.extractJSON(response.content),
            metadata: {
                modelUsed: response.model,
                provider: 'gemini',
                tokensUsed: response.outputTokens,
            },
        };
    }
}
```

**BaseSkill 提供的工具方法：**

| 方法 | 用途 |
|---|---|
| `generateWithAI(provider, prompt, options?)` | 调用 AI，返回 `{ response, cost }` |
| `extractJSON<T>(content)` | 从 AI 输出中解析 JSON（支持 ````json` 代码块） |
| `buildPrompt(system, user, context?)` | 结构化拼接 prompt |
| `cleanText(text)` | 清理多余空行和尾部空格 |
| `validateInput(input)` | 自动根据 `getRequiredInputs()` 校验，可 override |

### Step 2 — 在注册表中注册

```ts
// src/lib/skills/skills/index.ts
import { KeywordAnalyzerSkill } from './keyword-analyzer';

export function registerAllSkills(): void {
    const registry = getSkillRegistry();
    registry.registerFactory('stellar-writer', () => new StellarWriterSkill());
    registry.registerFactory('keyword-analyzer', () => new KeywordAnalyzerSkill()); // 加这行
}
```

### Step 3 — 在数据库中添加 SkillConfig

访问 `/dashboard/admin/skills`，点击 **+ Add New Skill**：

| 字段 | 填写示例 | 说明 |
|---|---|---|
| Display Name | `关键词分析` | 界面展示名 |
| System Name | `KEYWORD_ANALYZER` | 计费 key，大写下划线，全局唯一 |
| Cost | `3` | 每次执行扣除积分数 |
| Description | `分析关键词竞争度与搜索意图` | 说明文字 |

或直接用 Prisma 脚本（添加到 `prisma/seed.ts`）：

```ts
await prisma.skillConfig.upsert({
    where: { name: 'KEYWORD_ANALYZER' },
    update: {},
    create: {
        name: 'KEYWORD_ANALYZER',
        displayName: '关键词分析',
        description: '分析关键词竞争度与搜索意图',
        cost: 3,
        isActive: true,
    },
});
```

### Step 4 — 调用

```ts
// 前端任何位置
const res = await fetch('/api/skills/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        skillName: 'keyword-analyzer',   // 对应 skill.name（Registry key）
        input: { keywords: ['SEO工具', '出海营销'] },
    }),
});
const { success, output, remainingCredits } = await res.json();
```

---

## Admin 管理

路径：`/dashboard/admin/skills`（需要 ADMIN 角色）

功能：
- 查看所有 SkillConfig 记录
- **行内编辑**积分成本（即时生效，影响所有后续执行）
- **一键开关**（禁用后 API 返回 402，用户看到"工具暂时不可用"）
- **新增** SkillConfig 记录

> ⚠️ 修改 Admin UI 里的定价只影响**计费**，不影响代码逻辑。如需修改 AI prompt 或更换模型，仍需改代码。

---

## ADMIN 用户计费豁免

`chargeUser()` 检测到 `user.role === 'ADMIN'` 时，直接返回 `{ success: true }` 并**跳过积分扣减**，方便内部测试。

---

## 相关文件速查

| 需求 | 找这里 |
|---|---|
| 修改 Skill 的 AI prompt / 逻辑 | `src/lib/skills/skills/<skill-name>.ts` |
| 新增或修改 AI Provider | `src/lib/skills/providers/` |
| 修改积分定价 / 开关 | Admin UI 或数据库 `SkillConfig` 表 |
| 查看执行记录 | 数据库 `SkillExecution` 表 |
| 计费核心逻辑 | `src/lib/billing/credits.ts` |
| API 执行入口 | `src/app/api/skills/execute/route.ts` |
| 注册所有 Skills | `src/lib/skills/skills/index.ts` |
