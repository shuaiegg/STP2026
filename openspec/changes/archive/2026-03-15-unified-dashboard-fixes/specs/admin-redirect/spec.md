## MODIFIED Requirements

### Requirement: Authenticated users visiting /login are redirected to /dashboard
The middleware SHALL redirect any request to `/login` from an already-authenticated user (session cookie present) to `/dashboard` before any other non-admin path handling occurs. This check MUST execute before the `!isPathDashboard` early-return branch.

#### Scenario: Logged-in user visits /login
- **WHEN** a user with a valid `better-auth.session_token` cookie navigates to `/login`
- **THEN** the middleware SHALL return a redirect to `/dashboard`
- **THEN** the login page SHALL NOT be rendered

#### Scenario: Unauthenticated user visits /login
- **WHEN** a user without a session cookie navigates to `/login`
- **THEN** the middleware SHALL NOT redirect
- **THEN** the login page SHALL render normally

#### Scenario: /login redirect does not interfere with /admin/login redirect
- **WHEN** a request arrives for `/admin/login`
- **THEN** the existing `/admin/login` → `/login` redirect SHALL still execute first (before the /login check)
