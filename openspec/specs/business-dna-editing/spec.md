# business-dna-editing Specification

## Purpose
TBD - created by archiving change business-dna-governance. Update Purpose after archive.
## Requirements
### Requirement: Users can edit business DNA in a structured editor
The system SHALL let a user edit the site's business DNA fields (core offerings, target audience, pain points solved, ideal topic map) through a structured editor, and save the result as a new ontology version without re-running LLM extraction.

#### Scenario: Editing a DNA field and saving
- **WHEN** a user edits core offerings / target audience / pain points / ideal topic map and saves
- **THEN** the system MUST create a new `SiteOntology` version containing the edited values, without invoking LLM extraction

#### Scenario: Re-extract remains available
- **WHEN** a user chooses "let AI re-analyze"
- **THEN** the existing LLM extraction path MUST still run and produce a new version

### Requirement: Confirming DNA closes the coach loop
The system SHALL record when a user confirms their business DNA and SHALL use that signal to drive the `define_ontology` coach move.

#### Scenario: Confirm sets timestamp
- **WHEN** a user saves edits or explicitly confirms their DNA
- **THEN** `SiteOntology.confirmedAt` MUST be set

#### Scenario: Coach move reflects confirmation
- **WHEN** a site has an ontology but `confirmedAt` is null
- **THEN** the `define_ontology` move MUST still surface (prompting confirmation); once confirmed, it MUST no longer surface

### Requirement: Editing the ideal topic map refreshes downstream gaps
The system SHALL keep semantic-gap analysis consistent with edited DNA.

#### Scenario: Ideal topic map changed
- **WHEN** a save changes the ideal topic map
- **THEN** the system MUST recompute semantic debts for the new version (force refresh) and invalidate the coach-home cache so the blueprint/strategy read fresh gaps

#### Scenario: Non-topic-map edit
- **WHEN** a save changes only non-topic-map fields (e.g. target audience wording)
- **THEN** a full gap recompute is NOT required

