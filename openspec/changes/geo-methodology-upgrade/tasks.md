## 1. GEO 评分重做(Princeton 口径)

- [ ] 1.1 `calculateGEOScore` 改测:引用/来源密度、带来源统计密度、专家引述、结构化答块(直答/表格/FAQ/定义块)+ 关键词堆砌扣分
- [ ] 1.2 保留可解释 issues/suggestions;实体信号降为辅助
- [ ] 1.3 同步 `StellarEnricher` 调用;结果 UI 的 GEO 拆解改显新因子
- [ ] 1.4 重设 GEO 达标阈值,回归旧内容不误判

## 2. 写手 prompt 强制 Princeton 前 3(诚实)

- [ ] 2.1 `StrategyComposer`/`ExecutionAgent` 加指令:论断挂真实来源 + 用研究真实统计(数字+来源+日期)+ 有据时专家引述 + 反堆砌
- [ ] 2.2 把研究阶段真实统计/来源作为上下文喂给生成
- [ ] 2.3 诚实红线:无可靠数据不硬造(与 sanitizeProof 一致)

## 3. fan-out 覆盖

- [ ] 3.1 生成前收集 fan-out 子问题集(已抓 PAA + LLM 补全,5-8 个)
- [ ] 3.2 大纲/FAQ 确保覆盖(复用 PAA→FAQ 管道,扩为 fan-out 全集),限量防冗长

## 4. 对比格式

- [ ] 4.1 判定对比意图(isComparison / 关键词含 vs/best/alternative/对比/替代)
- [ ] 4.2 命中 → 对比模板(对比表 + 逐维度直答,客观中立)

## 5. 集群连接(复用)

- [ ] 5.1 确保写手 prompt 感知"所属支柱";复用已建双模内链(真实内链 + 集群建议),不新建

## 6. scorecard 对齐 + 验证

- [ ] 6.1 `rules/content-scorecard.md` 的 GEO 维度口径对齐 Princeton
- [ ] 6.2 `npx tsc --noEmit` 仅剩 1 预存 auth.ts 错误,零新增
- [ ] 6.3 用 content-scorecard 抽样几篇:引用/统计/引述/结构提分;堆砌扣分
- [ ] 6.4 诚实回归:无数据话题不出现编造统计(sanitizeProof 后不空洞)
- [ ] 6.5 fan-out 覆盖生效但不过度拉长;对比格式只对对比话题
- [ ] 6.6 更新 backlog:勾本期;保留 deferred(AI 引用缺口检测/站点级 GEO 文件/双向互链/freshness)
