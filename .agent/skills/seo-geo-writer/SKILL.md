---
name: seo-geo-writer
description: Generate and optimize content for SEO (Search Engine Optimization) and GEO (Generative Engine Optimization / AI citation). Use when asked to (1) write or optimize articles for search engines, (2) create SEO-friendly content, (3) optimize content for AI citations (ChatGPT/Claude/Perplexity), (4) generate Schema structured data, (5) create distribution snippets for LinkedIn/Reddit/Twitter, or (6) audit content for GEO readiness.
---

# SEO & GEO Content Writer

Create content optimized for both search engines and generative AI citation.

## Input Requirements

Before starting, collect:
- **Content source**: Existing article (URL/text) OR target keyword for new content
- **Brand name**: For entity binding (optional)
- **Target URL**: Canonical URL for Schema
- **Content type**: TOFU (awareness) / MOFU (consideration) / BOFU (decision)

## Workflow

### Step 1: Intent & Entity Analysis

**1.1 Classify search intent:**
- TOFU: What is X / Why X / Trends
- MOFU: How to X / X vs Y / Frameworks
- BOFU: X tools / X cost / Implementation

**1.2 Define entities:**
- 1 primary entity (core topic)
- 3-5 secondary entities (related concepts)
- Brand role: methodology provider / tool / system integrator

**Output:** 3-5 semantic long-tail keywords + 1 entity definition sentence.

### Step 2: Direct Answer First (AEO)

Write the opening paragraph:
- ≤50 words
- Pattern: `{Topic} is {definition}. {Value statement}.`
- Must be extractable by AI independently

**Example:**
> Marketing automation is the use of software to automate repetitive marketing tasks. It enables businesses to scale personalized customer engagement while reducing manual effort.

### Step 3: Modular Content Structure

Organize with clear hierarchy:

```
# H1: Primary Keyword
[Direct answer paragraph]

## H2: What/Why (TOFU)
[2-3 paragraphs]

## H2: How to (MOFU)
[Steps or framework]

## H2: Tools/Implementation (BOFU)
[Practical guidance]

## H2: FAQ
[3-5 Q&As matching AI query patterns]
```

**Rules:**
- Each H2 solves one sub-question
- No cross-references between sections ("as mentioned above")
- Use lists/tables for scanability

### Step 4: Information Gain

Include at least ONE unique element:
- Original data/statistics
- Comparison table
- Named framework (brand-attributed)
- Case study with specifics
- Expert quote with attribution

### Step 5: E-E-A-T Signals

Embed in content:
- First-hand experience: "In our work with X clients..."
- Data: Specific numbers, percentages, results
- Citations: Link to authoritative sources
- Author byline with credentials

### Step 6: Technical SEO

See [references/seo-checklist.md](references/seo-checklist.md) for full checklist.

**Quick check:**
- Title: 50-60 chars, keyword front-loaded
- Meta description: 120-160 chars with CTA
- URL: Short, keyword-rich, hyphens
- Images: Descriptive filenames + alt text
- Internal links: 3-5 relevant links

### Step 7: Schema Generation

Generate JSON-LD using `scripts/schema-generator.py`:

```bash
# Article + FAQ combined
python scripts/schema-generator.py --type combined --config config.json --pretty
```

See [references/schema-templates.md](references/schema-templates.md) for templates.

**Required schemas:**
- Article (always)
- FAQPage (if FAQ section exists)
- HowTo (if step-by-step content)
- BreadcrumbList (for navigation)

### Step 8: Distribution Snippets

Create platform-specific versions. See [references/distribution-templates.md](references/distribution-templates.md).

| Platform | Tone | Length | Focus |
|----------|------|--------|-------|
| LinkedIn | Professional | 150-300 words | Framework, authority |
| Reddit | Authentic | Varies | Problem-solution, no ads |
| Twitter | Punchy | Thread format | Quick insights |

### Step 9: GEO Audit

Run audit before publishing:

```bash
python scripts/geo-audit.py content.md --brand "Brand Name"
```

**Passing criteria (score ≥70):**
- [ ] AI can extract core answer in 5 seconds
- [ ] Contains unique information gain
- [ ] Brand bound to method/framework
- [ ] Clear, low-friction next step (CTA)

## Output Checklist

Deliver these artifacts:

1. **Optimized article** (Markdown)
2. **SEO metadata**
   - Title tag
   - Meta description
   - Target keywords
3. **Schema JSON-LD**
4. **Distribution snippets** (LinkedIn, Reddit, Twitter)
5. **Internal link suggestions** (3-5 related topics)
6. **GEO audit report**

## Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `schema-generator.py` | Generate JSON-LD | `--type article/faq/howto/combined` |
| `geo-audit.py` | Audit GEO readiness | `content.md --brand "Name"` |

## References

| File | Content |
|------|---------|
| [seo-checklist.md](references/seo-checklist.md) | Technical SEO checklist |
| [schema-templates.md](references/schema-templates.md) | Schema JSON-LD templates |
| [distribution-templates.md](references/distribution-templates.md) | Platform distribution templates |
