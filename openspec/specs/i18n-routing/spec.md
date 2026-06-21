## ADDED Requirements

### Requirement: Next-intl routing structure
The system SHALL route public pages under `[locale]` locale prefixes, with English at root `/` and Chinese at `/zh`.

#### Scenario: Visit English home page
- **WHEN** user visits `/`
- **THEN** system serves the English homepage with `<html lang="en">`

#### Scenario: Visit Chinese home page
- **WHEN** user visits `/zh`
- **THEN** system serves the Chinese homepage with `<html lang="zh-Hans">`

### Requirement: Language suggestion banner
The system SHALL display a suggestion banner if the browser preferred language differs from the page locale, without auto-redirecting.

#### Scenario: Chinese browser on English home page
- **WHEN** a user with browser language `zh-CN` visits `/` without cookie `NEXT_LOCALE`
- **THEN** system displays the language recommendation banner suggesting `/zh`
