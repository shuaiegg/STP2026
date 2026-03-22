## ADDED Requirements

### Requirement: Pricing page presents value as credit quantity
The pricing page SHALL frame each pack's value in terms of what users can accomplish with that many credits, not as a list of unlocked features.

#### Scenario: No tier-specific feature lists
- **WHEN** a user views the pricing page
- **THEN** no pack shows features that differ from other packs — all tools are available to all credit holders equally

#### Scenario: Quantity-based value framing per pack
- **WHEN** a user views the 50-credit pack
- **THEN** the card communicates approximately how many StellarWriter articles or site audits can be completed (e.g., "可完成约 3 篇深度内容创作")

#### Scenario: Credit cost reference table is present
- **WHEN** a user views the pricing page below the pack grid
- **THEN** a credit cost reference table is displayed showing at minimum: StellarWriter (15 积分/篇) and 站点体检 (5 积分/次)

#### Scenario: All packs link to same features
- **WHEN** a user purchases any credit pack
- **THEN** they have access to all platform tools limited only by their credit balance
