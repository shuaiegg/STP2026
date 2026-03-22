## ADDED Requirements

### Requirement: Contact page accessible at /contact
The system SHALL provide a `/contact` page that displays the brand support email `support@scaletotop.com` prominently and is publicly accessible without authentication.

#### Scenario: Page loads without 404
- **WHEN** a visitor navigates to `/contact`
- **THEN** the page renders with HTTP 200 and displays the support email address

#### Scenario: Support email is prominently displayed
- **WHEN** the contact page renders
- **THEN** `support@scaletotop.com` is visible above the fold as a clickable `mailto:` link

#### Scenario: Footer link resolves correctly
- **WHEN** a user clicks "联系我们" in the site footer
- **THEN** they are navigated to `/contact` without a 404 error
