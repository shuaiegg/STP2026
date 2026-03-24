## ADDED Requirements

### Requirement: Domain-Input Confirmation Before Site Deletion
The system SHALL require users to manually type the target site's domain into an input field before the delete confirmation button becomes enabled, preventing accidental deletion.

#### Scenario: Opening delete confirmation for any site
- **WHEN** user hovers over a site item in the site selector dropdown and clicks the delete icon
- **THEN** a modal dialog SHALL appear showing the target domain and an empty text input, with the confirm button in a disabled state

#### Scenario: Confirm button activation
- **WHEN** the value in the confirmation input exactly matches the target site's domain (case-sensitive)
- **THEN** the confirm delete button SHALL become enabled

#### Scenario: Confirm button remains disabled on partial match
- **WHEN** the confirmation input contains a value that does not exactly match the target domain
- **THEN** the confirm delete button SHALL remain disabled and unclickable

#### Scenario: Successful deletion of active site
- **WHEN** user confirms deletion of the currently active site
- **THEN** the system SHALL delete the site, switch `activeSiteId` to the first remaining site in the list, and reset the galaxy map and all audit display states

#### Scenario: Successful deletion of non-active site
- **WHEN** user confirms deletion of a site that is not currently active
- **THEN** the system SHALL delete the site and remove it from the dropdown list without changing the active site or reloading the galaxy map

#### Scenario: Cancelling deletion
- **WHEN** user clicks cancel or closes the modal
- **THEN** the modal SHALL close, the confirmation input SHALL be cleared, and no deletion SHALL occur
