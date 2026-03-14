## ADDED Requirements

### Requirement: Dashboard sidebar renders role-based admin section
The dashboard sidebar SHALL display an "管理" (Admin) section only when the current user's role is `ADMIN` or `EDITOR`. This section SHALL appear below the standard user navigation groups and SHALL contain links to admin-only pages.

#### Scenario: ADMIN user sees admin section
- **WHEN** a user with role `ADMIN` views the dashboard sidebar
- **THEN** the sidebar SHALL display an "管理" section containing: 内容管理, Notion 同步, 用户管理, 技能管理

#### Scenario: EDITOR user sees limited admin section
- **WHEN** a user with role `EDITOR` views the dashboard sidebar
- **THEN** the sidebar SHALL display an "管理" section containing: 内容管理, Notion 同步
- **THEN** the sidebar SHALL NOT display 用户管理 or 技能管理 links

#### Scenario: USER role sees no admin section
- **WHEN** a user with role `USER` views the dashboard sidebar
- **THEN** the sidebar SHALL NOT display any "管理" section or admin menu items

### Requirement: Admin menu items link to /dashboard/admin/* routes
All admin navigation links in the unified dashboard sidebar SHALL point to `/dashboard/admin/*` sub-routes, not to `/admin/*` routes.

#### Scenario: Content management link destination
- **WHEN** an ADMIN clicks "内容管理" in the sidebar
- **THEN** the browser SHALL navigate to `/dashboard/admin/content`

#### Scenario: Notion sync link destination
- **WHEN** an ADMIN clicks "Notion 同步" in the sidebar
- **THEN** the browser SHALL navigate to `/dashboard/admin/sync`

#### Scenario: Users management link destination
- **WHEN** an ADMIN clicks "用户管理" in the sidebar
- **THEN** the browser SHALL navigate to `/dashboard/admin/users`

#### Scenario: Skills management link destination
- **WHEN** an ADMIN clicks "技能管理" in the sidebar
- **THEN** the browser SHALL navigate to `/dashboard/admin/skills`

### Requirement: Login page redirects by role after authentication
After successful authentication, the login page SHALL redirect users to `/dashboard` regardless of role. The dashboard layout then handles role-specific rendering.

#### Scenario: ADMIN login redirect
- **WHEN** an ADMIN user successfully authenticates on `/login`
- **THEN** the system SHALL redirect to `/dashboard`
- **THEN** the sidebar SHALL display the admin section upon arrival

#### Scenario: USER login redirect
- **WHEN** a USER successfully authenticates on `/login`
- **THEN** the system SHALL redirect to `/dashboard`
- **THEN** the sidebar SHALL NOT display any admin section

### Requirement: Admin page routes protected at layout level
The `/dashboard/admin/*` routes SHALL check that the current user is ADMIN or EDITOR at the layout/page level, returning 403 or redirecting to `/dashboard` if not authorized.

#### Scenario: USER attempts to access admin content page
- **WHEN** a user with role `USER` navigates directly to `/dashboard/admin/content`
- **THEN** the system SHALL redirect to `/dashboard`

#### Scenario: EDITOR cannot access users or skills pages
- **WHEN** a user with role `EDITOR` navigates to `/dashboard/admin/users`
- **THEN** the system SHALL redirect to `/dashboard`
