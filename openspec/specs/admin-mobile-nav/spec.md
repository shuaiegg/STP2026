## ADDED Requirements

### Requirement: TopNav provides mobile navigation for hidden center links
On viewports narrower than `md` (768px), the center navigation links (内容库, 工具箱, 积分) are hidden. TopNav SHALL render a hamburger button at `< md` that opens a full-height drawer containing all nav links. Admin links SHALL also appear in the drawer for ADMIN/EDITOR users.

#### Scenario: Hamburger button visible on mobile
- **WHEN** TopNav is rendered on a viewport narrower than 768px
- **THEN** a hamburger (Menu icon) button is visible in the nav bar

#### Scenario: Drawer opens on hamburger tap
- **WHEN** a mobile user taps the hamburger button
- **THEN** a full-height left-side drawer slides in containing all nav links and admin links (for eligible roles)

#### Scenario: Drawer closes on Escape key
- **WHEN** the mobile drawer is open and the user presses Escape
- **THEN** the drawer closes and focus returns to the hamburger button

#### Scenario: Drawer closes on overlay click
- **WHEN** the mobile drawer is open and the user clicks the semi-transparent backdrop
- **THEN** the drawer closes

#### Scenario: Drawer closes on nav link click
- **WHEN** a user taps a navigation link inside the drawer
- **THEN** the drawer closes and the user is navigated to the selected route

#### Scenario: Hamburger button hidden on desktop
- **WHEN** TopNav is rendered on a viewport wider than 768px
- **THEN** the hamburger button is not visible (`hidden md:hidden` or equivalent)

### Requirement: Mobile user table actions are touch-accessible
User management table action controls (credit adjustment, impersonate) SHALL be accessible on touch devices. The `opacity-0 group-hover:opacity-100` pattern SHALL be replaced with a persistently visible kebab menu button.

#### Scenario: Kebab menu button always visible
- **WHEN** the users table renders on any viewport
- **THEN** each row has a `MoreVertical` kebab button that is always visible (not hidden behind hover state)

#### Scenario: Kebab menu opens action list
- **WHEN** a user taps/clicks the kebab button on a user row
- **THEN** a small dropdown appears with "调整积分" and "代理登录" options

#### Scenario: Credit input accessible from kebab menu
- **WHEN** a user selects "调整积分" from the kebab menu
- **THEN** a number input and +/− buttons are revealed for that row
