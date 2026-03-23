## ADDED Requirements

### Requirement: Markdown Export for LLMs
The system SHALL provide a "Copy as Markdown" action on the Instant Audit results page that transforms visual data into an LLM-optimized prompt.

#### Scenario: Copying audit data
- **WHEN** user clicks "Export as Markdown"
- **THEN** the system SHALL serialize the Tech Score, Issue Counts, and key GalaxyGraph nodes into a Markdown string and copy it to the clipboard.
- **AND** the clipboard content SHALL include a generic system prompt instructing the LLM to act as an SEO strategist.
