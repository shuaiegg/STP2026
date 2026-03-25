## ADDED Requirements

### Requirement: Build targets modern evergreen browsers only
The production JavaScript bundle SHALL NOT include polyfills for ECMAScript features that are natively available in Chrome ≥ 92, Firefox ≥ 90, Safari ≥ 15, and Edge ≥ 92.

#### Scenario: No legacy polyfills in production bundle
- **WHEN** a Lighthouse audit runs the "Avoid serving legacy JavaScript to modern browsers" check against the production build
- **THEN** the audit passes with 0 KiB of unnecessary polyfills reported

#### Scenario: Specific polyfills are absent
- **WHEN** the production JS bundle is scanned for polyfill patterns
- **THEN** no polyfill implementations are found for: `Array.prototype.at`, `Array.prototype.flat`, `Array.prototype.flatMap`, `Object.fromEntries`, `Object.hasOwn`, `String.prototype.trimStart`, `String.prototype.trimEnd`, `Math.trunc`

### Requirement: Browserslist configuration is explicit and version-pinned
The project SHALL have an explicit `.browserslistrc` file at the repository root that defines the minimum supported browser versions for production and development environments.

#### Scenario: .browserslistrc exists and is valid
- **WHEN** `npx browserslist` is run in the project root
- **THEN** it outputs a list of browsers that includes only Chrome ≥ 92, Firefox ≥ 90, Safari ≥ 15, and Edge ≥ 92 (production section)

### Requirement: Build remains green after target change
The `next build` command SHALL complete without errors after the browserslist change is applied.

#### Scenario: Build succeeds with new browser target
- **WHEN** `npx prisma generate && next build` is run in CI
- **THEN** the build exits with code 0 and produces a valid `.next` output directory

#### Scenario: No missing CSS vendor prefixes cause visual regressions
- **WHEN** the production build is visually tested on Safari 15 and Chrome 92
- **THEN** all public pages render correctly with no broken layouts or missing styles
