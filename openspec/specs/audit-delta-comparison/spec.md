## ADDED Requirements

### Requirement: Delta comparison between current and previous audit
The HealthReport component SHALL accept an optional `previousIssueReport` prop and display a Delta banner when both current and previous issue reports are available. The Delta SHALL be computed in the frontend by comparing issue code sets.

Delta is defined as:
- **New issues**: issue codes present in current report but not in previous
- **Fixed issues**: issue codes present in previous report but not in current

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

### Requirement: Parent page passes previous audit data to HealthReport
The `[siteId]/page.tsx` SHALL pass the second-most-recent audit's `issueReport` (index 1 in the audits array) as `previousIssueReport` to the `HealthReport` component.

#### Scenario: At least two audits exist
- **WHEN** the audits API returns 2 or more records with issueReport data
- **THEN** `audits[1].issueReport` SHALL be passed as `previousIssueReport`

#### Scenario: Only one audit exists
- **WHEN** the audits API returns exactly one record
- **THEN** `previousIssueReport` SHALL be `null` and no Delta banner SHALL appear
