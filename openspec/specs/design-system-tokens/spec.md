## ADDED Requirements

### Requirement: Color tokens use professional SaaS palette
The design token system SHALL define a color palette based on black primary, sky blue accent, and amber secondary — replacing the Neo-Brutalism electric lime and hot coral palette.

#### Scenario: Primary accent token is sky blue
- **WHEN** a developer uses `var(--color-brand-secondary)` or the Tailwind class `text-brand-secondary`
- **THEN** the rendered color SHALL be `#00d4ff` (sky blue)

#### Scenario: Secondary accent token is amber
- **WHEN** a developer uses `var(--color-brand-accent)` or `text-brand-accent`
- **THEN** the rendered color SHALL be `#f59e0b` (amber)

#### Scenario: Success color is independent from brand accent
- **WHEN** a developer uses `var(--color-brand-success)` or `text-brand-success`
- **THEN** the rendered color SHALL be `#16a34a` (green-600) — distinct from `--color-brand-secondary`

#### Scenario: All interactive accent colors pass WCAG AA on white background
- **WHEN** `#00d4ff` is rendered as a background with dark text on white
- **THEN** the contrast ratio SHALL be ≥ 4.5:1 for normal text
- **WHEN** `#f59e0b` is used as a background with dark text
- **THEN** the contrast ratio SHALL be ≥ 4.5:1

### Requirement: Border-radius is unified to rounded-lg (8px)
The CSS variable `--radius` SHALL be set to `0.5rem`. All component-level border-radius overrides SHALL use `rounded-lg` as the default, `rounded-xl` for modals/dialogs only.

#### Scenario: Button uses rounded-lg
- **WHEN** a Button component renders with any variant
- **THEN** it SHALL have `border-radius: 0.5rem` (8px)

#### Scenario: Card uses rounded-lg
- **WHEN** a Card component renders
- **THEN** it SHALL have `border-radius: 0.5rem` — not `rounded-xl`

#### Scenario: Modal/dialog uses rounded-xl
- **WHEN** an AlertDialog or modal overlay renders
- **THEN** it SHALL use `rounded-xl` (0.75rem)

### Requirement: Typography uses Plus Jakarta Sans for display headings
The `--font-display` token SHALL reference `'Plus Jakarta Sans'` as the primary display font with `'Noto Sans SC'` as the CJK fallback.

#### Scenario: Heading font loads Plus Jakarta Sans
- **WHEN** a heading element (h1–h3) renders on any public page
- **THEN** the browser SHALL apply Plus Jakarta Sans if available, falling back to Noto Sans SC

#### Scenario: Plus Jakarta Sans is loaded from Google Fonts
- **WHEN** any public page loads
- **THEN** the document `<head>` SHALL contain a Google Fonts `<link>` that includes `Plus+Jakarta+Sans`
- **THEN** the document `<head>` SHALL NOT contain a `<link>` for `Syne`

### Requirement: Logo gradient is reserved for logo mark only
The gradient `linear-gradient(135deg, #00ff88, #00d4ff)` SHALL only appear on the logo mark element. No other UI element SHALL use this exact gradient.

#### Scenario: CTA buttons do not use logo gradient
- **WHEN** a primary CTA button renders
- **THEN** its background SHALL be `#00d4ff` (solid) or `#0a0a0a` (solid) — not a gradient

#### Scenario: Logo element uses logo gradient
- **WHEN** the MainLayout header renders
- **THEN** the "S" logo mark SHALL have a background using the `#00ff88 → #00d4ff` gradient
