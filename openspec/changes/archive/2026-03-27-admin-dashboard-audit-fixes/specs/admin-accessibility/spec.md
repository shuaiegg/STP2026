## ADDED Requirements

### Requirement: All search inputs have accessible labels
Search input elements in admin pages SHALL have an `aria-label` attribute describing their purpose. Visible `<label>` elements are preferred; `aria-label` is acceptable when a visible label would be redundant.

#### Scenario: Content management search input is labeled
- **WHEN** a screen reader focuses the search input on `/dashboard/admin/content`
- **THEN** it announces a meaningful label (e.g., "搜索文章或 Slug")

#### Scenario: User management search input is labeled
- **WHEN** a screen reader focuses the search input on `/dashboard/admin/users`
- **THEN** it announces a meaningful label (e.g., "搜索用户名或邮箱")

### Requirement: All icon-only buttons have accessible names
Buttons containing only an icon (no visible text) SHALL have an `aria-label` attribute. The `title` attribute alone is insufficient and MUST NOT be used as the sole accessible name.

#### Scenario: History toggle button is accessible
- **WHEN** a screen reader focuses the history icon button in the users table
- **THEN** it announces "查看积分记录" (not just the icon)

#### Scenario: Close button in transaction history panel is accessible
- **WHEN** a screen reader focuses the XCircle close button
- **THEN** it announces "关闭积分记录"

#### Scenario: Credit adjustment buttons are accessible
- **WHEN** a screen reader focuses the `+` credit button for a user
- **THEN** it announces "增加积分" with sufficient context

### Requirement: Dropdown menus close on Escape key
The site-switcher listbox and user-menu dropdown in TopNav SHALL close when the user presses the `Escape` key. Focus SHALL return to the trigger button after dismissal.

#### Scenario: Site switcher closes on Escape
- **WHEN** the site switcher dropdown is open and the user presses Escape
- **THEN** the dropdown closes and focus returns to the chevron trigger button

#### Scenario: User menu closes on Escape
- **WHEN** the user menu dropdown is open and the user presses Escape
- **THEN** the dropdown closes and focus returns to the avatar button

### Requirement: Active navigation links have aria-current="page"
Nav links in TopNav that match the current route SHALL have `aria-current="page"` applied. This is in addition to visual active styling.

#### Scenario: Active nav link is announced as current page
- **WHEN** a screen reader navigates to an active nav link (e.g., 内容库 while on `/dashboard/library`)
- **THEN** it announces the link as the current page

### Requirement: Table headers have scope attributes
All `<th>` elements in admin data tables SHALL have `scope="col"` to correctly associate headers with their columns.

#### Scenario: Content table headers are scoped
- **WHEN** a screen reader navigates the content management table
- **THEN** each column header is correctly associated with its data cells

#### Scenario: Users table headers are scoped
- **WHEN** a screen reader navigates the users management table
- **THEN** each column header is correctly associated with its data cells

### Requirement: User avatars use next/image
User avatar images in the users management table SHALL use the `next/image` `<Image>` component instead of native `<img>` tags.

#### Scenario: User avatar renders with next/image
- **WHEN** a user row with a profile image is rendered
- **THEN** the image element is rendered by the `next/image` Image component with `width={48}` and `height={48}`
