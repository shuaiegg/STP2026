## MODIFIED Requirements

### Requirement: Delta comparison between current and previous audit
The HealthReport component SHALL accept an optional `previousIssueReport` prop and display a Delta banner when both current and previous issue reports are available. The Delta SHALL be computed in the frontend by comparing issue code sets. Additionally, the Instant Audit summary UI SHALL display upward/downward (↑/↓) trending arrows against historical numerical scores.

#### Scenario: Both current and previous reports available
- **WHEN** `issueReport` and `previousIssueReport` are both non-null
- **THEN** the HealthReport SHALL display a Delta banner showing "比上次新增 N 个问题，修复了 M 个问题"
- **AND** N = count of issue codes in current but not in previous
- **AND** M = count of issue codes in previous but not in current

#### Scenario: All issues fixed since last audit
- **WHEN** the current report has 0 issues and the previous had issues
- **THEN** the Delta banner SHALL show "比上次修复了 M 个问题" with a green indicator

#### Scenario: No change since last audit
- **WHEN** current and previous reports have the same set of issue codes
- **THEN** the Delta banner SHALL show "与上次审计相比无变化"

#### Scenario: No previous report available
- **WHEN** `previousIssueReport` is null or undefined (first audit or old-format audit)
- **THEN** the Delta banner SHALL NOT be rendered

#### Scenario: Numerical Score Delta
- **WHEN** the parent page passes a historical `techScore` comparison
- **THEN** the UI SHALL render a green ↑ or red ↓ indicator indicating the point difference.
