## ADDED Requirements

### Requirement: Semantic debt item expands inline on click
Clicking a semantic debt row in the OverviewPanel SHALL expand an inline detail section beneath that row. Clicking the same row again SHALL collapse it. The detail section SHALL display the debt topic, coverage score, and a call-to-action button to navigate to the strategy tab.

#### Scenario: Debt row expands on first click
- **WHEN** the user clicks a semantic debt row
- **THEN** an inline detail section appears below that row
- **THEN** the detail section shows the topic name and coverage score

#### Scenario: Debt row collapses on second click
- **WHEN** the user clicks the already-expanded debt row
- **THEN** the inline detail section collapses

#### Scenario: Only one debt row is expanded at a time
- **WHEN** the user clicks a second debt row while another is expanded
- **THEN** the first row collapses and the second row expands

### Requirement: Debt detail provides a strategy navigation action
The expanded detail section SHALL include a button labelled "去策略板查看" that navigates the user to the "strategy" tab via the `onSwitchTab` callback.

#### Scenario: Strategy navigation from debt detail
- **WHEN** the user clicks "去策略板查看" in an expanded debt detail
- **THEN** the active tab switches to "strategy"
