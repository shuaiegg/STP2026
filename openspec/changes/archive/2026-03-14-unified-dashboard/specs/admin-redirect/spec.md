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
