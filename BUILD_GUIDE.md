# BUILD GUIDE — Vakratund Construction Website with Codex / Antigravity

A phase-by-phase playbook. Each phase has a **copy-paste prompt**, a **verification checklist** and a **commit message**.
You stay in control: the agent builds one phase, you verify, then you continue.

---

## 0. How to use this pack

### 0.1 Files and where they go
```
vakratund-web/                 <- your repo root
├─ AGENTS.md                   <- from this pack (root)
├─ BUILD_GUIDE.md              <- this file (optional to keep in repo)
└─ docs/
   ├─ PRD.md  ARCHITECTURE.md  DATABASE.md  DESIGN.md
   ├─ CODING_STANDARDS.md  SECURITY.md  CONTENT.md
   └─ adr/                     <- agent writes decisions here
```

### 0.2 Accounts you need before Phase 4+
| Service | Used for | When |
|---|---|---|
| GitHub | repo, CI | Phase 0 |
| Neon | PostgreSQL | Phase 4 |
| Cloudinary | media | Phase 7 |
| Resend | email | Phase 17 |
| Upstash (optional but recommended) | rate limiting | Phase 19 |
| Cloudflare Turnstile (optional) | bot protection | Phase 19 |
| Vercel | hosting | Phase 22 |
| Domain registrar access | DNS | Phase 22 |

### 0.3 Using Codex (CLI / IDE / cloud)
1. Install and sign in per the current OpenAI Codex docs; open the repo folder.
2. Codex automatically reads `AGENTS.md` at the repo root. Confirm by asking: *"Summarize the rules in AGENTS.md."*
3. Run **one phase prompt per session/task**. Prefer an approval mode where you review commands and edits (not fully autonomous) while the project is new.
4. After each phase: run the checks yourself, review `git diff`, commit.

