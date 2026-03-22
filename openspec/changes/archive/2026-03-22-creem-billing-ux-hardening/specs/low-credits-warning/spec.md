## ADDED Requirements

### Requirement: Low credits warning banner
The dashboard layout SHALL display a persistent warning banner when the user's credit balance falls below 10.

#### Scenario: Banner shown when credits < 10
- **WHEN** an authenticated user's credit balance is less than 10
- **THEN** a yellow warning banner is displayed at the top of the main content area on all dashboard pages

#### Scenario: Banner not shown when credits ≥ 10
- **WHEN** a user has 10 or more credits
- **THEN** no warning banner is displayed

#### Scenario: Banner links to billing page
- **WHEN** the user clicks the warning banner or its CTA button
- **THEN** they are navigated to `/dashboard/billing`

#### Scenario: Banner shows current balance
- **WHEN** the warning banner is displayed
- **THEN** it shows the exact current credit balance and a call-to-action to top up (e.g., "您仅剩 3 积分，点击充值")
