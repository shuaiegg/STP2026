## MODIFIED Requirements

### Requirement: Three-dimension scoring (0-100)
The system SHALL compute three scores based on issue prevalence across the crawled pages:

- **techScore**: penalized by dead link ratio (×40), average load time (linear, max −30), canonical missing rate (×30)
- **contentScore**: penalized by missing H1 rate (×35), thin content rate (×30), non-compliant title rate (×35)
- **seoScore**: penalized by missing meta desc rate (×30), missing OG image rate (×25), **duplicate content penalty (linear: affectedByDuplicates/totalPages × 25)**, meta desc too long rate (×20)

All scores SHALL be clamped to [0, 100] and rounded to the nearest integer.

**Change from previous**: The duplicate content penalty was a binary 25-point deduction. It is now linear: `(count of pages affected by duplicate title or duplicate description, deduplicated) / totalPages × 25`.

#### Scenario: Score clamping
- **WHEN** calculated penalty exceeds 100
- **THEN** the score SHALL be returned as 0, not a negative value

#### Scenario: Empty page list
- **WHEN** `analyzeAudit` receives an empty array
- **THEN** all three scores SHALL be 100 and `issues` SHALL be empty

#### Scenario: Linear duplicate penalty
- **WHEN** 10 out of 100 pages are affected by duplicate titles or descriptions
- **THEN** the duplicate penalty SHALL be 10/100 × 25 = 2.5 points (not a flat 25)

#### Scenario: No duplicates
- **WHEN** all pages have unique titles and descriptions
- **THEN** the duplicate penalty SHALL be 0

### Requirement: Issue list sorted by severity then affected page count
Issues in `AuditIssueReport.issues` SHALL be sorted first by severity (critical → warning → info), then within the same severity by `affectedPages.length` descending.

**Change from previous**: Previous sort was severity-only. The secondary sort by affected page count is new.

#### Scenario: Same-severity issues sorted by impact
- **WHEN** two warning issues exist, one affecting 15 pages and another affecting 3 pages
- **THEN** the 15-page issue SHALL appear before the 3-page issue in the list

#### Scenario: Severity still takes absolute priority
- **WHEN** an info issue affects 50 pages and a critical issue affects 1 page
- **THEN** the critical issue SHALL still appear before the info issue

### Requirement: AuditAnalyzer detects 15 issue types
The system SHALL provide a pure function `analyzeAudit(pages: ScrapedPage[]): AuditIssueReport` that detects the following issue types from crawled page data, with no additional network requests:

- **🔴 Critical**: `DEAD_LINK` (HTTP 4xx/5xx), `MISSING_H1` (h1 field empty)
- **🟡 Warning**: `TITLE_TOO_LONG` (>60 chars), `TITLE_TOO_SHORT` (<20 chars), `MISSING_TITLE`, `MISSING_META_DESC`, `META_DESC_TOO_LONG` (>160 chars), `DUPLICATE_H1` (multiple H1 on same page), `DUPLICATE_TITLE` (same title across pages), `DUPLICATE_META_DESC` (same description across pages)
- **🔵 Info**: `MISSING_OG_IMAGE`, `THIN_CONTENT` (<300 words), `SLOW_PAGE` (loadTime >3000ms), `VERY_SLOW_PAGE` (loadTime >5000ms), `MISSING_CANONICAL`

*Note: Additional issue types (`ORPHAN_PAGE`, `MISSING_H2`, `HEADING_HIERARCHY_BROKEN`, `MISSING_VIEWPORT`, `MISSING_STRUCTURED_DATA`) are defined in their respective capability specs and extend this set.*

#### Scenario: Dead link detection
- **WHEN** a crawled page has HTTP status 4xx or 5xx
- **THEN** an issue of type `DEAD_LINK` with severity `critical` SHALL be generated, containing the affected page URL

#### Scenario: Cross-page duplicate title detection
- **WHEN** two or more pages share the exact same title string
- **THEN** a single `DUPLICATE_TITLE` issue SHALL be generated listing all affected page URLs

#### Scenario: Page with no issues
- **WHEN** all crawled pages pass all checks
- **THEN** `issues` array SHALL be empty and all three scores SHALL be 100
