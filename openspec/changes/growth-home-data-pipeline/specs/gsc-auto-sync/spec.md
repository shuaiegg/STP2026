## ADDED Requirements

### Requirement: Selecting a GSC property triggers an initial data sync
When a user selects a Google Search Console property for a site, the system SHALL trigger an initial GSC data sync so keyword snapshot data begins populating without any further manual action.

#### Scenario: Property selection populates snapshots
- **WHEN** a user selects a GSC property via `POST /api/dashboard/sites/[siteId]/gsc/properties/select`
- **THEN** the system MUST initiate a GSC sync for that site (fire-and-forget), and `SiteKeywordSnapshot` rows MUST begin populating without the user visiting any other page or tab

#### Scenario: Sync failure does not block selection
- **WHEN** the triggered sync fails
- **THEN** the property selection MUST still succeed and return normally, and the failure MUST be logged rather than surfaced as a selection error

### Requirement: Stage classification reflects newly synced data
After an initial sync completes, the Growth Home stage and pulse SHALL reflect the freshly synced impressions rather than remaining at the empty-data defaults.

#### Scenario: Stage advances once impressions exist
- **WHEN** the initial sync has populated `SiteKeywordSnapshot` with non-zero impressions in the trailing window
- **THEN** `classifyStage` MUST read those impressions (no longer zero) when the Growth Home is next computed
