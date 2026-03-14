## MODIFIED Requirements

### Requirement: Dashboard header role badge displays correct label for all roles
The role badge in the dashboard header SHALL display a distinct label for each of the three user roles: ADMIN, EDITOR, and USER. Displaying "普通用户" for EDITOR role is incorrect and SHALL be fixed.

#### Scenario: ADMIN role badge
- **WHEN** a user with role `ADMIN` is logged in
- **THEN** the header role badge SHALL display "管理员"

#### Scenario: EDITOR role badge
- **WHEN** a user with role `EDITOR` is logged in
- **THEN** the header role badge SHALL display "编辑员"

#### Scenario: USER role badge
- **WHEN** a user with role `USER` is logged in
- **THEN** the header role badge SHALL display "普通用户"
