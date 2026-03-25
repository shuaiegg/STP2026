## Context

PageSpeed identifies two independent performance problems on the public site:

**Problem A — Render-blocking CSS**
Next.js 16 with Tailwind v4 emits CSS as separate chunk files. Two chunks appear in the critical request chain:
- `6cfcdf47.css` (2.6 KiB, 437ms): loaded immediately
- `6329a32c.css` (25.4 KiB, 630ms → 1,083ms total): depends on the first chunk

Both block FCP because the browser cannot paint until they are fully downloaded and parsed. The 25 KiB chunk is likely the Tailwind utility output for the public pages.

**Problem B — Legacy JS polyfills**
Without an explicit `browserslist` target, Next.js / SWC defaults to a wide browser support range. This causes the build to emit polyfills for native methods that have been baseline-available in all modern browsers since 2020–2021:
- `Array.prototype.at` (Chrome 92, Firefox 90, Safari 15.4)
- `Array.prototype.flat / flatMap` (Chrome 69)
- `Object.fromEntries` (Chrome 73)
- `Object.hasOwn` (Chrome 93)
- `String.prototype.trimStart/trimEnd` (Chrome 66)
- `Math.trunc` (Chrome 38)

The project targets B2B SaaS users; IE and legacy Edge are not supported.

## Goals / Non-Goals

**Goals:**
- Remove render-blocking flag from PageSpeed for public pages (/, /blog, /pricing).
- Reduce JS transferred to modern browsers by ≥ 20 KiB.
- Shorten critical request chain depth from 3 hops to 1.
- Keep build green on Vercel (`npx prisma generate && next build`).

**Non-Goals:**
- Full CSS inlining / critical CSS extraction (fragile, not needed at this scale).
- Supporting IE11 or pre-Chromium Edge.
- Optimizing dashboard routes (authenticated, not indexed).
- Changing font loading strategy (already handled by `next/font`).

## Decisions

### 1. Browserslist: target ES2020+ evergreen browsers

**Decision**: Add `.browserslistrc` at the project root:
```
[production]
Chrome >= 92
Firefox >= 90
Safari >= 15
Edge >= 92

[development]
last 1 Chrome version
last 1 Firefox version
last 1 Safari version
```

**Rationale**: All the polyfilled methods (Array.at, Object.fromEntries, etc.) are natively available in Chrome/Firefox/Safari ≥ 2021 builds. Targeting ≥ Chrome 92 / Safari 15 eliminates every flagged polyfill. SWC and the Babel preset-env used by Next.js both respect `.browserslistrc`.

**Alternative considered**: Set `targets` in `next.config.ts` via `experimental.swcPlugins`. Rejected — `.browserslistrc` is the standard cross-tool mechanism; it also applies to any Babel transforms and PostCSS autoprefixer.

**Risk**: Users on very old browsers (< 1% of B2B SaaS traffic) may hit JS errors. Mitigation: add a `<noscript>` / `nomodule` fallback notice if analytics show > 0.5% legacy browser traffic.

### 2. CSS render-blocking: enable `experimental.optimizeCss`

**Decision**: Add `experimental: { optimizeCss: true }` to `next.config.ts`.

**Rationale**: Next.js 16's `optimizeCss` flag (backed by `critters`) inlines the critical CSS needed for above-the-fold content and loads the rest asynchronously. This directly removes the render-blocking classification. The chunk size (25 KiB) is within `critters`' default threshold.

**Alternative considered**: Manual `<link rel="preload" as="style" onLoad>` pattern in the root layout. Rejected — it requires maintaining a custom `<head>` and is fragile across Next.js upgrades. `optimizeCss` is the idiomatic solution.

**Alternative considered**: `experimental.cssChunking: 'loose'`. This reduces the number of CSS chunks but does not eliminate render-blocking; the remaining chunk is still parser-blocking.

**Dependency**: `optimizeCss` requires the `critters` npm package. Add `critters` as a `devDependency`.

**Risk**: `critters` inline extraction can occasionally miss above-the-fold classes on first load. Mitigation: test `/`, `/blog`, `/pricing` visually after build and adjust `critters` threshold if needed.

### 3. Validate with local Lighthouse run post-build

**Decision**: After applying both changes, run `next build && npx lighthouse http://localhost:3000 --only-audits=render-blocking-resources,legacy-javascript --output=json` locally to confirm the flags are cleared before deploying.

**Rationale**: PageSpeed scores can vary by network conditions; a local Lighthouse run on the production build gives a deterministic baseline.

## Risks / Trade-offs

- **`optimizeCss` is experimental** → Could be removed or change behavior in a Next.js patch. Mitigation: pin to current Next.js version; re-test on upgrade.
- **Browserslist change affects autoprefixer** → Some CSS vendor prefixes may be dropped. Mitigation: review `next build` output for CSS warnings; test on Safari 15.
- **`critters` adds ~1s to build time** → Acceptable for a Vercel-hosted build.
- **25 KiB CSS chunk may be Tailwind v4 JIT output** → If `optimizeCss` can't inline it all, residual non-critical CSS is loaded async, which may cause a brief FOUC on slower connections. Mitigation: ensure Tailwind purges unused classes (already configured via content glob).

## Open Questions

- Does the project use any CSS that specifically targets browsers below Chrome 92? (Check `globals.css` for `-webkit-` prefixes that would be dropped.) → Audit during implementation.
- Is `critters` already installed as a transitive dependency? → Check `node_modules` during Task 1.
