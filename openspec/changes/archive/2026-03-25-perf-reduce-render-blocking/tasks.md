## 1. Modern JS Target — Remove Legacy Polyfills

- [x] 1.1 Create `.browserslistrc` at the project root with `[production]` targeting Chrome >= 92, Firefox >= 90, Safari >= 15, Edge >= 92 and `[development]` targeting the last 1 version of each
- [x] 1.2 Run `npx browserslist` to verify the resolved browser list matches the intended targets
- [x] 1.3 Run `next build` locally and confirm it exits with code 0
- [ ] 1.4 Run `npx lighthouse http://localhost:3000 --only-audits=legacy-javascript --output=json` (against `next start`) and confirm the legacy-javascript audit passes or shows 0 KiB waste
- [x] 1.5 Search the built `.next/static/chunks/` for the polyfill chunk (`867fc24a…js`) and verify the identified polyfills (Array.prototype.at etc.) are no longer present

## 2. CSS Render-Blocking — Install critters and Enable optimizeCss

- [x] 2.1 Install `critters` as a dev dependency: `npm install --save-dev critters`
- [x] 2.2 In `next.config.ts`, add `experimental: { optimizeCss: true }` to the `NextConfig` object
- [x] 2.3 Run `next build` locally and confirm it completes without errors (critters warnings about missing classes are acceptable)
- [x] 2.4 Run `next start` and open `/` — confirm the page renders correctly above the fold with no FOUC (flash of unstyled content)
- [x] 2.5 Visually check `/blog`, `/pricing`, and `/tools` for layout regressions after the build

## 3. Validate Critical Request Chain Reduction

- [ ] 3.1 Run `npx lighthouse http://localhost:3000 --only-audits=render-blocking-resources,critical-request-chains --output=json` and confirm render-blocking CSS is eliminated
- [ ] 3.2 Confirm the critical path delay for CSS is ≤ 200ms in the Lighthouse trace
- [ ] 3.3 Check the Lighthouse "Avoid chaining critical requests" audit — the CSS chain depth should be 1 (HTML → inlined critical CSS only)

## 4. Regression Check and CI Verification

- [x] 4.1 Run `npm run build` (the Vercel build command `npx prisma generate && next build`) and confirm exit code 0
- [x] 4.2 Run `npm run lint` and fix any new lint errors introduced by config changes
- [ ] 4.3 Test on Safari 15 (or Safari latest) — confirm no missing vendor-prefixed CSS causes layout breaks on public pages
- [ ] 4.4 Confirm the Vercel preview deployment builds successfully after pushing the changes
