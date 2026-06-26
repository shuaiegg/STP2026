# content-asset-blueprint Specification

## Purpose
TBD - created by archiving change content-asset-blueprint. Update Purpose after archive.
## Requirements
### Requirement: Growth Home presents a DNA-centric content asset blueprint
The Growth Home SHALL present a content asset blueprint built from the site's ideal topic map (business DNA), showing per-pillar coverage and proof signals, with competitor/search data as measurement aids rather than the primary driver.

#### Scenario: Blueprint pillars from DNA
- **WHEN** a site has an ontology with an ideal topic map and computed semantic debts
- **THEN** the blueprint MUST list the topic pillars with, per pillar, a coverage indicator (coverageScore) and an evidence/proof indicator (proofDensity)

#### Scenario: Search demand as measurement
- **WHEN** a demand signal is shown per pillar
- **THEN** demand MUST derive from search/GSC impressions, shown as a measurement column — not as the source of the pillar list (difficulty is out of MVP scope; see backlog)

### Requirement: Blueprint crowns a single next best action
The blueprint SHALL highlight exactly one "fastest next step" pillar to reduce overload.

#### Scenario: Crowned pillar
- **WHEN** the blueprint renders with eligible pillars
- **THEN** exactly one pillar MUST be crowned as the next best step (high demand × low coverage × low difficulty) with a single primary CTA

### Requirement: Blueprint activates proof density and logic chains
The blueprint SHALL consume the previously-unused `proofDensity` and `logicChains` signals.

#### Scenario: Evidence axis and proof action
- **WHEN** a pillar is covered but low on proof density
- **THEN** the blueprint MUST surface an evidence/proof gap and offer a "strengthen evidence" action

#### Scenario: Glass-box rationale
- **WHEN** a pillar is shown
- **THEN** a "why this matters" rationale MUST be available, derived from the pillar's `relevance` (logic chains MAY appear as site-level supplementary context, but per-pillar rationale MUST NOT depend on matching logic chains to topics)

### Requirement: Blueprint provides leading-indicator feedback
The blueprint SHALL foreground leading indicators the user controls, so progress is visible before rankings move.

#### Scenario: Content equity header
- **WHEN** the blueprint renders
- **THEN** it MUST show a content-equity measure (pillars covered out of total) and a period delta, plus an expectation-setting note that rankings take weeks

### Requirement: Blueprint converts to a content plan
The blueprint SHALL let the user turn gaps into a content plan in one step, bridging to the strategy board.

#### Scenario: One-click generate plan
- **WHEN** a user triggers "generate plan" from the blueprint
- **THEN** the system MUST create a `ContentPlan` from the underlying semantic debts (reusing the existing strategy generation) and make it available on the strategy board

### Requirement: Blueprint placement is stage-aware
The blueprint's prominence SHALL adapt to lifecycle stage.

#### Scenario: Cold start
- **WHEN** the site is at stage 0 / unmeasured (no GSC data)
- **THEN** the blueprint MUST be the primary surface on the Growth Home

#### Scenario: Data available
- **WHEN** the site has GSC performance data
- **THEN** the blueprint MUST remain present as a persistent section alongside the performance chart, rather than being removed

