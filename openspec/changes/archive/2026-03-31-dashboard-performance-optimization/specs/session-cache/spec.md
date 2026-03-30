## ADDED Requirements

### Requirement: Session cookie cache bypasses database on validation
The system SHALL cache session payload in an encrypted cookie so that subsequent requests within the cache window validate the session without querying the database.

#### Scenario: Authenticated request within cache window
- **WHEN** a user makes a dashboard request within 5 minutes of their last session validation
- **THEN** the system SHALL validate the session by decrypting the cookie without any database query

#### Scenario: Session cookie cache expiry forces DB re-validation
- **WHEN** a user makes a dashboard request more than 5 minutes after the last session validation
- **THEN** the system SHALL re-query the database to validate the session and refresh the cookie cache

#### Scenario: User logout clears cookie cache
- **WHEN** a user logs out
- **THEN** the session cookie SHALL be cleared and subsequent requests SHALL require fresh database validation
