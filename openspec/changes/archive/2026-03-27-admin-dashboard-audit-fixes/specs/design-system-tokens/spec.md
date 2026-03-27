## ADDED Requirements

### Requirement: brand-info token group defined in globals.css
The design system SHALL include a `brand-info` semantic token group for informational UI states (blue scale). These tokens SHALL be defined as CSS custom properties in `:root` and exposed via `@theme inline`.

Tokens required:
- `--brand-info`: `#3b82f6` (blue-500) — primary info color
- `--brand-info-hover`: `#2563eb` (blue-600)
- `--brand-info-muted`: `#eff6ff` (blue-50) — background/badge

#### Scenario: brand-info tokens available as Tailwind classes
- **WHEN** a component uses `bg-brand-info-muted text-brand-info`
- **THEN** it renders with the correct blue-scale values defined in `@theme inline`

### Requirement: brand-admin token group defined in globals.css
The design system SHALL include a `brand-admin` semantic token group for ADMIN role indicators (purple scale). These tokens SHALL be defined as CSS custom properties in `:root` and exposed via `@theme inline`.

Tokens required:
- `--brand-admin`: `#7c3aed` (violet-600) — admin accent
- `--brand-admin-muted`: `#f5f3ff` (violet-50) — background/badge
- `--brand-admin-border`: `#ede9fe` (violet-100) — border

#### Scenario: brand-admin tokens available as Tailwind classes
- **WHEN** the ADMIN role badge uses `text-brand-admin bg-brand-admin-muted border-brand-admin-border`
- **THEN** it renders with the correct violet-scale values

### Requirement: New tokens documented in rules/design.md
The `brand-info` and `brand-admin` token groups SHALL be added to the Token Reference table in `rules/design.md` with their CSS variable names, hex values, and intended use cases.

#### Scenario: Token reference is up to date
- **WHEN** a developer consults `rules/design.md` for available tokens
- **THEN** `brand-info` and `brand-admin` appear in the Token Reference table with usage guidance
