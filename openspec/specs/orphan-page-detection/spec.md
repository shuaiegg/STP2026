## ADDED Requirements

### Requirement: Orphan page detection via reverse link analysis
The system SHALL detect pages that have no internal links pointing to them by performing a reverse-reference analysis on the already-collected `internalLinks[]` field of each `ScrapedPage`. This analysis SHALL occur within `analyzeAudit()` with no additional network requests.

An orphan page is defined as: a crawled page whose URL does not appear in the `internalLinks[]` of any other crawled page, excluding the root domain URL.

#### Scenario: Page with no inbound internal links
- **WHEN** a crawled page URL does not appear in the `internalLinks[]` array of any other crawled page
- **AND** the page is not the root domain (e.g., `https://example.com` or `https://example.com/`)
- **THEN** an `ORPHAN_PAGE` issue with severity `warning` SHALL be generated, listing that page as an affected page

#### Scenario: Root domain is never flagged as orphan
- **WHEN** the root domain URL is not referenced by other pages
- **THEN** the root domain SHALL NOT be included in the `ORPHAN_PAGE` affected pages list

#### Scenario: No orphan pages
- **WHEN** every crawled page URL appears in the `internalLinks[]` of at least one other crawled page
- **THEN** no `ORPHAN_PAGE` issue SHALL be generated

#### Scenario: Single-page audit
- **WHEN** only one page was crawled
- **THEN** no `ORPHAN_PAGE` issue SHALL be generated (insufficient data)
