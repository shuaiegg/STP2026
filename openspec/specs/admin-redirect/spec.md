## ADDED Requirements

### Requirement: /admin/* routes redirect to /dashboard equivalents
The middleware SHALL intercept all requests to `/admin/*` (except `/admin/setup`) and return a 301 permanent redirect to the corresponding `/dashboard/admin/*` path.

#### Scenario: /admin redirects to /dashboard
- **WHEN** a request is made to `/admin`
- **THEN** the middleware SHALL return a 301 redirect to `/dashboard`

#### Scenario: /admin/content redirects to /dashboard/admin/content
- **WHEN** a request is made to `/admin/content`
- **THEN** the middleware SHALL return a 301 redirect to `/dashboard/admin/content`

#### Scenario: /admin/sync redirects to /dashboard/admin/sync
- **WHEN** a request is made to `/admin/sync`
- **THEN** the middleware SHALL return a 301 redirect to `/dashboard/admin/sync`

#### Scenario: /admin/users redirects to /dashboard/admin/users
- **WHEN** a request is made to `/admin/users`
- **THEN** the middleware SHALL return a 301 redirect to `/dashboard/admin/users`

#### Scenario: /admin/skills redirects to /dashboard/admin/skills
- **WHEN** a request is made to `/admin/skills`
- **THEN** the middleware SHALL return a 301 redirect to `/dashboard/admin/skills`

#### Scenario: Unknown /admin/* path redirects to /dashboard/admin/*
- **WHEN** a request is made to any `/admin/<path>` not explicitly listed
- **THEN** the middleware SHALL return a 301 redirect to `/dashboard/admin/<path>`

### Requirement: /admin/login redirects to /login
The middleware SHALL redirect `/admin/login` to the unified `/login` page.

#### Scenario: /admin/login redirects to /login
- **WHEN** a request is made to `/admin/login`
- **THEN** the middleware SHALL return a 301 redirect to `/login`

### Requirement: /admin/setup remains accessible and is not redirected
The `/admin/setup` first-run wizard SHALL NOT be redirected. It SHALL remain accessible at its original URL to support initial system setup.

#### Scenario: /admin/setup is accessible
- **WHEN** a request is made to `/admin/setup`
- **THEN** the middleware SHALL NOT redirect the request
- **THEN** the `/admin/setup` page SHALL render normally

### Requirement: Middleware matcher updated to include /admin routes
The middleware `config.matcher` SHALL include `/admin/:path*` so that redirect rules are applied to all admin paths.

#### Scenario: Middleware applies to /admin paths
- **WHEN** Next.js processes the middleware config
- **THEN** the matcher SHALL include `/admin/:path*`

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
