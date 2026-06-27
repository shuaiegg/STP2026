## 1. 盘点（确保不漏）

- [x] 1.1 全仓搜 `citation|引用追踪|AI 引用|被引|cited|CITED` 的**用户可见**用法，列出需改清单（区分"宣称追踪"=改 / "GEO 质量建议·提升被引概率"=保留）

## 2. i18n 文案诚实化

- [x] 2.1 `messages/en.json`：移除 "across … and AI response engines in real-time" 等；"citation tracking" / "GEO citation tracking" → "search visibility / ranking tracking"
- [x] 2.2 `messages/zh.json`：同步对应中文（"AI 引用追踪" → "搜索可见度/收录排名追踪"）
- [x] 2.3 library 状态文案 `statusCited / statusNotCited` → "已收录·已排名" / "未收录"（enum 值不动）

## 3. 公开页 + 工具页

- [x] 3.1 首页 citation-tracker 区块文案 + 图 `alt` 改为"搜索可见度/排名追踪"
- [x] 3.2 geo-writer "前往控制台追踪引用" → "追踪收录/排名"

## 4. 保留项确认（别误删真能力）

- [x] 4.1 确认保留：GEO 优化定位、审计"AI 可引用度/GEO 就绪度"、"提升被引概率"的内容质量建议、`proofDensity` 证据轴

## 5. Design Compliance / 验证

- [x] 5.1 改动文案均走 i18n（zh/en 一致）；公开页用 i18n Link 不受影响
- [x] 5.2 全站再搜一遍，确认无"实时监测 AI 引用/AI citation tracking"类**宣称追踪**的残留
- [x] 5.3 人工过一遍首页 / library / geo-writer，措辞诚实、不误导
