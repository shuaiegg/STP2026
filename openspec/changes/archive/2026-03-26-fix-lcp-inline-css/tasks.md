## 1. Setup and Cleanup

- [x] 1.1 Uninstall `critters` devDependency: `npm uninstall critters`
- [x] 1.2 In `next.config.ts`, remove `optimizeCss: true` from the `experimental` object
- [x] 1.3 In `next.config.ts`, add `inlineCss: true` to the `experimental` object
- [x] 1.4 Run `next build` locally to verify the build completes successfully with the new configuration

## 2. Hero Component Rendering Optimization

- [x] 2.1 In `src/app/(public)/page.tsx`, locate the hero `<h1>` element (around line 307)
- [x] 2.2 Remove `animate-slide-in-up` and `stagger-1` classes from the `<h1>` element's `className`
- [x] 2.3 Run `next start` and open `http://localhost:3000` to visually confirm the hero text renders immediately without animation delay

## 3. Validation

- [x] 3.1 Run a local Lighthouse audit against `http://localhost:3000` and confirm the `render-blocking-resources` audit is clear for CSS
- [x] 3.2 Confirm in the Lighthouse trace that the LCP time for the hero `<h1>` has decreased
- [x] 3.3 Deploy to Vercel and verify the production URL in PageSpeed Insights shows LCP ≤ 2.5s and no render-blocking CSS
