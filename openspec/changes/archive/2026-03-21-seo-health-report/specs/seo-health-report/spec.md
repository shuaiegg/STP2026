## ADDED Requirements

### Requirement: AuditAnalyzer detects 15 issue types
The system SHALL provide a pure function `analyzeAudit(pages: ScrapedPage[]): AuditIssueReport` that detects the following issue types from crawled page data, with no additional network requests:

- **🔴 Critical**: `DEAD_LINK` (HTTP 4xx/5xx), `MISSING_H1` (h1 field empty)
- **🟡 Warning**: `TITLE_TOO_LONG` (>60 chars), `TITLE_TOO_SHORT` (<20 chars), `MISSING_TITLE`, `MISSING_META_DESC`, `META_DESC_TOO_LONG` (>160 chars), `DUPLICATE_H1` (multiple H1 on same page), `DUPLICATE_TITLE` (same title across pages), `DUPLICATE_META_DESC` (same description across pages)
- **🔵 Info**: `MISSING_OG_IMAGE`, `THIN_CONTENT` (<300 words), `SLOW_PAGE` (loadTime >3000ms), `VERY_SLOW_PAGE` (loadTime >5000ms), `MISSING_CANONICAL`

#### Scenario: Dead link detection
- **WHEN** a crawled page has HTTP status 4xx or 5xx
- **THEN** an issue of type `DEAD_LINK` with severity `critical` SHALL be generated, containing the affected page URL

#### Scenario: Cross-page duplicate title detection
- **WHEN** two or more pages share the exact same title string
- **THEN** a single `DUPLICATE_TITLE` issue SHALL be generated listing all affected page URLs

#### Scenario: Page with no issues
- **WHEN** all crawled pages pass all checks
- **THEN** `issues` array SHALL be empty and all three scores SHALL be 100

### Requirement: Three-dimension scoring (0-100)
The system SHALL compute three scores based on issue prevalence across the crawled pages:

- **techScore**: penalized by dead link ratio (×40), average load time (linear, max −30), canonical missing rate (×30)
- **contentScore**: penalized by missing H1 rate (×35), thin content rate (×30), non-compliant title rate (×35)
- **seoScore**: penalized by missing meta desc rate (×30), missing OG image rate (×25), duplicate title/desc penalty (×25), meta desc too long rate (×20)

All scores SHALL be clamped to [0, 100] and rounded to the nearest integer.

#### Scenario: Score clamping
- **WHEN** calculated penalty exceeds 100
- **THEN** the score SHALL be returned as 0, not a negative value

#### Scenario: Empty page list
- **WHEN** `analyzeAudit` receives an empty array
- **THEN** all three scores SHALL be 100 and `issues` SHALL be empty

### Requirement: Issue items carry Chinese explanation and fix guidance
Each `IssueItem` in the report SHALL include:
- `code`: machine-readable identifier (e.g. `DEAD_LINK`)
- `severity`: `critical` | `warning` | `info`
- `title`: short Chinese label (e.g. `死链`)
- `explanation`: plain-Chinese description of the problem, understandable without SEO background
- `howToFix`: actionable Chinese fix instruction
- `affectedPages`: array of `{ url: string; detail?: string }` objects

#### Scenario: Dead link issue item content
- **WHEN** dead links are detected
- **THEN** the issue item SHALL have `explanation` explaining that broken links harm user experience and search engine crawling, and `howToFix` SHALL instruct to update to correct URLs or add 301 redirects

### Requirement: issueReport persisted in SiteAudit
The system SHALL store the `AuditIssueReport` inside `SiteAudit.report` JSON under the key `issueReport`, alongside the existing `graphData` and `techScore` keys.

#### Scenario: Save with issue report
- **WHEN** the `/api/dashboard/site-intelligence/save` endpoint receives `issueReport` in the request body
- **THEN** it SHALL write `{ graphData, techScore, issueReport }` into the `SiteAudit.report` field

#### Scenario: Historical audit without issueReport
- **WHEN** loading a historical `SiteAudit` whose `report` JSON has no `issueReport` key
- **THEN** the health report tab SHALL render an empty-state message: "此次历史审计无体检数据，请重新扫描"

### Requirement: Health report tab in site console
The site console (`[siteId]/page.tsx`) SHALL include a "体检报告" tab displaying:
1. Three score cards: 技术健康 / 内容质量 / SEO 合规 (color-coded: ≥80 green, 50-79 amber, <50 red)
2. Summary bar: total issue count broken down by severity
3. Issue list sorted: critical → warning → info; each item expandable to show affected pages
4. Each issue card shows: severity badge, Chinese title, explanation, fix guidance, affected page URLs

#### Scenario: Issue list sort order
- **WHEN** issues include items of all three severities
- **THEN** critical issues SHALL appear first, followed by warning, then info

#### Scenario: Expand issue to see affected pages
- **WHEN** user clicks an issue card
- **THEN** the list of affected page URLs SHALL be revealed inline

### Requirement: Issue summary card on instant-audit sidebar
After a scan completes (`status === 'GALAXY_CONSTRUCTED'`), the instant-audit page sidebar SHALL display an "发现问题" card showing critical / warning / info counts and a link to the full health report.

#### Scenario: Summary card visibility
- **WHEN** scan status becomes `GALAXY_CONSTRUCTED` and `issueReport` is available
- **THEN** the summary card SHALL appear below the system status card with counts for each severity

#### Scenario: No issues found
- **WHEN** `issueReport.issues` is empty
- **THEN** the summary card SHALL display "✓ 未发现问题" in green
