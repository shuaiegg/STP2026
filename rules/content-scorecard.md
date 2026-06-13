# Content Quality Scorecard

## Overview
This scorecard is used to evaluate the quality of AI-generated content produced by the `geo-writer` (StellarWriter) pipeline. The goal is to establish a baseline for content quality, identify areas for improvement in the prompt pipeline, and ensure a minimum standard before publishing.

**Pass Mark:** 70 / 100

## 5-Dimension Scoring Rubric

### 1. Information Density & Depth (30 pts)
- [ ] (10) Beyond superficial definitions; provides actionable insights or unique perspectives.
- [ ] (10) Includes specific examples, case studies, or data points (even if generated/simulated logically).
- [ ] (10) Avoids fluff, repetition, and "fluff words" (e.g., "In today's fast-paced digital world").

### 2. Structural & Logical Flow (20 pts)
- [ ] (10) Clear, logical progression from intro to conclusion (H2s and H3s make sense).
- [ ] (5) Good use of formatting (bullet points, bold text, tables) to break up long paragraphs.
- [ ] (5) Smooth transitions between sections.

### 3. SEO & GEO Optimization (20 pts)
- [ ] (5) Primary keyword naturally integrated into H1, intro, and conclusion.
- [ ] (5) Semantic secondary keywords present without "keyword stuffing".
- [ ] (10) Answers implicit user intent (Search Intent) effectively.

### 4. Tone, Voice & Readability (20 pts)
- [ ] (10) Matches the requested tone (e.g., professional, conversational) consistently.
- [ ] (5) Sentence length varies; avoids monotonous, robotic cadence.
- [ ] (5) Vocabulary is appropriate for the target audience (not overly complex or too simplistic).

### 5. Factual Accuracy & Hallucination Avoidance (10 pts)
- [ ] (10) Claims, statistics, or "facts" presented are generally accurate or framed appropriately to avoid misleading the reader.

## Pipeline Attribution Table (Stellar Pipeline)
When a score falls short, attribute the failure to a specific pipeline stage for future engineering optimization:

| Pipeline Stage | Potential Issues / Symptoms |
| :--- | :--- |
| **Research (SERP/Competitor)** | Content is generic; lacks current context; misses competitor gaps. |
| **Strategy (Outline/Brief)** | Poor structure; missing key sections; illogical flow. |
| **Creation (Drafting)** | Hallucinations; robotic tone; fluff words; poor transitions. |
| **Refinement (Audit/Rewrite)** | Failed to fix identified SEO issues; grammar errors left untouched. |

---

## Baseline Evaluation Log

*To be filled out as articles are generated and evaluated.*

| Date | Title | Language | Info (30) | Flow (20) | SEO (20) | Tone (20) | Fact (10) | Total | Attribution / Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | | | | | |

