## ADDED Requirements

### Requirement: Conditional hreflang output
The system SHALL generate `<link rel="alternate" hreflang="...">` tags only when paired translations exist in the database.

#### Scenario: Unpaired article alternates
- **WHEN** an article is queryable but has no `translationGroupId`
- **THEN** alternates languages metadata is not generated

#### Scenario: Paired article alternates
- **WHEN** an article is paired with a translation in another language under same `translationGroupId`
- **THEN** alternates languages metadata is generated referencing both articles and an x-default version
