## ADDED Requirements

### Requirement: LCP elements render immediately without artificial delays
Critical above-the-fold content, specifically the primary `<h1>` element (Hero text), SHALL NOT utilize CSS animations or transitions that delay its initial visual rendering (e.g., waiting for an `opacity` or `transform` delay to complete before becoming visible).

#### Scenario: Immediate text visibility on load
- **WHEN** the homepage is loaded
- **THEN** the hero headline ("让你的海外业务...") appears immediately upon the First Contentful Paint, without waiting for a stagger delay or entrance animation.

#### Scenario: No animation-fill-mode blocking
- **WHEN** the LCP element's CSS is evaluated
- **THEN** it does not contain `animation-fill-mode: both` combined with an `animation-delay` that would hold the element in an invisible or off-screen state.
