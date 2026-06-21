## ADDED Requirements

### Requirement: GDPR cookie consent banner
The system SHALL present a cookie consent banner asking visitors to accept or decline cookies.

#### Scenario: First-time visitor banner visibility
- **WHEN** user visits the site without `cookie_consent_status` cookie
- **THEN** system displays the CookieConsentBanner prompting the user to accept or decline

### Requirement: Tracking gate by consent status
The system SHALL block analytic scripts (PostHog/GTM) until the user gives explicit consent.

#### Scenario: No tracking before consent
- **WHEN** the user has not clicked Accept
- **THEN** no network requests are sent to PostHog or GTM

#### Scenario: Tracking active after consent
- **WHEN** the user clicks Accept
- **THEN** system sets `cookie_consent_status` to accepted, calls `opt_in_capturing()`, and loads GTM
