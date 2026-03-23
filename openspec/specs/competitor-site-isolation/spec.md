## ADDED Requirements

### Requirement: Competitor Flag on Sites
The `Site` model SHALL include an `isCompetitor` boolean flag defaulting to `false`.

#### Scenario: Adding a competitor site
- **WHEN** a user adds a competitor via the Site Selector
- **THEN** the site is created with `isCompetitor: true`.

#### Scenario: Grouping in Site Selector
- **WHEN** the user opens the global Site Selector dropdown
- **THEN** sites SHALL be grouped structurally into "My Sites" and "Competitors".
