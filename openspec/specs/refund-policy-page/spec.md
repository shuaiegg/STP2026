## ADDED Requirements

### Requirement: Standalone refund policy page
The system SHALL provide a `/refund` page that clearly states the refund policy, including response time commitments and eligible refund scenarios.

#### Scenario: Page accessible at /refund
- **WHEN** a visitor navigates to `/refund`
- **THEN** the page renders with HTTP 200

#### Scenario: Response time commitment stated
- **WHEN** viewing the refund policy
- **THEN** the page states that customer refund requests will receive a response within 3 business days

#### Scenario: Refund eligibility defined
- **WHEN** viewing the refund policy
- **THEN** the page clearly states that refunds are only applicable for system errors causing incorrect credit deduction, and that credits consumed through normal tool use are non-refundable

#### Scenario: Contact method for refund requests
- **WHEN** viewing the refund policy
- **THEN** the page provides `support@scaletotop.com` as the channel for submitting refund requests

#### Scenario: Footer link to refund policy
- **WHEN** viewing the site footer
- **THEN** a "退款政策" link is present that navigates to `/refund`
