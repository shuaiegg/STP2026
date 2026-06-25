## ADDED Requirements

### Requirement: Growth Home has an explicit primary navigation entry
The dashboard sidebar SHALL expose an explicit primary navigation item that links to the Growth Home (`/dashboard`), so it is not reachable only via the logo.

#### Scenario: Returning to Growth Home from a sub-page
- **WHEN** a user is on any dashboard sub-page (e.g. site-intelligence, tools, library) and the sidebar is visible
- **THEN** a primary navigation item linking to `/dashboard` MUST be present and, when clicked, navigate to the Growth Home

#### Scenario: Active state on Growth Home
- **WHEN** the current path is exactly `/dashboard`
- **THEN** the Growth Home navigation item MUST render in its active state

#### Scenario: No site yet
- **WHEN** the user has no registered site
- **THEN** the Growth Home navigation item MUST point to the onboarding route (not a path that only 307-redirects)
