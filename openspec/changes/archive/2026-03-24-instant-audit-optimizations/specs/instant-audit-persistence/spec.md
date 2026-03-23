## ADDED Requirements

### Requirement: Bind Instant Audit to Site Definition
The Instant Audit page SHALL require a domain to be bound to a tracked `Site` record, removing the free-text arbitrary scan behavior.

#### Scenario: User navigates to Instant Audit
- **WHEN** user opens `/dashboard/site-intelligence/instant-audit`
- **THEN** the system SHALL load the domain from the globally selected Site in the dropdown.

#### Scenario: Auto-loading latest audit
- **WHEN** the page loads with a bound Site
- **THEN** it SHALL automatically fetch and render the most recent `SiteAudit` for that `siteId`.

### Requirement: Site Unbind/Replace Flow
For accounts at their Site quota limit, the system SHALL allow users to replace the active site with explicit warnings.

#### Scenario: Replacing active site
- **WHEN** user chooses to unbind the current site
- **THEN** the system SHALL warn that historical semantic debts and audits will be permanently deleted before allowing the new domain.
