## ADDED Requirements

### Requirement: Tool credit costs configuration
The system SHALL define credit costs for all tools in `prisma/seed-skills.ts` using upsert operations.

#### Scenario: Site audit cost
- **WHEN** `SITE_AUDIT_BASIC` SkillConfig is queried
- **THEN** its `cost` is 5 credits and `isActive` is true

#### Scenario: GEO Writer cost
- **WHEN** `GEO_WRITER_FULL` SkillConfig is queried
- **THEN** its `cost` is 15 credits

#### Scenario: Competitor analysis cost
- **WHEN** `COMPETITOR_ANALYSIS` SkillConfig is queried
- **THEN** its `cost` is 8 credits

### Requirement: Insufficient credits redirect
The system SHALL redirect users to the billing page when they attempt to use a tool without sufficient credits.

#### Scenario: Site audit with insufficient credits
- **WHEN** a user with fewer than 5 credits attempts to start a site audit
- **THEN** the system displays an "积分不足" message and provides a link to `/dashboard/billing`

#### Scenario: Sufficient credits allow tool use
- **WHEN** a user has credits ≥ the tool cost
- **THEN** the tool executes normally and deducts credits via `chargeUser()`
