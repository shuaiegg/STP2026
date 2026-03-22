## ADDED Requirements

### Requirement: Tool execution shows credit cost before running
AI tools SHALL display the credit cost of an operation near the execution trigger, so users can make informed decisions before consuming credits.

#### Scenario: Credit cost shown on tool button
- **WHEN** a user views an AI tool with a configured SkillConfig cost
- **THEN** the execution button or adjacent area displays the credit cost (e.g., "消耗 5 积分")

#### Scenario: Cost display gracefully degrades
- **WHEN** the SkillConfig cost cannot be loaded (API error or skill not configured)
- **THEN** the tool button renders without cost display and remains fully functional

#### Scenario: Insufficient credits indicated
- **WHEN** the user's current balance is less than the tool's credit cost
- **THEN** the execution button is visually disabled or shows a warning, and clicking redirects to `/dashboard/billing`

#### Scenario: Cost source is SkillConfig
- **WHEN** the tool cost is displayed
- **THEN** the value matches the `SkillConfig.cost` value in the database, not a hardcoded value

**Scope (this change):** StellarWriter (GEO_WRITER_FULL, 15 credits) and Instant Site Audit (SITE_AUDIT_BASIC, 5 credits) only. Other tools in future iterations.
