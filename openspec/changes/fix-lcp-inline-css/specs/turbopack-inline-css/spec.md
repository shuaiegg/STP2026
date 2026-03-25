## ADDED Requirements

### Requirement: CSS is inlined for Turbopack builds
The application SHALL inline its CSS into the HTML document `<head>` when built with the Next.js App Router and Turbopack, circumventing the render-blocking external stylesheet waterfall.

#### Scenario: No external render-blocking stylesheets
- **WHEN** the production build (or preview deployment) is loaded by a browser
- **THEN** the initial HTML contains an inline `<style>` block encompassing the necessary CSS, and no `<link rel="stylesheet">` tags block the First Contentful Paint.

#### Scenario: Lighthouse performance improvement
- **WHEN** a Lighthouse performance audit runs against the production URL
- **THEN** the "Eliminate render-blocking resources" audit passes for CSS resources, contributing to an improved LCP.
