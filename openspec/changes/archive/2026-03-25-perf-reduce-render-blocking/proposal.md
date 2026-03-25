## Why

Google PageSpeed Insights reports a critical path delay of **1,083ms** caused by two render-blocking CSS chunks, and flags **22 KiB** of unnecessary legacy JavaScript polyfills (Array.at, Object.fromEntries, Math.trunc, etc.) that are never needed by modern browsers. Combined, these issues push FCP and LCP scores down and directly hurt organic acquisition for a platform whose primary audience arrives via search.

## What Changes

- **Defer non-critical CSS**: Configure Next.js to prevent the two largest CSS chunks (`6329a32c…css` 25.4 KiB, `6cfcdf47…css` 2.6 KiB) from blocking initial render. Leverage `next/font` inline critical styles and mark secondary chunks as `preload` + async swap where possible.
- **Remove legacy JS polyfills**: Add a `.browserslistrc` targeting modern evergreen browsers so Next.js / SWC / Babel stop emitting polyfills for `Array.prototype.at`, `Array.prototype.flat`, `Array.prototype.flatMap`, `Object.fromEntries`, `Object.hasOwn`, `String.prototype.trimEnd/trimStart`, and `Math.trunc`. Estimated saving: **22 KiB** of transferred JS.
- **Shorten critical request chain**: Reduce the 3-hop CSS dependency chain (HTML → `6cfcdf47.css` → `6329a32c.css`) to at most 1 hop by inlining or preloading the first-party critical styles.

## Capabilities

### New Capabilities

- `css-render-blocking-prevention`: Strategy and configuration to prevent CSS chunks from blocking FCP/LCP on public pages.
- `modern-js-target`: Browserslist + build configuration that targets ES2020+ browsers, eliminating unnecessary polyfill bundles.

### Modified Capabilities

*(none — no existing spec-level requirements change)*

## Impact

- `next.config.ts` — may add `experimental.optimizeCss`, `experimental.cssChunking`, or custom webpack config
- `.browserslistrc` (new file) — sets browser target for SWC/Babel transpilation
- `vercel.json` (if exists) / build pipeline — ensure `npx prisma generate && next build` still passes after target change
- No database changes, no auth changes, no API changes
- **Risk**: Lowering browser targets could break CSS vendor-prefix fallbacks for very old browsers — acceptable given the B2B SaaS audience profile
- **Measurable goal**: Eliminate render-blocking flag in PageSpeed; reduce critical path delay from 1,083ms to < 200ms; reduce JS bundle by ≥ 20 KiB
