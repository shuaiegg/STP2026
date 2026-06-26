## 1. 数据层（home.ts）

- [x] 1.1 蓝图数据聚合：读 idealTopicMap（支柱）+ 对应 SemanticDebt（coverageScore/proofDensity/gscImpressions/relevance）+ ontology.logicChains，组装成支柱列表
- [x] 1.2 计算"内容权益"：已覆盖支柱数 / 总支柱数 + 本月增量（基于已发布 / coverageScore 阈值）
- [x] 1.3 加冕"最快下一步"：需求高 × 覆盖低 排序取 top1（MVP 不含难度）
- [x] 1.4 阶段感知标志：stage 0/unmeasured → 蓝图为主；否则为常驻区
- [x] ~~难度列~~ → 砍出 MVP，进 backlog（无可靠数据源）

## 2. 蓝图组件

- [x] 2.1 资产负债表式面板：支柱行 + 覆盖×证据双轴条 + 需求/难度衡量列
- [x] 2.2 加冕卡："最快下一步" + 单一 CTA（写作 / 一键生成计划）
- [x] 2.3 每支柱"为什么重要"：**主用 `SemanticDebt.relevance`**（logicChains 仅站点级补充，不做 per-pillar 匹配）；渐进展开子话题
- [x] 2.4 "补证据"动作（证据密度低、覆盖已有的支柱）
- [x] 2.5 领先指标头部 + 期望管理首屏文案
- [x] 2.6 空状态：引导先确认业务基因 / 跑审计（衔接 P-DNA）

## 3. 装配与衔接

- [x] 3.1 接入 GrowthHome，按阶段决定主角/常驻位
- [x] 3.2 "一键生成计划" CTA 调用现有 `strategy/generate` → 生成 ContentPlan → 跳/提示策略板
- [x] 3.3 写作 CTA 深链 geo-writer 并预选该站点（与 business-dna-into-content 的站点选择器衔接）

## 4. Design Compliance（UI 任务）

- [x] 4.1 颜色全用 brand token（覆盖/证据条、加冕卡等，无硬编码 hex / ad-hoc 色）
- [x] 4.2 无已移除工具类；交互元素 rounded-lg；卡片 hover:shadow-md
- [x] 4.3 用户可见文案入 const COPY / i18n；"您"敬语
- [x] 4.4 双轴条/标签 color 不作唯一状态指示（配图标/文字）；对比度 WCAG AA
- [x] 4.5 对修改文件跑 `/web-design-guidelines` 并修复

## 5. 验证

- [x] 5.1 stage 0/unmeasured 蓝图为主角，支柱/覆盖/证据/需求正确，加冕一个下一步（真机通过）
- [ ] 5.2 有 GSC 数据退常驻区：设计正确但本站观察不到（scaletotop 展示量 ~5 < 100，仍 stage 0/主角）；待有 stage≥1 站点复验
- [x] 5.3 "一键生成计划" → ContentPlan 生成、策略板可见（真机通过，需先修 no-store 见 6.3）
- [x] 5.4 "为什么重要" 取自 relevance；证据轴反映 proofDensity（真机通过）
- [x] 5.5 难度列已砍；空状态引导正确（真机通过）

## 6. 真机验证修复（2026-06-26）

- [x] 6.1 home.ts 强项假设回退：原"无 debt=100%强项"会因 join 失配把缺口误显为"已建立"（藏缺口）→ 改安全失败（无匹配=未覆盖）+ 归一化匹配（trim/lowercase）
- [x] 6.2 `strategy/generate` 改 `resolveModelForContext('content_strategy')` + 多 provider 兜底（抗 Gemini 429）；admin `/admin/models` 新增 "内容策略生成" 上下文
- [x] 6.3 GET `/strategy` 由 `max-age=60` 改 `no-store`（否则生成计划后浏览器返回缓存空响应 → 策略板空白）
- [x] 6.4 蓝图新增 "基于您的业务基因 · 编辑 →" 链接（确认后随时回 #overview 改 DNA）
- [x] 6.5 StrategyBoard 列号由 `plan.priority+1` 改 `displayIndex+1`（避免接着归档计划计数显示 "PILLAR 2"）
