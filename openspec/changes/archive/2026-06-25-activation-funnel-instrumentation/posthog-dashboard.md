# PostHog 激活漏斗 & 留存视图配置说明

## 漏斗事件口径

按顺序排列的完整激活漏斗（共 6 个步骤）：

| 步骤 | 事件名 | 关键属性 | 触发位置 |
|------|--------|----------|----------|
| 1 | `signup` | — | better-auth 注册完成（PostHog 自动采集 / 注册页） |
| 2 | `onboarding_completed` | `days_since_signup`, `has_dna`, `competitors_count` | `OnboardingClient.tsx` handleFinalConfirm |
| 3 | `first_coach_moment_viewed` | `stage`, `move_count` | `GrowthHome.tsx` useEffect |
| 4 | `first_action_started` | `move_type`, `stage` | `GrowthHome.tsx` handleStart |
| 5 | `first_meaningful_action_completed` | `action_type`, `days_since_signup`, `credits_spent` | skills execute route / content.ts publish |
| 6 | `dashboard_returned` | `days_since_signup`, `is_return`, `landing_surface` | `dashboard/page.tsx` server component |

---

## 在 PostHog 配置激活漏斗

### 步骤

1. 进入 **Insights** → **New Insight** → 选择 **Funnel**
2. 按上表顺序依次 **Add step**，选择对应事件名
3. 漏斗转化窗口建议设为 **7 days**（激活定义：注册后 7 天内完成有意义动作）
4. **Conversion goal**（激活定义）设为步骤 5 `first_meaningful_action_completed`
5. 保存为 Insight，命名：**"激活漏斗 v1"**

### 推荐过滤条件

- 可按 `action_type = 'generated'` vs `'published'` 分组对比两条路径
- 可按 `days_since_signup <= 1` 筛选首日激活用户

---

## 在 PostHog 配置 D1/D7 Retention 视图

### D1 留存（次日回访率）

1. 进入 **Insights** → **New Insight** → 选择 **Retention**
2. **Initial action**（起始事件）：`first_meaningful_action_completed`（激活定义）
3. **Retention action**（留存事件）：`dashboard_returned`（带 `is_return=true`）
4. **Retention period**：Daily
5. 保存为 Insight，命名：**"激活后留存 D1/D7"**

### D7 留存

- 同上设置，修改视图窗口为 **14 days** 以观察 D7 数据点

---

## 核心指标定义

| 指标 | 定义 | 数据来源 |
|------|------|----------|
| **激活率** | 注册用户中，完成 `first_meaningful_action_completed` 的比例 | 漏斗视图步骤 1→5 |
| **D1 留存率** | 激活用户中，次日回访 `/dashboard` 的比例 | Retention 视图 |
| **D7 留存率** | 激活用户中，7 天内至少回访一次的比例 | Retention 视图 |
| **生成 vs 发布激活比** | `action_type='generated'` vs `'published'` 分布 | 漏斗步骤 5 分组 |

---

## 基线建立

配置完成后，首周数据为基线。后续 P1（数据管道修复）和 P2（DNA→写作）改完后，
对比基线数值判断是否真正提升了激活率与留存率。

建议保存当前截图作为 t=0 基线。
