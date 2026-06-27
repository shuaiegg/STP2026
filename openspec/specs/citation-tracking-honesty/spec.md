# citation-tracking-honesty Specification

## Purpose
TBD - created by archiving change citation-tracking-honesty. Update Purpose after archive.
## Requirements
### Requirement: Product must not claim AI-citation tracking it does not perform
User-facing copy SHALL NOT claim the product tracks or monitors AI/LLM citations, because the implementation only checks Google SERP ranking. Tracking-related claims SHALL be described honestly as search visibility / ranking tracking.

#### Scenario: Marketing/homepage copy
- **WHEN** the homepage or marketing copy describes the visibility-tracking capability
- **THEN** it MUST describe it as search visibility / ranking tracking (Google SERP) and MUST NOT claim real-time monitoring across "AI response engines" or "AI citation tracking"

#### Scenario: Article status labels
- **WHEN** a tracked article's status is shown to the user
- **THEN** the label MUST read as inclusion/ranking (e.g. "indexed/ranked" vs "not indexed") rather than implying the article was cited by an AI engine

#### Scenario: GEO positioning preserved
- **WHEN** copy refers to GEO optimization, content "AI-citability/GEO readiness" from the audit, or advice that improves citation probability
- **THEN** such copy MAY remain, because the audit genuinely analyzes content structure for citability — only false *tracking* claims are removed

### Requirement: Honest copy is bilingual-consistent
The honest wording SHALL be applied consistently across both locales.

#### Scenario: zh/en parity
- **WHEN** a tracking claim is corrected in one locale's messages
- **THEN** the corresponding string in the other locale MUST be corrected to match (no locale left with the false claim)

