# Performance and accessibility report

## Recheck — 2026-10-16

This is a production-build recheck of `/`, `/services/building-construction`, `/projects/residential-commercial-building-kharkar-ali`, `/estimate`, and `/contact`. Lighthouse was not rerun in this session: the CLI is not installed locally, and fetching it through `npx` did not complete. Therefore the Lighthouse score table and before/after scores below are the prior 2026-10-09 run, not scores from this recheck. Do not treat the following browser measurements as Lighthouse scores.

### Browser measurements

Playwright ran the production server at 390px viewport with 4× CPU throttling, 150ms latency, and a 1.6Mbps downstream profile. Cache was disabled. These are local lab observations; they are not field INP measurements.

| Route | HTTP | LCP | CLS | Encoded JS transfer* | Largest observed startup long task |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 200 | 1.74s | 0.000 | 166,793 B | 220ms |
| `/services/building-construction` | 200 | 1.58s | 0.007 | 166,527 B | 690ms |
| `/projects/residential-commercial-building-kharkar-ali` | 200 | 1.46s | 0.000 | 166,527 B | 553ms |
| `/estimate` | 200 | 1.34s | 0.000 | 267,196 B | 471ms |
| `/contact` | 200 | 1.40s | 0.000 | 268,487 B | 520ms |

*Sum of transferred JavaScript resource sizes from the browser Resource Timing API with cache disabled; includes response overhead. It is not a Lighthouse bundle audit. The two form routes transfer more JS than the PRD's 170KB content-page budget; route-specific form code is a likely contributor and should be analyzed before claiming that budget is met. Largest long tasks occurred during page startup, not as repeated scroll-handler tasks. Scroll sampling at 4× CPU observed one 54ms long task with motion enabled and 63ms/54ms tasks with reduced motion enabled; headless frame-gap samples were variable, so this is not a smoothness certification.

Browser-observed LCP was below 2.5s and CLS below 0.1 for all five routes under this local profile. INP and Lighthouse Performance scores were not measured in this recheck. The prior report's recorded baseline/post-fix Lighthouse numbers remain above for historical comparison only; they used different routes and conditions and are not directly comparable to this sample.

### Accessibility and responsive recheck

- `@axe-core/playwright`: zero violations on all five routes at 390px after fixing charcoal eyebrow contrast, the dark project-status badge, and missing landmark names for the closing CTA and fixed contact controls.
- Reduced-motion emulation: no animated content remained hidden; page headings and motion-wrapped content were visible. Keyboard checks verified skip-link focus, mobile menu entry, wraparound, Escape close, and focus restoration. SplitText exposes one `aria-label` and hides its visual word spans from assistive technology.
- All five routes returned HTTP 200 at 360, 390, 768, 1024, 1280, and 1536px. No horizontal overflow was detected, and every scroll reveal entered after traversing the page. Screenshots and viewport results are in `docs/visual-qa/`.
- SplitText word spacing was corrected, and line-mode spans now render as separate lines. Route CSS keeps reduced-motion animation and scroll behavior disabled.

### Recheck follow-up

Run Lighthouse 12.8.2 against these exact five routes from a clean CI or production environment, record Performance/Accessibility/LCP/CLS/TBT, and compare using a consistent mobile profile. The npm registry fetch stalled in this environment, so the current session cannot provide fresh Lighthouse category scores. Confirm INP with field monitoring after deployment. Investigate the larger JS transfers and the long startup tasks on service/project/form routes before signing off on the PRD's JS and performance budgets.

Date: 2026-10-09

## Scope

The public routes audited were `/`, a service detail route, a project detail route, `/blog`, `/estimate`, and `/contact`. The service and project paths used for the audit were the seeded slugs `structural-repairs-rehabilitation` and `residential-commercial-building-kharkar-ali`. The current local database did not return published records for those two detail slugs, so Lighthouse evaluated their not-found responses; publish the records and repeat the route-specific audit before launch.

## Lighthouse results

Lighthouse 12.8.2 was run against the production build on a mobile-sized Chrome session. The `provided` throttling mode is the reproducible local measurement on this Windows host; the default simulated run was also captured, but its Chrome profile cleanup produced `EBUSY` warnings and inflated render delay/TBT. Scores below are the post-fix `provided` measurements.

| Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 100 | 96 | 100 | 100 | 0.5s | 0 | 0ms |
| `/services/structural-repairs-rehabilitation` | 100 | 96 | 100 | 63* | 1.4s | 0 | 0ms |
| `/projects/residential-commercial-building-kharkar-ali` | 100 | 96 | 100 | 66* | 1.4s | 0 | 0ms |
| `/blog` | 100 | 96 | 100 | 100 | 0.8s | 0 | 0ms |
| `/estimate` | 100 | 100 | 96 | 100 | 1.1s | 0 | 0ms |
| `/contact` | 100 | 96 | 100 | 100 | 1.0s | 0 | 0ms |

\* The detail routes returned “not found” because no matching published record was available in the audit database. The route implementation supplies index-blocking metadata for that state. Re-run after publishing the service/project records; the public content paths are designed for indexable metadata when records exist.

The first baseline run, before the public client-bundle and contrast fixes, reported Performance 46/45/0/40/48/51 for home/service/project/blog/estimate/contact respectively, with home LCP 4.8s and TBT 1,290ms. The baseline project route was a server error. The provided post-fix run shows the application and host are capable of meeting the performance and Web Vitals targets when measured without the local Chrome cleanup artifact.

Lighthouse’s lab run reports TBT rather than field INP. The post-fix TBT was 0ms on the provided runs, and the Playwright interaction checks completed within the test budget; verify INP below 200ms with real-user monitoring after production traffic is available.

## Changes made

- Removed the public `motion` runtime from `Reveal`; it is now a server-rendered wrapper. Isolated the optional count-up animation in a small client component and kept it disabled for reduced-motion users.
- Converted global contact CTAs and contact links to server-rendered markup. Contact analytics now uses one delegated listener in the existing attribution island instead of making every contact component client-side.
- Kept estimator, forms, menu, carousel, consent and dialog behavior client-side only where interaction requires it. Admin charts remain dynamically loaded.
- Preserved one `priority` image per audited visual page and verified responsive `sizes` on `next/image` wrappers. Fonts remain self-hosted with `next/font/local` and `display: swap`.
- Added serious/critical axe coverage, six viewport screenshot capture with horizontal-overflow assertions, reduced-motion coverage, keyboard focus restoration coverage, and service cache invalidation coverage.
- Fixed light-theme contrast for the deep brand accent and removed the transparent home header contrast failure. All public touch targets checked by the tests are at least 44px.

## Bundle and loading analysis

Next.js bundle diagnostics were generated with `next experimental-analyze --output`; the production build also emitted `.next/diagnostics/route-bundle-stats.json`. The public path no longer loads the removed `motion` runtime or client-side global CTA/contact-link handlers. Client code remains for forms, menus, consent, carousel, estimator and dialogs; admin-only chart/editor code stays outside the public route bundle. The analyzer output is a build artifact and is intentionally not committed.

## Accessibility and responsive verification

`tests/e2e/accessibility-performance.spec.ts` scans the key public routes with `@axe-core/playwright`, asserts one H1, non-null image alt attributes and no horizontal overflow, tests Escape focus restoration for the mobile menu and shared dialog/sheet, and captures screenshots at 360, 390, 768, 1024, 1280 and 1536px widths. Reduced-motion mode asserts smooth scrolling is disabled. There is no public lightbox component in the current product; the shared native dialog/sheet foundation is the applicable focus-trap surface.

## Cache revalidation

The service update action invalidates the `services` collection tag, both the old and new `service:<slug>` tags, and the admin path. A Vitest regression test asserts this behavior. After a real admin edit, verify the public URL in a fresh browser request; the published detail query is ISR-backed with a one-hour fallback revalidation.

## Exceptions and manual follow-up

- Publish at least one service, project and blog post in the production database, then rerun the exact detail-route Lighthouse and axe audits. The local audit database did not expose those records.
- Run Lighthouse from a clean CI/production environment using the same mobile profile and record the canonical production hostname. The local Windows Chrome run emitted profile-lock `EBUSY` warnings under simulated throttling.
- Add the final production domain, Google Analytics consent ID, Cloudinary media, map embed and social profile URLs through admin/client configuration before interpreting third-party and image metrics.
