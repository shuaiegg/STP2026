## Context

The primary acquisition page (`/`) currently suffers from a 6.2s Largest Contentful Paint (LCP) time (measured on mobile 4G simulation). The core issue is a 2,370ms element render delay for the hero `<h1>` element.

Investigation revealed two root causes:
1.  **Render-Blocking CSS in Turbopack:** The project uses Next.js 16.1.6 with the App Router and Turbopack. The previous optimization attempt relied on `experimental.optimizeCss` (backed by the `critters` library). However, `critters` only works with the older Pages Router and Webpack. Under Turbopack, CSS is bundled into JS chunks, bypassing `critters` entirely and remaining render-blocking.
2.  **Animation Delay:** The LCP element (the hero `<h1>`) uses the CSS class `animate-slide-in-up` with a `stagger-1` delay. The `animation-fill-mode: both` property keeps the element in its unrendered `from` state until the delay finishes, artificially prolonging the LCP timing.

## Goals / Non-Goals

**Goals:**
- Reduce LCP on the homepage to ≤ 2.5s on mobile networks.
- Eliminate the "render-blocking resources" penalty from Lighthouse.
- Ensure the hero headline is visible immediately upon first paint.

**Non-Goals:**
- Porting or fixing `critters` to work with Turbopack.
- Eliminating the Next.js framework polyfills (`Array.prototype.at`, etc.) which were previously conflated with SWC polyfills.
- Redesigning the hero section's visual layout.

## Decisions

### 1. Adopt `experimental.inlineCss` for App Router

**Decision:** Enable `experimental: { inlineCss: true }` in `next.config.ts` and remove `optimizeCss`.

**Rationale:** This is the Next.js 15+ native solution for mitigating render-blocking CSS in the App Router. It replaces external `<link>` stylesheet references with inline `<style>` tags in the HTML `<head>`. This guarantees the CSS is available when the HTML is parsed, eliminating the network waterfall that causes render-blocking.

**Alternative considered:** Manual critical CSS extraction and injection. Rejected as too complex to maintain with dynamic Next.js routes and Tailwind v4.

### 2. Remove Entrance Animations from LCP Elements

**Decision:** Remove the `animate-slide-in-up` and `stagger-1` classes from the hero `<h1>` in `src/app/(public)/page.tsx`.

**Rationale:** The hero headline is the definitive LCP element. Any CSS animation that delays its final painted state artificially worsens the LCP score. By removing the animation, the text renders immediately with the HTML and inlined CSS.

**Alternative considered:** Modifying the `slideInUp` keyframes to not use `opacity` or `transform` in the beginning. Rejected because `animation-fill-mode: both` still tells the browser the element isn't in its final state, which Lighthouse often penalizes. Stripping the animation on the primary text is the safest and most standard LCP optimization practice.

### 3. Uninstall `critters`

**Decision:** Run `npm uninstall critters`.

**Rationale:** Dead dependency removal. `critters` is incompatible with our build pipeline.

## Risks / Trade-offs

- **[Risk] Increased HTML payload size.** Inlining all CSS means the initial HTML document will be larger.
  - **Mitigation:** The Tailwind v4 output is already heavily purged and relatively small. The benefit of eliminating a render-blocking network request far outweighs the slight increase in Time to First Byte (TTFB).
- **[Risk] Reduced caching efficiency for repeat visits.** Since CSS is embedded in the HTML, it cannot be cached independently as a separate `.css` file for subsequent page loads.
  - **Mitigation:** Acceptable trade-off. Our primary goal is optimizing the *first-time* visitor experience (acquisition), where LCP is critical for SEO and bounce rates. Repeat visits are secondary for the public marketing pages.

## Migration Plan

1. Uninstall `critters`.
2. Update `next.config.ts`.
3. Modify `page.tsx` hero animation.
4. Deploy to Vercel and verify LCP via PageSpeed Insights against the production URL.
