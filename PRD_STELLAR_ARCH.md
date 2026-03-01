# PRD: StellarWriter 2026 Core Architecture Evolution

**Version:** 1.0 (Refactor Phase)  
**Status:** Draft / For Review  
**Persona Alignment:** Product Manager + Architecture Designer  

---

## 1. 业务愿景 (The Vision)
将 StellarWriter 从一个“AI 写作工具”进化为 **“全自动增长引擎的核心 (Growth Engine Core)”**。不再只是输出文字，而是输出具备“商业杀伤力”和“可自动发布”的营销资产。

## 2. 核心痛点分析 (JTBD - Jobs To Be Done)
| 用户任务 (Job) | 现有阻碍 (Pain Points) | 进化方向 |
| :--- | :--- | :--- |
| **获取精准询盘** | 生成内容过于通用，缺乏企业特定产品参数。 | **实体绑定 (Entity Injection)**：强制注入私有产品知识库。 |
| **降低操作成本** | 拿到 Markdown 后还需手动配图和上传。 | **流式全自动 (Auto-Pilot)**：集成图片自动配给与 CMS 自动同步。 |
| **确保投资回报** | 无法预知文章是否真的有 SEO 潜力。 | **数据前置 (Data-First)**：生成前强制执行 SERP 深度竞品逆向工程。 |

---

## 3. 技术架构重构 (The "collaborative" Architecture)
遵循 `clean-code` 与 `architecture-designer` 规范，将 800 行的 God Function 拆解为：

### A. 智能搜集层 (The Intelligence Engine)
*   **职责**：负责 DataForSEO 的所有通讯。
*   **输出**：标准化的 `IntelligenceContext`（包含关键词热度、竞争对手骨架、LSI 词库）。
*   **特性**：内置 API 错误重试与缓存逻辑。

### B. 策略建模层 (The Strategy Composer)
*   **职责**：将原始数据转化为 AI 指令。
*   **逻辑**：根据不同的 `ResearchMode`（Discovery/Deep/Audit）动态组装 System Prompt。
*   **特性**：支持 `AdvancedContext`（品牌调性、特定产品参数）。

### C. 极速生成层 (The Execution Agent)
*   **职责**：处理与 DeepSeek/Gemini 的流式通讯。
*   **特性**：原生支持 `AbortController`，确保资源零浪费。

### D. 精炼与评分层 (The Refinement Studio)
*   **职责**：执行 `Humanize Loop` 和 `SEO Scoring`。
*   **输出**：带有 JSON-LD Schema、Meta Tags 和 Human Score 的最终资产包。

---

## 4. 关键功能特性 (Feature Specs)

### 4.1 原子化计费保障
*   **逻辑**：采用 Conditional Update 确保在高并发下余额不会出现负数（已在代码中初步实现）。

### 4.2 AI 指纹“洗白” v2.0
*   **逻辑**：不再是简单的重写。引入“困惑度 (Perplexity)”和“突发性 (Burstiness)”算法，针对 Google 最新的 AI 内容检测器进行深度适配。

---

## 5. 路线图与验证 (Roadmap & TDD)

1.  **Phase 1 (Interface)**: 定义这四个模块的 TypeScript Interfaces (03-01 凌晨)。
2.  **Phase 2 (Decoupling)**: 逐一剥离逻辑，保持 `main` 分支功能不受损。
3.  **Phase 3 (Integration)**: 联调流式响应与 CMS 自动对接。

---

## 6. [REJECTED] 暂不实施
*   **多语言翻译**：优先跑通英文/中文核心获客流，多语言扩展放在 v2.5。

---

**Approval Needed:** 
杰克，请确认这个架构方向是否符合你对 STP 的长期预期？
