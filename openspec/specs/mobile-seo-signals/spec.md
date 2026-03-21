## ADDED Requirements

### Requirement: Viewport meta tag collection
The fetcher SHALL collect a boolean `hasViewportMeta` field for each page by checking the presence of `<meta name="viewport">` in the page HTML. This field SHALL be included in the `ScrapedPage` type.

#### Scenario: Page has viewport meta tag
- **WHEN** the page HTML contains `<meta name="viewport" ...>`
- **THEN** `hasViewportMeta` SHALL be `true`

#### Scenario: Page missing viewport meta tag
- **WHEN** the page HTML does not contain `<meta name="viewport">`
- **THEN** `hasViewportMeta` SHALL be `false`

### Requirement: Missing viewport meta detection
The audit analyzer SHALL detect pages missing a viewport meta tag and report them as a `MISSING_VIEWPORT` warning issue.

#### Scenario: Page without viewport meta
- **WHEN** a crawled page has `hasViewportMeta === false`
- **THEN** a `MISSING_VIEWPORT` issue with severity `warning` SHALL be generated, listing the affected page URL

#### Scenario: Page with viewport meta
- **WHEN** a crawled page has `hasViewportMeta === true`
- **THEN** no `MISSING_VIEWPORT` issue SHALL be generated for that page

### Requirement: Structured data (JSON-LD) collection
The fetcher SHALL collect a boolean `hasStructuredData` field by checking for `<script type="application/ld+json">` in the page HTML.

#### Scenario: Page has JSON-LD structured data
- **WHEN** the page HTML contains `<script type="application/ld+json">`
- **THEN** `hasStructuredData` SHALL be `true`

#### Scenario: Page missing structured data
- **WHEN** no JSON-LD script tag is present
- **THEN** `hasStructuredData` SHALL be `false`

### Requirement: Missing structured data detection
The audit analyzer SHALL detect pages with no JSON-LD structured data and report them as a `MISSING_STRUCTURED_DATA` info issue.

#### Scenario: Page without structured data
- **WHEN** a crawled page has `hasStructuredData === false`
- **THEN** a `MISSING_STRUCTURED_DATA` issue with severity `info` SHALL be generated, listing the affected page URL

#### Scenario: Backward compatibility with old audit records
- **WHEN** a `ScrapedPage` record lacks the `hasViewportMeta` or `hasStructuredData` field (legacy data)
- **THEN** the analyzer SHALL treat the missing field as `false` without throwing an error