### 0.4 Using Antigravity
1. Open the repo as a workspace. Put the `AGENTS.md` contents into the workspace rules (check Antigravity's current docs for where rules live) and keep `docs/` in the repo.
2. Use **Planning mode** for each phase: let the agent produce a plan/task list first, **read it**, then approve execution.
3. Keep agent autonomy for the terminal limited (review/approve commands that install packages, touch env files or run migrations).
4. Use the same phase prompts below; start each in a **fresh conversation** so context stays small and the agent re-reads the docs.

### 0.5 Golden rules for working with AI agents
1. **One phase = one session = one commit (or a few).** Don't chain phases.
2. **Start every session** with the *Session Starter* below so the agent re-reads the docs.
3. **Never paste real secrets** into the chat. Put them in `.env.local` yourself; tell the agent only variable names.
4. **You** create third-party accounts and run production migrations/deployments; let the agent prepare scripts and instructions.
5. **Verify with commands, not trust:** `npm run typecheck && npm run lint && npm run test && npm run build`.
6. If the agent drifts (adds libraries, skips validation, puts logic in components), paste the **Correction Prompt** below.
7. Keep a running list of `TODO(client)` items; send it to the client weekly.

### 0.6 Session Starter (paste at the beginning of EVERY session)
```text
You are working on the Vakratund Construction website. Before doing anything:
1. Read AGENTS.md and docs/PRD.md, docs/ARCHITECTURE.md, docs/DATABASE.md, docs/CODING_STANDARDS.md,
   docs/SECURITY.md, docs/DESIGN.md, docs/CONTENT.md.
2. Inspect the current repo state (git status, package.json, folder structure) and tell me in 5-8 lines
   what exists and what is missing for the phase I'm about to give you.
3. Do NOT start coding until I send the phase prompt. Do not modify files in this step.
```

### 0.7 Correction Prompt (use when the agent drifts)
```text
Stop. Re-read AGENTS.md and docs/CODING_STANDARDS.md. Your last change violated: <describe>.
Fix it so that: server-side validation + authorization are present, no business logic lives in UI components,
no new dependency is added without justification, and typecheck/lint/test/build pass.
Show me a short summary of what you changed.
```

---

## Phase 0 — Repository & documentation setup
**Goal:** repo ready, docs in place, CI skeleton.

**You do:** create a GitHub repo, copy `AGENTS.md` and `docs/` into the project (after `create-next-app` from Step 1 of our guide, or let the agent scaffold in Phase 1).

**Prompt**
```text
PHASE 0 — Repository setup.
Tasks:
1. Ensure the repo has AGENTS.md at root and the docs/ folder with the 7 docs. Create docs/adr/ with a README explaining the ADR format (Context, Decision, Consequences, Status).
2. Create docs/RUNBOOK.md skeleton (sections: local setup, env vars, migrations, deploy, rollback, backups/restore, incident steps).
3. Add .editorconfig, .nvmrc (Node LTS compatible with the installed Next.js), and a PR template at .github/pull_request_template.md that mirrors the Definition of Done in docs/CODING_STANDARDS.md.
4. Add a GitHub Actions workflow .github/workflows/ci.yml that runs on PRs and main: npm ci, typecheck, lint, test (if present), build, and npm audit --omit=dev (non-blocking warning).
5. Update README.md with project overview, prerequisites, setup steps, and links to the docs.
Constraints: no application code yet; no new runtime dependencies.
Done when: CI file is valid, README is accurate, docs are committed.
```
**Verify:** repo has all files; CI appears on GitHub. **Commit:** `chore: add project docs, CI and repo conventions`

---

## Phase 1 — Project scaffold & tooling
**Prompt**
```text
PHASE 1 — Scaffold and tooling.
If a Next.js app already exists, verify it instead of recreating. Otherwise create it with the latest stable Next.js: TypeScript, App Router, Tailwind CSS, ESLint, src/ directory, import alias "@/*", npm.
Tasks:
1. tsconfig: strict true, noUncheckedIndexedAccess true, noImplicitOverride true, forceConsistentCasingInFileNames true.
2. Create the folder structure from docs/ARCHITECTURE.md section 5 (with .gitkeep where empty).
3. Add scripts: typecheck, test, test:e2e, db:migrate, db:seed (stubs allowed until later phases).
4. Install and configure ONLY: zod, clsx, tailwind-merge, class-variance-authority, lucide-react; dev: vitest, @vitest/coverage-v8, @testing-library/react, jsdom, prettier, prettier-plugin-tailwindcss, eslint-plugin-jsx-a11y (if not included).
5. Create src/lib/env.ts using Zod that validates env vars listed in docs/ARCHITECTURE.md section 11; required vars must be required only in production or when the related feature is enabled; export a typed `env`.
6. Create .env.example with every variable (empty values) and comments.
7. Add GET /api/health returning { status, time } (no secrets, no DB yet).
8. Create src/lib/utils.ts with cn(), slugify(), normalizeIndianPhone() (+ unit tests).
Constraints: no UI beyond a minimal placeholder home; no DB code yet.
Done when: typecheck, lint, test, build pass; /api/health works.
```
**Verify:** `npm run dev` → `/api/health` OK; `npm run test` passes. **Commit:** `chore: scaffold Next.js app with strict TS and tooling`

---

## Phase 2 — Design system & UI primitives
**Prompt**
```text
PHASE 2 — Design tokens and UI primitives per docs/DESIGN.md.
Tasks:
1. Implement color/spacing/radius/shadow tokens as CSS variables (light + dark) in globals.css and map them in Tailwind (v4 @theme or v3 config, whichever the installed version uses) so classes like bg-surface, text-ink, border-line, bg-brand, text-brand-deep work.
2. Load Sora (headings) and Inter (body) via next/font with display swap; set fluid type scale.
3. Build accessible primitives in src/components/ui: Button (variants/sizes/loading), Input, Textarea, Select, Checkbox, Radio, Switch, FormField, Badge, Card, Accordion, Dialog, Sheet, Tabs, Tooltip, Toast, Skeleton, EmptyState, ErrorState, Pagination, Breadcrumbs, Container, SectionHeading, Stat, Stepper.
   Prefer native elements and small headless patterns; if a headless library is needed (e.g., Radix primitives) justify in an ADR and add only the packages used.
4. Create /design-system (dev-only, noindex, excluded in production) page showing every component and state (default, hover, focus, disabled, loading, error) in light and dark.
5. Add motion utilities (Reveal, CountUp) using the `motion` library, honoring prefers-reduced-motion.
Constraints: no hard-coded hex in components; every component keyboard accessible; focus-visible ring using brand-deep.
Done when: design-system page renders all components, passes axe checks manually via browser tools, and build passes.
```
**Verify:** open `/design-system` on mobile + desktop widths; tab through components. **Commit:** `feat(ui): design tokens and component primitives`

---

## Phase 3 — Database: Neon + Prisma
**You do first:** create a Neon project; copy **pooled** and **direct** connection strings into `.env.local` as `DATABASE_URL` and `DIRECT_URL` (don't paste them in chat).

**Prompt**
```text
PHASE 3 — Prisma + Neon.
Tasks:
1. Install Prisma (follow the CURRENT official docs for the installed major version, including the recommended Neon driver/adapter setup and generator config). Add Prisma client singleton in src/lib/db/client.ts safe for Next.js dev hot reload and serverless.
2. Implement the schema from docs/DATABASE.md in prisma/schema.prisma (you may refine names/types; record any deviation in docs/adr/002-schema-deviations.md). Include all enums, indexes and relations. Leave auth tables to Phase 4 but keep the User model with role and isActive.
3. Create the initial migration and apply it to my Neon dev database via DIRECT_URL.
4. Create prisma/seed.ts (idempotent, uses upsert) seeding: SiteSetting, 11 Services, 4 TeamMembers, credentials, 6 Projects (DRAFT, showClientName=false), ≥12 FAQs, PageSection defaults for home and about, LocationZones, and Estimator services with PLACEHOLDER rates as described in docs/DATABASE.md §5 and docs/CONTENT.md. Do NOT create users yet.
5. Add npm scripts: db:generate, db:migrate, db:deploy, db:seed, db:studio, db:reset (dev only, with a guard against running in production).
6. Add src/server/services/health.ts and extend /api/health with an optional ?deep=1 DB ping (admin-only later; for now return only ok/fail).
Constraints: no raw SQL; no secrets committed; seed must be re-runnable without duplicates.
Done when: migration applied, seed runs twice without errors, Prisma Studio shows data, typecheck/build pass.
```
**Verify:** `npm run db:seed` twice; open `npx prisma studio`. **Commit:** `feat(db): prisma schema, migrations and seed`

---

## Phase 4 — Authentication & RBAC
**Prompt**
```text
PHASE 4 — Authentication and authorization per docs/SECURITY.md §2–3 and docs/ARCHITECTURE.md §8.
Tasks:
1. Write docs/adr/001-auth-library.md. Use Better Auth with the Prisma adapter and email+password, DB sessions. Verify against its current docs. If it cannot satisfy the requirements (no public sign-up, role field, session revocation), choose Auth.js and explain.
2. Merge auth tables into schema.prisma (keep User.role, User.isActive) and migrate.
3. Disable public sign-up. Create a seed step that creates the first SUPER_ADMIN from SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars only if no users exist, and sets a "must change password" flag.
4. Implement src/config/permissions.ts (permission map from SECURITY.md §3), can(), requirePermission(), requireRole(), getSession() helpers; unit-test the matrix.
5. Build /admin/login (accessible form, generic error messages, loading state), logout, change-password, forgot/reset password (email sending can be a stub logging to console in dev; real email in Phase 17).
6. Protect /admin/(protected) in the layout using server-side session check; add request interception (proxy.ts or middleware.ts depending on installed Next.js version) only as a cheap redirect for unauthenticated users. All Server Actions/handlers must still call requirePermission.
7. Login rate limiting: implement a pluggable limiter interface in src/lib/rate-limit with an in-memory implementation for dev (Upstash comes in Phase 19). Apply 5 attempts/15 min per IP+email.
8. Prevent removing/demoting the last active SUPER_ADMIN (service-level guard + test).
9. Add noindex + no-store headers for /admin.
Constraints: never log passwords/hashes; sessions via HttpOnly Secure SameSite cookies.
Done when: login/logout works; unauthenticated /admin redirects; permission unit tests pass; build passes.
```
**Verify:** try wrong password 6×; try opening `/admin` logged out; try role limits (create test users). **Commit:** `feat(auth): admin authentication and RBAC`

---

## Phase 5 — Admin shell & dashboard
**Prompt**
```text
PHASE 5 — Admin shell and dashboard per docs/DESIGN.md §11 and docs/PRD.md ADM-1.
Tasks:
1. Admin layout: responsive sidebar (drawer on mobile), top bar with user menu, breadcrumbs, navigation filtered by role permissions.
2. Reusable admin building blocks: DataTable (server-driven pagination, sort, search, filters via URL search params), PageHeader, SaveBar (dirty state), ConfirmDialog, StatusBadge, EmptyState, TableSkeleton.
3. Dashboard page: KPI cards (new leads today/7d/30d, conversion rate, quotes count, estimated value range sum), leads by day (line chart), leads by status (bar), leads by source/page, recent leads list, quick actions. Charts via Recharts, dynamically imported client components.
4. Role-aware dashboard (EDITOR sees content stats instead of lead data).
5. Create src/server/services/activity.ts with logActivity() and use it for login/logout events; create /admin/activity page (read-only table with filters) for SUPER_ADMIN/ADMIN.
6. Loading/error/empty states for every page.
Constraints: queries aggregate in the DB (groupBy / SQL via Prisma API), not in JS over full tables; all pages call requirePermission.
Done when: dashboard renders with seed data (empty states if no leads), activity log visible, mobile layout usable.
```
**Commit:** `feat(admin): shell, dashboard and activity log`

---

## Phase 6 — Cloudinary media library
**You do first:** create Cloudinary account/product environment; add `CLOUDINARY_*` and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` to `.env.local`.

**Prompt**
```text
PHASE 6 — Media per docs/SECURITY.md §7 and docs/ARCHITECTURE.md §6.3.
Tasks:
1. Server helper src/lib/cloudinary (server-only) for signing upload params; endpoint POST /api/upload/sign: requires permission media:write, validates requested folder against an allowlist, sets allowed_formats and short-lived timestamp.
2. Admin Media Library (/admin/media): grid + list, drag-and-drop multi-upload with progress, direct-to-Cloudinary upload, mandatory alt text before saving, caption, folder filter, search, delete with usage check (block when referenced), copy URL.
3. Reusable <MediaPicker/> (single and multi select) for use in all CMS forms.
4. Public image component <CloudImage/> wrapping next/image with a Cloudinary loader (f_auto,q_auto, responsive widths, blur placeholder), plus configuration in next.config for allowed remote patterns.
5. Validate on the server after upload (Server Action saveMediaAsset): publicId, format, bytes, dimensions with Zod; reject disallowed formats/sizes.
6. Activity logging for upload/delete.
Constraints: API secret never reaches client; max sizes per SECURITY.md; no unsigned uploads.
Done when: I can upload JPG/PNG/WebP, set alt, see it in library, and attach it via MediaPicker in a test page; wrong type/oversize is rejected.
```
**Commit:** `feat(media): cloudinary uploads and media library`

---

## Phase 7 — CMS modules
Run this phase as **several sub-prompts** (7a–7e). Start each with the Session Starter.

**7a — Shared CMS foundation + Services**
```text
PHASE 7a — CMS foundation and Services module.
Tasks:
1. Create a repeatable CMS pattern: Zod schema (src/lib/validation) → service (src/server/services) → Server Actions (create/update/delete/reorder/togglePublish) → admin pages (list, create, edit) → cache invalidation tags per docs/ARCHITECTURE.md §3 → activity log. Document the pattern in docs/CODING_STANDARDS.md appendix "CMS module recipe".
2. Implement Services CRUD: title, slug (auto + editable, unique check), short description, Markdown description with preview, scope bullets (repeatable), icon picker (lucide key), cover (MediaPicker), featured, status, order (drag or up/down), SEO fields with character counters and SERP preview.
3. Markdown rendering pipeline with sanitization (no raw HTML) in src/lib/markdown; unit-test with XSS payloads.
Done when: I can create/edit/reorder/publish a service and changes revalidate cache tags; tests for slug uniqueness and sanitization pass.
```
**7b — Projects + Gallery**
```text
PHASE 7b — Projects and Gallery modules using the recipe from 7a.
Projects: all fields in docs/DATABASE.md (service relation, location, area, floors text, scope, year, status, progress %, showClientName toggle default off, featured, publish status, SEO), media attach with cover/before/after flags and drag ordering. Publishing rules from DATABASE.md §4 enforced in the service layer.
Gallery: items from MediaAsset with category, title, order, visibility; bulk add from the media library.
Done when: CRUD works with role checks (EDITOR allowed), validation errors show inline, publish rules are enforced and tested.
```
**7c — Testimonials, FAQs, Team**
```text
PHASE 7c — Testimonials, FAQs (general + per service) and Team modules using the CMS recipe. Include ordering, publish status, optional project link for testimonials, photo for team via MediaPicker.
```
**7d — Blog**
```text
PHASE 7d — Blog module: posts (Markdown editor with live preview, autosave draft locally with restore prompt), categories CRUD, cover image, author, scheduled publish (publishedAt in future = hidden until due), reading time auto-calc, SEO fields. Public queries must only return PUBLISHED with publishedAt <= now.
```
**7e — Pages/content, SEO, Settings, Users**
```text
PHASE 7e — Remaining admin modules.
1. Pages/Content: edit PageSection blocks for home (hero, stats, cta, process) and about (story, mission) using per-section Zod schemas and purpose-built forms (not a raw JSON editor); visibility toggles; no HTML injection.
2. SEO: PageSeo editor for static paths (/, /about, /services, /projects, /gallery, /blog, /faqs, /contact, /estimate) with title/description/OG image/canonical/noindex; sitemap & robots preview.
3. Settings (singleton): business name, tagline, phones (multiple), email, WhatsApp number + default message, address, map embed URL (validate allowlisted domain), hours, social links, credentials (label/value), brochure PDF via MediaPicker, lead notification emails.
4. Users (SUPER_ADMIN only): create/invite, edit role, deactivate/reactivate, revoke sessions, reset password; guard last SUPER_ADMIN.
5. All changes logged to ActivityLog with sanitized diffs; all revalidate relevant tags.
Done when: each module has role-tested Server Actions and the admin can fully edit Home hero/stats text and site settings.
```
**Commit after each sub-phase:** `feat(cms): <module>`

---

## Phase 8 — Public layout, SEO foundation, global CTAs
**Prompt**
```text
PHASE 8 — Public site shell per docs/DESIGN.md.
Tasks:
1. (site) route group layout: Header (transparent→solid on scroll, desktop nav + mobile drawer, phone link, Get Free Quote CTA), Footer (about blurb, services, quick links, contact, socials, credentials, copyright), skip-to-content link, landmarks.
2. Data from SiteSetting via cached query (tag "settings"); nothing hard-coded except fallbacks.
3. Global CTAs: floating WhatsApp button (wa.me link with URL-encoded prefilled message including page title), mobile bottom bar (Call / WhatsApp / Get Quote; hides on scroll down), click tracking via a tiny client handler that POSTs ContactEvent (rate limited, fire-and-forget, using navigator.sendBeacon when available).
4. SEO foundation: src/lib/seo with buildMetadata() (title template, description, canonical, OG/Twitter), JSON-LD components (GeneralContractor/LocalBusiness from settings, BreadcrumbList), sitemap.ts and robots.ts (disallow /admin, /api, thank-you pages), default OG image.
5. not-found.tsx and error.tsx with helpful navigation and CTA.
Constraints: Server Components by default; client JS minimal; no layout shift from header/mobile bar.
Done when: layout renders on all breakpoints, WhatsApp/call/quote CTAs work, sitemap.xml and robots.txt render.
```
**Commit:** `feat(site): layout, global CTAs and SEO foundation`

---

## Phase 9 — Home page
**Prompt**
```text
PHASE 9 — Home page per docs/DESIGN.md "Home" blueprint and docs/PRD.md PUB-1.
Build all sections using DB content (PageSection, Services, featured Projects, Testimonials, FAQs, Team teaser, Settings).
Requirements: hero with optimized LCP image (priority, correct sizes), animated stats (CountUp once), services grid, featured projects, process timeline, "Structural audit for societies" highlight with Request Site Inspection CTA, credentials, testimonials carousel (keyboard accessible, no autoplay), estimator teaser, FAQ teaser, final CTA.
Include metadata, JSON-LD (Organization/GeneralContractor), ISR with tags. Empty states: sections with no data are hidden gracefully.
Done when: Lighthouse mobile ≥ 90 performance locally (production build), no CLS, passes keyboard navigation, reads content from DB.
```
**Commit:** `feat(site): home page`

---

## Phase 10 — Services, Projects, Gallery pages
**Prompt**
```text
PHASE 10 — Services, Projects, Gallery public pages.
1. /services (grid) and /services/[slug] (hero, scope, process, related projects, gallery, FAQs with FAQPage JSON-LD, CTA, Service JSON-LD, breadcrumbs). generateStaticParams + ISR; 404 for unpublished.
2. /projects (filters by service/status/year via search params, pagination) and /projects/[slug] (gallery + lightbox, facts table, before/after slider, related projects, enquiry CTA that prefills the contact form with the project name). Respect showClientName=false by hiding client name everywhere (including JSON-LD and meta).
3. /gallery with category filter and accessible lightbox (focus trap, Esc, arrow keys, swipe).
4. Skeletons for loading; empty states; metadata per page from entity SEO fields with fallbacks.
Done when: pages render from DB, filters work without full reload where appropriate (progressive enhancement), lightbox is keyboard accessible.
```
**Commit:** `feat(site): services, projects and gallery`

---

## Phase 11 — About, Testimonials, Blog, FAQs, Contact, legal
**Prompt**
```text
PHASE 11 — Remaining public pages.
1. /about: story, mission, team (4 members), credentials, experience stats, CTA. Use copy from docs/CONTENT.md via PageSection/Settings.
2. /testimonials; show a friendly empty state if none are published.
3. /blog (category filter, pagination) and /blog/[slug] (ToC, reading time, related posts, Article JSON-LD, share links, sanitized Markdown).
4. /faqs grouped by service/general with Accordion + FAQPage JSON-LD.
5. /contact: form (name, phone, email optional, location, message, consent) — UI only now; submission is implemented in Phase 15. Contact info card from Settings, map embed (allowlisted), WhatsApp and tel: links.
6. /privacy and /terms pages with editable Markdown content (stored as PageSection or Settings) and sensible defaults; mark `TODO(client/legal)` for review by a lawyer.
Done when: all pages are reachable from navigation, responsive, SEO metadata present, no console errors.
```
**Commit:** `feat(site): about, blog, faqs, contact, legal pages`

---

## Phase 12 — Estimator engine (pure logic, tests first)
**Prompt**
```text
PHASE 12 — Estimator calculation engine per docs/ARCHITECTURE.md §7 and docs/DATABASE.md (Estimator models).
Write docs/adr/003-estimator-rule-engine.md first (rule order, rounding, how conditions work), then implement in src/server/estimator:
1. types.ts: EstimatorConfig, Field, Option, Rule, Answers, EstimateResult (low, high, breakdown line items, warnings).
2. validate.ts: validate answers against config (required, ranges, option membership, showIf visibility, area min/max). Returns typed errors.
3. calculate.ts: PURE deterministic function calculateEstimate(config, answers):
   base = area × baseRate (or SET_BASE_RATE option) → ADD_PER_UNIT effects → ADD_FLAT effects → rules (ordered; conditions evaluated safely, no eval) → location zone and MULTIPLY_PERCENT effects → minCharge → spread (low/high) → round to config.roundTo. Produce a breakdown for display.
4. snapshot.ts: build configSnapshot + stable configHash (sorted-key JSON, SHA-256).
5. Table-driven Vitest tests (≥ 25 cases): min/max area, hidden fields ignored, multiple effects order, percent stacking, minCharge, rounding, inactive options rejected, tampered values rejected, zero add-ons, large areas, INSPECTION_ONLY returns no price.
6. A loader src/server/estimator/load-config.ts that reads DB → EstimatorConfig (only active items), cached with tag "estimator".
Constraints: calculate.ts and validate.ts must not import Prisma, Next.js or process.env.
Done when: all tests pass with coverage ≥ 90% for src/server/estimator.
```
**Commit:** `feat(estimator): pure calculation engine with tests`

---

## Phase 13 — Estimator admin
**Prompt**
```text
PHASE 13 — Estimator admin (/admin/estimator), permission estimator:write (ADMIN+).
1. Services list (active toggle, pricing mode, unit, base rate, min charge, spread %, min/max area, disclaimer, order).
2. Field builder per service: add/edit/reorder fields (SELECT/RADIO/NUMBER/BOOLEAN/MULTISELECT), help text, required, min/max/step, showIf rule builder (dropdown UI, not raw JSON), options with effectType + effectValue, activate/deactivate.
3. Location zones CRUD (keywords + multiplier %).
4. Pricing rules builder (conditions → effect), ordering, enable/disable, validation with Zod.
5. **Test sandbox**: pick a service, fill answers, see breakdown and low/high using the exact same calculateEstimate; "compare with previous version" is optional.
6. Version bump on any change inside a transaction; ActivityLog with before/after diff; cache tag "estimator" revalidated.
7. Visible warning banner while any rate is marked PLACEHOLDER.
Done when: an admin can add a new field/option and see it in the sandbox without code changes; permission tests prevent EDITOR/SALES access.
```
**Commit:** `feat(estimator): admin configuration and sandbox`

---

## Phase 14 — Estimator public experience
**Prompt**
```text
PHASE 14 — Public estimator (/estimate) per docs/DESIGN.md "Estimator" blueprint and docs/PRD.md EST-1..EST-9.
1. Stepper UI: Service → Details (dynamic fields from config, area slider+number input, floors, location zone/area select, specification options, add-ons) → Result → Contact. State persists on back/next and in sessionStorage (no PII until contact step).
2. Live estimate using the shared calculateEstimate (client import of the pure module); show range, breakdown, disclaimer, and "subject to site inspection" note; aria-live polite updates.
3. INSPECTION_ONLY services: skip price; show short requirements form + "Request Site Inspection".
4. Contact step: name, phone (+91 validation), email, location, requirements, consent checkbox, honeypot, min-fill-time.
5. Server Action submitQuote: rate limit → validate → reload config from DB → validate answers → recompute estimate server-side → single transaction creating Lead (type QUOTE or INSPECTION), Quote (answers, breakdown, configSnapshot, version, hash, low/high), LeadStatusHistory (NEW), duplicate-phone flag → return publicId. Emails are fired after commit in Phase 15 (leave a clearly marked hook).
6. /estimate/thank-you?ref=<publicId>: confirmation, summary, next steps, WhatsApp/Call CTAs, noindex.
7. Tests: server action integration test proving tampered client price is ignored; e2e test for the full flow on mobile viewport.
Done when: I can complete an estimate end-to-end and see the Lead + Quote in the DB with an immutable snapshot.
```
**Commit:** `feat(estimator): public flow and quote submission`

---

## Phase 15 — Lead system & admin pipeline
**Prompt**
```text
PHASE 15 — Lead capture and management.
Public:
1. Implement submitContact (Contact form), submitProjectEnquiry (project page CTA, includes project slug), requestBrochure (name, phone, email, consent → returns a short-lived signed URL or page with download link), all using the same pipeline: rate limit → honeypot → validate → create Lead with tracking data (sourcePage, referrer, UTM, deviceType from UA, ipHash) → thank-you redirect.
2. Capture UTM/referrer on first landing in a first-party cookie/sessionStorage and attach to leads.
3. Thank-you pages for contact, enquiry and brochure (noindex).
Admin (/admin/leads, /admin/quotes):
4. Leads table: filters (status, type, date range, assignee, source), search (name/phone/email), sort, pagination, duplicate flag, mobile-friendly cards.
5. Lead detail: contact info (tap-to-call, WhatsApp), quote summary + breakdown + snapshot viewer (for QUOTE), timeline (status history + notes), change status (NEW→CONTACTED→QUALIFIED→CONVERTED→CLOSED; allow reopen with reason), assign user, follow-up date, add note.
6. Pipeline board view (kanban by status) as an alternative to the table.
7. CSV export (ADMIN+), soft delete (ADMIN+), SALES limited to own/unassigned leads per SECURITY.md.
8. Everything validated, authorized, logged to ActivityLog.
Done when: leads from all forms appear in admin with correct source tracking and I can move a lead through the full pipeline; permission tests pass.
```
**Commit:** `feat(leads): capture forms and admin pipeline`

---

## Phase 16 — Email, WhatsApp & call integrations
**You do first:** create Resend account, verify your sending domain (or use the test domain), add `RESEND_API_KEY`, `EMAIL_FROM`, `LEAD_NOTIFY_TO` to `.env.local`.

**Prompt**
```text
PHASE 16 — Email and contact integrations.
1. Email service src/lib/email using Resend + React Email templates: (a) admin new-lead notification (type, name, phone, location, message, quote range, link to admin), (b) visitor confirmation (summary, what happens next, contact numbers), (c) password reset, (d) brochure delivery.
2. Recipients from SiteSetting.notifyEmails with env fallback. Strip CR/LF from header values; escape content.
3. Sending happens AFTER the DB transaction; failures are logged (no PII) and never fail the user's submission. Add an EmailLog table (status, type, leadId, error code) and a retry mechanism (simple "resend" button in admin lead detail).
4. WhatsApp: helper to build wa.me links from settings (+ per-project/page prefilled text). Click-to-call tel: links everywhere phone numbers appear. Ensure ContactEvent logging is wired (from Phase 8).
5. Optional: Google Analytics 4 events (generate_lead, click_call, click_whatsapp, estimate_completed) behind consent and NEXT_PUBLIC_GA_ID.
6. Unit tests for template rendering and recipient resolution; mock the provider.
Done when: submitting a test lead sends the admin and visitor emails (sandbox or real), and failures do not break submissions.
```
**Commit:** `feat(notifications): email, whatsapp, call tracking`

---

## Phase 17 — SEO & structured data
**Prompt**
```text
PHASE 17 — SEO pass.
1. Audit every public page for: unique title/description, canonical, OG/Twitter, heading hierarchy (one h1), internal links, alt text, breadcrumbs.
2. JSON-LD: GeneralContractor/LocalBusiness (name, phones, address, areaServed Thane/Mumbai, openingHours, sameAs from socials, foundingDate 2003), Service, BreadcrumbList, FAQPage, Article, and CreativeWork for projects. Validate JSON-LD syntax with a unit test (parse + required fields).
3. sitemap.ts includes only published, indexable URLs with lastModified; robots.ts disallows /admin, /api, thank-you pages; admin and thank-you pages have noindex.
4. Create 3 SEO landing sections/pages editable from admin (e.g., "Structural audit in Thane", "Terrace waterproofing in Thane", "Society redevelopment PMC in Thane") using the existing Service/Blog infrastructure (no duplicate content; unique copy placeholders marked TODO(client)).
5. Add redirects config for known legacy URLs (TODO(client) list of old URLs).
6. Output a docs/SEO_CHECKLIST.md with post-launch tasks (Search Console, GBP, sitemap submission, reviews).
Done when: Rich Results Test–valid JSON-LD (verify manually), sitemap valid, no duplicate titles.
```
**Commit:** `feat(seo): metadata, structured data, sitemap`

---

## Phase 18 — Security hardening & rate limiting
**You do first (optional but recommended):** create Upstash Redis; add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

**Prompt**
```text
PHASE 18 — Security hardening per docs/SECURITY.md (full pass).
1. Implement the Upstash-backed limiter behind the existing interface with in-memory fallback in dev; apply the limits table in SECURITY.md §6 to login, lead forms, brochure, estimate API, upload signature, password reset.
2. Add security headers in next.config (CSP with nonces, HSTS, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors none); adjust CSP for Cloudinary images, map embed, GA/Turnstile if enabled; confirm no CSP violations in console across all pages.
3. Optional Turnstile integration on public forms behind an env flag, with server-side verification.
4. Authorization audit: write an automated test that enumerates all Server Actions/route handlers under admin and asserts they reject unauthenticated and unauthorized roles (use a registry pattern if needed).
5. XSS tests for Markdown renderers; SQLi smoke tests via validators; open-redirect tests; upload signature abuse tests.
6. Add data-request tooling for admins: export a person's data by phone/email; anonymize lead action (logged).
7. Add a retention script (dry-run default) to anonymize leads older than N months.
8. Produce docs/SECURITY_REVIEW.md listing each item in the SECURITY.md pre-launch checklist with status and evidence.
Done when: all automated security tests pass and the checklist has no unchecked critical items.
```
**Commit:** `security: headers, rate limits, audits and privacy tooling`

---

## Phase 19 — Performance & accessibility
**Prompt**
```text
PHASE 19 — Performance and accessibility pass.
1. Run a production build locally; measure Lighthouse (mobile) for /, /services/[slug], /projects/[slug], /blog/[slug], /estimate, /contact. Fix issues to reach: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95; LCP < 2.5s, CLS < 0.1, INP < 200ms.
2. Review bundle with the Next.js analyzer; remove unnecessary client components; dynamic import heavy/admin-only libs; ensure fonts and images are optimized; check `sizes` on every next/image.
3. Add @axe-core/playwright tests for key pages (no serious/critical violations); fix issues.
4. Verify reduced-motion behavior, keyboard-only navigation, focus order and focus restoration in dialogs/lightbox.
5. Verify responsive behavior at 360, 390, 768, 1024, 1280, 1536 widths (Playwright screenshots) and fix overflow/tap-target issues.
6. Add caching review: ensure ISR tags revalidate correctly after admin edits (test: edit service → public page updates).
7. Write docs/PERFORMANCE_REPORT.md with before/after numbers.
Done when: targets met or documented exceptions with reasons.
```
**Commit:** `perf: core web vitals and accessibility improvements`

---

## Phase 20 — Test suite completion
**Prompt**
```text
PHASE 20 — Complete the test suite.
1. Unit: ensure coverage for utils, validation schemas, permissions, estimator (≥ 90%), markdown sanitizer, JSON-LD builders.
2. Integration (against a Neon test branch or local Postgres, selected by TEST_DATABASE_URL): lead submission transaction, quote snapshot immutability after config changes, role enforcement in services, CMS publish rules, last-SUPER_ADMIN guard.
3. E2E (Playwright, desktop + mobile): estimate→lead→thank-you; contact form; brochure request; admin login; create+publish project and see it publicly; change lead status through the pipeline; estimator admin edit shows up in the public estimator; EDITOR cannot access leads.
4. Add `npm run test:ci` and wire into GitHub Actions (with services/env needed; secrets via GitHub Actions secrets).
5. Write docs/TEST_PLAN.md with manual QA checklist for the client (browsers, devices, forms, emails, WhatsApp, call links).
Done when: CI is green with unit + integration + e2e smoke.
```
**Commit:** `test: unit, integration and e2e coverage`

---

## Phase 21 — Production readiness
**Prompt**
```text
PHASE 21 — Production readiness.
1. Finalize env handling: confirm src/lib/env.ts fails fast in production for missing required vars; update .env.example and docs/RUNBOOK.md.
2. Add deployment scripts/docs: `prisma migrate deploy` strategy (CI or Vercel build command using DIRECT_URL), idempotent production seed (insert-only defaults; never overwrite client edits), first SUPER_ADMIN creation procedure.
3. Add Vercel config (vercel.json only if necessary), image domains, caching headers for static assets, and redirects for legacy URLs.
4. Add health/monitoring: /api/health (basic) and /api/health?deep=1 (SUPER_ADMIN only); optional Sentry integration behind env flag with PII scrubbing; Vercel Analytics/Speed Insights toggles.
5. Create docs/DEPLOYMENT.md: step-by-step for Neon production branch, Vercel project, env vars (Production vs Preview), domain + DNS, SSL, Resend domain verification, Cloudinary settings, rollback.
6. Final cleanup: remove dev-only pages from production (/design-system), remove unused deps/files, ensure no console.log of sensitive data.
Done when: a production build passes and docs/DEPLOYMENT.md can be followed by someone new.
```
**Commit:** `chore: production readiness and deployment docs`

---

## Phase 22 — Deploy (you drive; the agent assists)
**You do:**
1. Neon: create production database/branch; copy pooled + direct URLs.
2. Vercel: import the GitHub repo → set env vars (Production + Preview).
3. Run production migration: `DIRECT_URL=<prod direct> npx prisma migrate deploy` (from your machine or CI).
4. Run production seed once; log in with the seeded SUPER_ADMIN and change the password immediately.
5. Add domain in Vercel, update DNS at registrar, wait for SSL.
6. Verify Resend domain, Cloudinary upload preset/CORS, Turnstile site key (if used).

**Prompt (assist only)**
```text
PHASE 22 — Deployment assistance. Do not modify production resources.
Using docs/DEPLOYMENT.md, produce a personalized go-live checklist for me with exact commands and the env var list (names only). Then review the repo for anything that would break on Vercel (edge/runtime mismatches, missing env, server-only imports in client code, image domain config, build-time DB access). Fix issues in code and list manual steps I must do in dashboards.
```

**Production smoke test checklist (you):**
- [ ] Home/Services/Projects/Blog load fast on mobile data
- [ ] Estimate flow works; Lead+Quote visible in admin; emails received
- [ ] Contact form, brochure request, WhatsApp and call links work
- [ ] Admin login/logout, edit a service → public page updates
- [ ] Upload an image; it appears optimized
- [ ] `/admin` not indexed; sitemap and robots correct
- [ ] Lighthouse mobile ≥ 90 on production URL
- [ ] Error pages and 404 look right

---

## Phase 23 — Content load & client handover
**Prompt**
```text
PHASE 23 — Handover materials.
Create:
1. docs/CLIENT_GUIDE.md — plain-language admin manual with step-by-step instructions and screenshots placeholders for: logging in, changing password, editing Home/About text, adding a project with photos, adding a blog post, managing testimonials/FAQs, uploading gallery images, editing estimator prices/options (and the "test sandbox"), handling leads (status flow), exporting leads, editing contact info/social links/WhatsApp, SEO basics, adding users/roles, what to do if something breaks.
2. docs/CONTENT_CHECKLIST.md — everything the client must provide or approve (the TODO(client) list), grouped by priority.
3. docs/MAINTENANCE.md — monthly tasks: dependency updates, backups/export, security review, performance check, content freshness, lead data retention.
4. A 10-minute training agenda (docs/TRAINING_AGENDA.md).
Keep language simple (no developer jargon).
```
**Commit:** `docs: client handover guide`

---

## Appendix A — Reusable utility prompts

**Bug fix**
```text
Bug: <describe, steps to reproduce, expected vs actual, URL, role>.
First write a failing test (unit or Playwright) that reproduces it, then fix the root cause (not the symptom), then run typecheck/lint/test/build. Summarize the cause, the fix, and any related risks.
```

**Code review (before merging a phase)**
```text
Review the diff of this branch against main as a senior engineer. Check: server-side validation and authorization on every mutation, no PII in logs, no business logic in components, N+1 queries, missing indexes, accessibility, responsive issues, cache invalidation tags, error/empty/loading states, test coverage. Output a prioritized list (Critical/High/Medium/Low) with file:line references and proposed fixes. Do not change code yet.
```

**Security audit**
```text
Perform a security audit against docs/SECURITY.md. Enumerate all routes, Server Actions and API handlers, show their authN/authZ checks and validation, and flag gaps. Try: privilege escalation by role, IDOR on leads/quotes/media, XSS via Markdown, open redirects, upload abuse, rate-limit bypass, estimator tampering. Provide evidence and fixes.
```

**Performance audit**
```text
Analyze performance: bundle composition, client components that could be server components, image sizes/priority, fonts, caching/revalidation, database query counts per page. Provide measurable recommendations with expected impact, then implement the top 5.
```

**Add a new CMS module**
```text
Add a new admin-managed module "<name>" following the CMS module recipe in docs/CODING_STANDARDS.md: Prisma model + migration, Zod schema, service, Server Actions with permissions, admin list/create/edit pages, public query with cache tags, seed data, tests. Update docs/DATABASE.md and the permission matrix.
```

**Add a new estimator service (no code change expected)**
```text
Explain how an admin would add a new estimator service "<name>" through the admin UI (fields, options, rules). If anything requires code changes, list the gaps and implement them so that future services are purely configuration.
```

**Refactor safely**
```text
Refactor <area> to <goal>. Constraints: no behavior change, keep public APIs, add characterization tests first, run the full test suite after each step, and make small commits.
```

---

## Appendix B — Environment variables cheat-sheet (names only)
```
NEXT_PUBLIC_SITE_URL
DATABASE_URL            # Neon pooled
DIRECT_URL              # Neon direct (migrations)
BETTER_AUTH_SECRET      # generate: openssl rand -base64 32
BETTER_AUTH_URL
SEED_ADMIN_EMAIL        # first-run only
SEED_ADMIN_PASSWORD     # first-run only; change immediately
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
RESEND_API_KEY
EMAIL_FROM
LEAD_NOTIFY_TO
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
TURNSTILE_SECRET_KEY            # optional
NEXT_PUBLIC_TURNSTILE_SITE_KEY  # optional
NEXT_PUBLIC_GA_ID               # optional
IP_HASH_SECRET                  # random string for hashing IPs
TEST_DATABASE_URL               # tests only
```

## Appendix C — Troubleshooting
| Symptom | Likely cause | Fix |
|---|---|---|
| Prisma "too many connections" | Using direct URL at runtime | Use pooled `DATABASE_URL` at runtime, direct only for migrations |
| Migration hangs on Neon | Using pooled URL for migrate | Use `DIRECT_URL` |
| Images 400/blocked | Missing remote pattern / CSP | Add Cloudinary to `next.config` images + CSP `img-src` |
| Admin redirect loop | Session cookie not set (wrong `BETTER_AUTH_URL`/domain) | Match URL to actual origin; check cookie flags |
| Server Action 403 in production | Origin mismatch behind proxy | Configure allowed origins per Next.js docs |
| CSP blocks inline JSON-LD | Missing nonce | Pass nonce to JSON-LD script component |
| ISR not updating after edit | Tag not revalidated | Ensure Server Action calls `revalidateTag` for the right tags |
| Emails not delivered | Domain unverified/spam | Verify SPF/DKIM in Resend; check logs/EmailLog |
| Agent installs random packages | Prompt too open | Re-state "no new deps without justification"; use Correction Prompt |

## Appendix D — Suggested phase timeline (solo + AI agent)
| Week | Phases |
|---|---|
| 1 | 0–4 (foundation, DB, auth) |
| 2 | 5–7 (admin, media, CMS) |
| 3 | 8–11 (public site) |
| 4 | 12–15 (estimator, leads) |
| 5 | 16–20 (integrations, SEO, security, performance, tests) |
| 6 | 21–23 (production, deploy, handover) |
