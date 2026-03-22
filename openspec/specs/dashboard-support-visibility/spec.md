## ADDED Requirements

### Requirement: Support email visible in user dashboard
The system SHALL display the brand support email `support@scaletotop.com` in a persistently visible location within the authenticated user dashboard.

#### Scenario: Support email visible on all dashboard pages
- **WHEN** an authenticated user is on any page within `/dashboard`
- **THEN** `support@scaletotop.com` is visible in the sidebar without requiring scrolling or navigation

#### Scenario: Support email is a clickable mailto link
- **WHEN** a user clicks the support email in the dashboard sidebar
- **THEN** their email client opens with `support@scaletotop.com` as the recipient

#### Scenario: Support label is clear
- **WHEN** viewing the support email in the sidebar
- **THEN** it is accompanied by a label (e.g., "需要帮助？") so users understand its purpose
