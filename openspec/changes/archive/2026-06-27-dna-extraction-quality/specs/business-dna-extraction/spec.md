## ADDED Requirements

### Requirement: Business DNA is extracted from a single primary language
The system SHALL detect the site's primary language in a language-agnostic way and extract business DNA from pages of that language only, so mixed-language content does not distort the result.

#### Scenario: Primary language from homepage
- **WHEN** a site is extracted
- **THEN** the primary language MUST be determined from the homepage `<html lang>` first, then a language-detection library, then TLD/content sampling — and MUST NOT rely on script-ratio heuristics (e.g. Chinese-character ratio)

#### Scenario: Single-language isolation
- **WHEN** a site has pages in multiple languages (e.g. English marketing root + Chinese blog)
- **THEN** extraction MUST feed only primary-language pages to the model, and the resulting DNA MUST reflect the actual business (not be skewed by non-primary-language content)

#### Scenario: Stored canonical language
- **WHEN** DNA is extracted
- **THEN** the resulting `SiteOntology` MUST record its `sourceLocale` (the canonical extraction language)

### Requirement: Extraction is driven by business-describing pages with body content
The system SHALL select business-describing pages and feed their body content (not only metadata) to extraction.

#### Scenario: Business page selection
- **WHEN** choosing pages to extract from
- **THEN** the system MUST prefer homepage + about/pricing/product/services pages and MUST exclude blog/news/legal pages, using body-content excerpts rather than title/description alone

#### Scenario: Thin site fallback
- **WHEN** crawled business-page content is insufficient
- **THEN** the system MUST guide the user to provide a short business description as an extraction seed instead of producing a low-quality guess

### Requirement: A single unified extractor produces the full DNA
The system SHALL use one extraction path that produces the complete DNA, including positioning and brand tone.

#### Scenario: Full field set
- **WHEN** DNA is extracted (onboarding or re-analyze)
- **THEN** it MUST produce coreOfferings, targetAudience, painPointsSolved, idealTopicMap, logicChains, positioning, and brandTone via the same unified logic

### Requirement: Internal language consistency for the blueprint
The system SHALL keep DNA, ideal topic map, and semantic gap in the same canonical language so the content blueprint join succeeds.

#### Scenario: Gap uses DNA source locale
- **WHEN** semantic gap analysis runs
- **THEN** its output language MUST be the DNA's `sourceLocale` (not the dashboard user's locale), so debt topics and ideal topic map are in the same language and the blueprint matches them

#### Scenario: Output language bridging
- **WHEN** content is generated in a target language different from the DNA's source locale
- **THEN** the generation prompt MUST specify the target language and rely on the model to bridge from the canonical DNA (no per-language DNA re-extraction required)

### Requirement: Extraction is trustworthy and edit-safe
The system SHALL surface what was read and protect user edits.

#### Scenario: Glass-box source
- **WHEN** DNA is shown after extraction
- **THEN** the UI MUST indicate which pages were read and that it is an AI first-pass that can be edited, and MUST label the DNA's source language

#### Scenario: Re-analyze guard
- **WHEN** a user triggers re-analyze on an ontology that has been confirmed/edited (`confirmedAt` set)
- **THEN** the system MUST warn that re-analysis will replace the current DNA (including edits) before proceeding
