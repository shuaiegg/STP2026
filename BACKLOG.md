# STP2026 Innovation Backlog & Roadmap

## 🧠 Tier 1: Independent Tools (To Be Developed)

### 1. STP Brain (Knowledge Context Engine)
*   **Concept**: A standalone RAG (Retrieval-Augmented Generation) tool.
*   **Core Function**: Allow users to upload brand PDFs, style guides, and paste website URLs. The engine processes these into a vector space (Supabase pgvector) specific to the user's workspace.
*   **Integration**: Geo-Writer will simply add a dropdown: "Select Brand Brain", and query this independent service for context before writing. This keeps the writer fast while making the content highly personalized.

### 2. STP Topical Map Visualizer (The Strategy Board)
*   **Concept**: A visual planning tool that shifts SEO from "single article" to "whole-site dominance."
*   **Core Function**: User inputs a seed keyword (e.g., "Solar Panels"). The tool generates a 50-100 node mind map of Pillar Pages and Cluster Content, complete with suggested internal linking structures.
*   **Integration**: Users can click any node on the Topical Map and send it directly to Geo-Writer for execution.

---

## 🛠 Tier 2: Existing Tool Enhancements

### 1. Geo-Writer (v3.0)
*   [x] Parallel SERP scraping
*   [x] Smart Contextual Links
*   [x] PostHog Analytics Tracking
*   [ ] Live Human-Score Dashboard (Real-time detection of AI patterns)
*   [ ] Image auto-insertion via Unsplash API

---
*Maintained by PM-Aladdin.*
