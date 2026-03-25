## Why

Recent performance testing on the production server (Next.js 16.1.6 with Turbopack) revealed a Largest Contentful Paint (LCP) of 6.2s, primarily caused by a 2,370ms element render delay for the hero `<h1>`. The previously implemented `experimental.optimizeCss` relies on `critters`, which is incompatible with the App Router + Turbopack architecture, leaving CSS resources render-blocking. Additionally, the hero typography's CSS animation introduces an artificial rendering delay. For our globally scalable SEO/SEM platform, optimizing LCP on public-facing acquisition pages (beginner audience) is critical for organic growth.

## What Changes

- Replace the ineffective `experimental.optimizeCss` with `experimental.inlineCss: true` in `next.config.ts`, generating inline `<style>` tags to eliminate the render-blocking CSS waterfall entirely.
- **BREAKING**: Remove the `animate-slide-in-up` and `stagger-1` classes from the hero `<h1>` element in `src/app/(public)/page.tsx` to ensure immediate LCP element visibility.
- Uninstall the unused `critters` devDependency.

## Capabilities

### New Capabilities

- `turbopack-inline-css`: Configuration to eliminate render-blocking CSS specifically for Next.js App Router applications building with Turbopack.
- `lcp-animation-prevention`: Guidelines for preventing artificial render delays on critical LCP elements like hero headings.

### Modified Capabilities

*(none)*

## Impact

- `next.config.ts` — Enables experimental inline CSS generation.
- `package.json` — Removes `critters` dependency.
- `src/app/(public)/page.tsx` — Modifies the presentation of the main headline (removes entrance animation).
- HTML document head size will marginally increase due to inlined styles, improving FCP/LCP at a slight cost to caching efficiency.
