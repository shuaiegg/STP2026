# activation-analytics Specification

## Purpose
TBD - created by archiving change activation-funnel-instrumentation. Update Purpose after archive.
## Requirements
### Requirement: First meaningful action is tracked once per user
The system SHALL emit a `first_meaningful_action_completed` PostHog event the first time a user successfully generates or publishes a piece of content, and SHALL NOT emit it again for subsequent actions by the same user.

#### Scenario: User generates their first article
- **WHEN** a user completes a content generation that produces a saved/streamed article for the first time
- **THEN** a `first_meaningful_action_completed` event MUST be emitted with `action_type='generated'`, a numeric `days_since_signup`, and `credits_spent`

#### Scenario: User publishes their first article
- **WHEN** a user publishes content for the first time and no prior meaningful action was recorded for that user
- **THEN** a `first_meaningful_action_completed` event MUST be emitted with `action_type='published'`

#### Scenario: Subsequent actions do not re-fire
- **WHEN** a user who already triggered `first_meaningful_action_completed` generates or publishes additional content
- **THEN** the event MUST NOT be emitted again

### Requirement: Dashboard returns are tracked with recency
The system SHALL emit a `dashboard_returned` event when a user lands on the Growth Home (`/dashboard`), carrying enough context to compute return-based retention.

#### Scenario: Returning user lands on Growth Home
- **WHEN** a user with an existing site enters `/dashboard`
- **THEN** a `dashboard_returned` event MUST be emitted with a numeric `days_since_signup`, an `is_return` boolean (true when `days_since_signup >= 1`), and `landing_surface='growth_home'`

### Requirement: Activation funnel events form an ordered sequence
The system SHALL emit events that together allow an ordered activation funnel to be constructed in analytics, from signup through first meaningful action to return.

#### Scenario: Funnel completeness
- **WHEN** a new user signs up, completes onboarding, views the coach moment, starts and completes a first action, then returns the next day
- **THEN** the events `onboarding_completed`, `first_coach_moment_viewed`, `first_action_started`, `first_meaningful_action_completed`, and `dashboard_returned` MUST each have been emitted, enabling a single funnel + retention view in PostHog

