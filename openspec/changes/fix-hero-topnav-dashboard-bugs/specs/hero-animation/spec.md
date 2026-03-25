## ADDED Requirements

### Requirement: Hero content is visible on load
The homepage hero section SHALL render all text, badges, and CTA buttons in a fully visible state after their stagger animation completes. Elements SHALL NOT remain invisible after the page has loaded.

#### Scenario: Hero content visible after animation
- **WHEN** the homepage loads in a browser with animations enabled
- **THEN** all hero elements animate from opacity 0 to opacity 1 within 1 second of page load

#### Scenario: Hero content visible during animation delay
- **WHEN** a hero element has a stagger delay (e.g. stagger-1, stagger-2)
- **THEN** the element's pre-animation state (opacity 0, translateY 30px) is maintained during the delay period without requiring a separate `opacity-0` Tailwind class

#### Scenario: Hero content visible when animations are suppressed
- **WHEN** the browser has `prefers-reduced-motion: reduce` set
- **THEN** hero elements are still fully visible (opacity 1) and not hidden

### Requirement: Animation class governs full opacity lifecycle
The `.animate-slide-in-up` CSS class SHALL use `animation-fill-mode: both` so the keyframe's `from` state applies during the pre-delay period and the `to` state persists after completion. No separate `opacity-0` Tailwind utility SHALL be needed alongside this class.

#### Scenario: No duplicate opacity source
- **WHEN** `.animate-slide-in-up` is applied to an element
- **THEN** the element does not also carry the `opacity-0` Tailwind utility class
