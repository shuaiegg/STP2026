## ADDED Requirements

### Requirement: Missing H2 detection
The system SHALL detect pages that have body content (wordCount > 100) but no H2 headings, indicating an unstructured article layout. This check uses the already-collected `h2[]` field.

#### Scenario: Content page with no H2
- **WHEN** a page has `wordCount > 100` and `h2.length === 0`
- **THEN** a `MISSING_H2` issue with severity `warning` SHALL be generated, listing the affected page URL

#### Scenario: Short page without H2 is not flagged
- **WHEN** a page has `wordCount ≤ 100` and no H2
- **THEN** no `MISSING_H2` issue SHALL be generated (short pages such as contact/pricing do not require headings)

#### Scenario: Page with at least one H2
- **WHEN** a page has one or more H2 headings
- **THEN** no `MISSING_H2` issue SHALL be generated for that page

### Requirement: Heading hierarchy broken detection
The system SHALL detect pages where heading levels are skipped (e.g., H1 directly followed by H3 with no H2 in between), indicating poor document outline structure.

#### Scenario: H1 followed by H3 with no H2
- **WHEN** a page has a non-empty `h1` field, `h2.length === 0`, and `h3.length > 0`
- **THEN** a `HEADING_HIERARCHY_BROKEN` issue with severity `info` SHALL be generated, listing the affected page URL

#### Scenario: Proper hierarchy
- **WHEN** a page has H1, H2, and H3 all present
- **THEN** no `HEADING_HIERARCHY_BROKEN` issue SHALL be generated

#### Scenario: Page with no headings at all
- **WHEN** a page has no H1, H2, or H3
- **THEN** no `HEADING_HIERARCHY_BROKEN` issue SHALL be generated (this is covered by `MISSING_H1`)
