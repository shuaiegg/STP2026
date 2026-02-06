# GEO-Writer 技术方案与核心逻辑指南

本文档旨在介绍 GEO-Writer（及 StellarWriter 引擎）的核心技术实现，包括所有用户输入字段的功能说明以及各项评分（SEO/GEO/Human Score）的计算逻辑与物理原理。

---

## 1. 用户输入字段说明 (User Inputs Guide)

GEO-Writer 采用“三步法”智作流程，各阶段输入字段如下：

### 阶段 1：调研与发现 (Market Research)
- **核心关键词 / 业务主题 (Keywords)**: 
    - **用途**: 设置文章的主攻方向。系统将基于此关键词拉取 Google 实时搜索数据、竞品大纲。
    - **原理**: 触发 `DataForSEO` API 进行 SERP 抓取。
- **目标市场 / 地理位置 (Location)**: 
    - **用途**: 指定搜索数据的地域来源（如 London, New York）。用于本地化 SEO 优化。
    - **原理**: 传递给底层搜索 API，模拟特定地区的搜索结果。
- **目标网站域名 (URL)**: 
    - **用途**: 提升内链建设的精准度。
    - **原理**: 系统会执行 `site:domain "keywords"` 搜索，自动检索该网站已有的相关页面，用于在生成内容中插入真实的内部链接。
- **自动插入配图与图表 (Auto Visuals)**: 
    - **用途**: 控制内容生成时的富媒体策略。开启后，AI 会在段落间自动标注建议的图片位置及图表描述。

### 阶段 2：策略定策 (Content Strategy)
- **语气语调 (Tone)**: 
    - **用途**: 控制内容的写作风格（如：专业权威、知识分享、亲切随性）。
    - **原理**: 映射到 System Prompt 中的 Persona 设定，调整词汇选择及其复杂度。
- **内容类型 (Type)**: 
    - **用途**: 决定内容的结构（如：博客文章、产品评测、操作指南、行业研究）。
    - **原理**: 影响生成时的 Markdown 结构模板及各层级标题的逻辑走向。
- **原始草稿 (Original Content)**: 
    - **用途**: 既可以提供已有文字让 AI 优化，也可以作为背景资料。
    - **原理**: 若提供，系统进入“优化模式”；若为空，则进入“从零创作模式”。

---

## 2. 核心评分系统原理 (Scoring Mechanics)

GEO-Writer 不仅仅生成文字，更通过多个维度量化内容的“竞争力”。

### A. SEO 详细分析分数 (Detailed SEO Score)
- **计算逻辑**: 由 6 个子维度加权算出：
    1. **标题优化 (25%)**: 标题是否包含核心词，长度是否适中。
    2. **元数据描述 (15%)**: Meta-description 的覆盖率。
    3. **关键词密度 (20%)**: 是否过度堆砌或覆盖不足（基于 TF-IDF 思想）。
    4. **可读性 (15%)**: 句子长度的多变性及语法复杂度。
    5. **结构完整性 (20%)**: H1-H3 的逻辑层级及 H-标签的使用密度。
    6. **富媒体策略 (5%)**: 图片 Alt 标签建议及图表覆盖。
- **物理原理**: 系统会将生成的 Markdown 与抓取到的 Top 3 竞品 skeleton 进行对比。如果你的 H-标签覆盖了竞品漏掉的“信息增益点”，则结构分更高。

### B. GEO (Generative Engine Optimization) 分数
- **含义**: 生成式引擎优化分数，代表内容被 AI 搜索引擎（如 Perplexity, SearchGPT）引用的概率。
- **核心因素**:
    1. **直接回答性 (AEO)**: 核心问题是否在第一段或 H2 下方有明确、简练的回答（Direct Answer First）。
    2. **实体绑定 (Entity Binding)**: 是否提到了真实的地点、人物、数据指标。系统通过 Step 1 抓取的实体库进行比对。
    3. **信息增益 (Information Gain)**: 相比竞品，你的内容是否提供了独有的视角或数据（由 `StellarWriter` 引擎通过对比竞品差异点自动注入）。

### C. 人类真实度分数 (Human Score)
- **实现原理 (AI Fingerprint Bleaching)**:
    - 系统内置了 `detectAIPatterns` 逻辑。
    - **检测项**: 
        - **套话率**: 检测 "It's worth noting", "Delve into", "In conclusion" 等典型 AI 连接词。
        - **句长变异系数 (CV)**: 人类写作通常长短句错落有致。如果所有句子长度都在 15-20 词之间，则会被扣分。
        - **缩写率**: 英文中 contraction (don't, it's) 的使用密度。
    - **闭环修正**: 如果 `Human Score < 60%`，`StellarWriter` 会触发“二号改稿模型”（Aggressive Humanizer），强制打破 AI 的平稳性，重新引入长短节奏变化。

---

## 3. 技术路线图
- **语言模型**: 采用 DeepSeek-Chat V3 (236B) / Claude 3.5 Sonnet 双模型协同。
- **数据源**: DataForSEO Google SERP API。
- **前端架构**: Next.js 14 + TailwindCSS + Lucide Icons。
- **流式输出**: AI SDK (Vercel) 提供实时打字机体验。

---
> [!NOTE]
> 每一个“建议内部链接”都是基于您提供的 URL 在 Google 索引中真实存在的页面，而非 AI 幻觉生成的无效链接。
