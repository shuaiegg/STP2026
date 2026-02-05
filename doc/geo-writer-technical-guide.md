# Geo-Writer (StellarWriter) 技术实现与方案规格说明

## 1. 产品概述

Geo-Writer（内部代号：StellarWriter）是 ScaletoTop 项目的核心内容生成引擎。它不仅是一个 AI 写作工具，更是一个集成了 **实时搜索引擎结果 (SERP) 分析**、**本地实体绑定 (Maps)**、**竞品骨架拆解 (Skeleton Extractor)** 以及 **AI 去痕 (Humanization)** 的高级 SEO/GEO 内容生产工厂。

其核心目标是：**通过实时竞争对手数据和搜索引擎特征，生成能够真正打败搜索结果现有排名、并符合 AI 搜索引擎 (GEO) 引用习惯的高质量内容。**

---

## 2. 核心架构

Geo-Writer 采用“前端交互控制层 + 后端技能编排层 + 外部数据服务层”的三层架构。

```mermaid
graph TD
    subgraph Frontend [前端控制层 (Next.js)]
        A[Geo-Writer Page] -->|Phased Request| B[Phase Manager]
        B -->|1. Discovery| C[Topics List]
        B -->|2. Deep Analysis| D[Audit Dashboard]
        B -->|3. Strategy| E[Outline Editor]
        B -->|4. Generation| F[Content Generator]
    end

    subgraph Backend [后端编排层 (Skills System)]
        G[StellarWriterSkill] -->|Fetch| H[Data Layer]
        G -->|Orchestrate| I[AI Generation Layer]
    end

    subgraph Data [外部数据层]
        H -->|SERP API| J[DataForSEO]
        H -->|Maps API| J
        H -->|Keywords API| J
        H -->|HTML Parsing| K[SkeletonExtractor]
        H -->|Opportunity Analysis| L[SERPAnalyzer]
    end

    subgraph AI [AI 生成层]
        I -->|Prompt Enhancer| M[Context Injection]
        I -->|DeepSeek/Claude| N[LLM Generation]
        I -->|Humanization| O[Humanize/AI-Detection]
    end
```

---

## 3. 实现流程：即时性情报 (Just-in-Time Intelligence)

Geo-Writer 采用 **即时性情报获取 (JIT)** 策略，将复杂的研究流程拆分为两个阶段，以平衡 API 成本、性能和生成质量。

### 阶段 1：话题发现 (Discovery Phase)
- **目标**: 从用户输入的宽泛关键词中发现高价值、低竞争的具体目标。
- **技术实现**: 
    - 触发 `stellar-writer` 的 `discovery` 模式。
    - 调用 DataForSEO Labs API 获取 20 个相关的长尾关键词。
    - 计算搜索量与竞争度，帮助用户选择“制胜关键词”。
- **价值**: 避免在未确定的关键词上浪费昂贵的 SERP API 额度。

### 阶段 2：深度分析与策略 (Deep Analysis Phase)
- **目标**: 针对选定的关键词进行全方位的竞争对手拆解。
- **技术实现**:
    - **SERP 分析**: 使用 DataForSEO Advanced SERP 端点，获取前 10 名的原始数据。
    - **特征检测**: `SERPAnalyzer` 识别 Featured Snippet 类型、PAA (People Also Ask) 问题及搜索特征。
    - **竞品拆解**: `SkeletonExtractor` 实时抓取排名前三网站的 HTML，提取 H1-H3 标题结构。
    - **本地绑定**: `searchGoogleMaps` 获取地理相关的实体信息。
    - **策略生成**: AI 综合上述数据，生成一份“大师级大纲 (Master Outline)”，并在前端提供交互式编辑能力。

---

## 4. 关键技术组件

### 4.1 SkeletonExtractor (竞品骨架提取器)
- **原理**: 传统的 AI 写作仅通过 LLM 的训练数据猜测结构，而 SkeletonExtractor 通过实时抓取排名靠前的 URL 的 HTML，使用正则和清理逻辑提取其真实大纲。
- **价值**: 确保生成的文章结构逻辑优于当前排名第一的对手。

### 4.2 SERP-Enhanced Prompt (SERP 增强提示词)
- **注入内容**: 
    - PAA 问题：直接在 H2 中回答用户的真实疑问。
    - LSI 关键词：提高关键词相关度评分。
    - 实体信息：增加地理权威性（Local Authority）。
    - 格式提示：如果 SERP 中有表格，AI 会被要求也生成表格以争取 Featured Snippet。

### 4.3 AI 去痕与人文化 (Humanize & Detection)
- **技术依据**: 使用自定义的 `humanizeContent` 算法。
- **策略**: 
    - 随机化句式长度（打破 AI 常见的节奏性）。
    - 注入语气词、反问句及基于观点的陈述。
    - `ai-detection` 模块实时反馈分值，确保内容在搜索引擎的 AI 检测中表现自然。

---

## 5. 性能与成本优化规划

| 优化维度 | 方案 | 效果 |
| :--- | :--- | :--- |
| **API 成本** | JIT 策略：先发现话题，再深度分析。 | 减少 70% 无效 SERP API 调用。 |
| **生成质量** | 竞品大纲逆向工程 + PAA 注入。 | 确保 100% 覆盖搜索意图。 |
| **用户体验** | 流式生成 (Streaming) + 分步确认。 | 消除长时间等待的焦虑感。 |
| **数据重用** | 内存内缓存 (In-memory cache) 策略。 | Step 1 获取的数据流转至 Step 2/3，无重复请求。 |

---

## 6. 关键文件路标

- **整体逻辑编排**: [`stellar-writer.ts`](file:///home/jack/Aladdin/STP2026/src/lib/skills/skills/stellar-writer.ts)
- **数据研究接口**: [`dataforseo.ts`](file:///home/jack/Aladdin/STP2026/src/lib/external/dataforseo.ts)
- **SERP 特征分析**: [`serp-analyzer.ts`](file:///home/jack/Aladdin/STP2026/src/lib/external/serp-analyzer.ts)
- **竞品结构提取**: [`skeleton-extractor.ts`](file:///home/jack/Aladdin/STP2026/src/lib/external/skeleton-extractor.ts)
- **提示词增强工具**: [`prompt-enhancer.ts`](file:///home/jack/Aladdin/STP2026/src/lib/utils/prompt-enhancer.ts)
- **前端交互页面**: [`page.tsx`](file:///home/jack/Aladdin/STP2026/src/app/(public)/tools/geo-writer/page.tsx)

---

## 7. 版本演进记录

1. **v1.0 (基础版)**: 基于 LlamaIndex 的简单 RAG 写作。
2. **v2.0 (SEO 专业版)**: 引入 DataForSEO 实时 SERP 集成，能够识别关键词难度和排名结果。
3. **v2.3 (GEO 进化版)**: 
   - 实现 **JIT Intelligence** 架构。
   - 增加 **PAA / Entities / Competitors** 三维数据聚合。
   - 引入 **AI 去痕 (Humanization)** 与流式大纲编辑。
   - 升级到 **DataForSEO Advanced SERP** 并支持 `ai_overview` 特征识别。
