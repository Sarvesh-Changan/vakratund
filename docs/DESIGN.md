# DESIGN SYSTEM

Goal: a premium, trustworthy, engineering-led look. Not flashy. Confident typography, strong photography,
generous whitespace, purposeful motion. The brand reads as "serious engineers who deliver on time".

## 1. Brand
- Name: **Vakratund Construction** · Tagline: **"Quality is our first priority"** · Est. 2003
- Personality: reliable, precise, experienced, approachable.
- Logo: `TODO(client)`. Until supplied, use a text wordmark (see Typography) with a small orange accent mark.

## 2. Color tokens (CSS variables in `globals.css`, mapped in Tailwind theme)
The PDF uses an amber-orange title and a warm beige band; we keep that DNA and add a dark charcoal for premium contrast.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FBF8F2` | `#0F0D0B` | page background |
| `--surface` | `#FFFFFF` | `#1A1714` | cards |
| `--surface-alt` | `#F3ECDD` | `#241F1A` | alternating sections (beige band echo) |
| `--ink` | `#17130F` | `#F5EFE4` | primary text |
| `--ink-muted` | `#5B5249` | `#B8AD9E` | secondary text |
| `--line` | `#E4DAC8` | `#3A332B` | borders |
| `--brand` | `#F59A0C` | `#FFA826` | primary accent / buttons |
| `--brand-ink` | `#1A1208` | `#1A1208` | text on brand (contrast ≥ 7:1) |
| `--brand-deep` | `#B86A00` | `#FFB84D` | brand text/links on light bg (AA) |
| `--charcoal` | `#14110F` | `#14110F` | hero/footers |
| `--success` `--warning` `--danger` | `#1F8A4C` `#B7791F` `#C0392B` | lighter variants | status |

Rules:
- **Never** use `--brand` as text color on white (fails contrast). Use `--brand-deep` for text, `--brand` for fills with `--brand-ink` text.
- Check every pair for WCAG AA (4.5:1 body, 3:1 large text/UI).
- Light theme is default; dark theme supported via `prefers-color-scheme` + manual toggle (admin first, public optional).

## 3. Typography (`next/font`, self-hosted)
- Headings: **Sora** (600/700) — tight tracking, engineered feel.
- Body/UI: **Inter** (400/500/600).
- Optional numerals/stats: Sora tabular figures.
- Scale (fluid with `clamp`): `display 40–72`, `h1 32–52`, `h2 26–38`, `h3 20–26`, `body 16–18`, `small 14`, `caption 12`.
- Line height: headings 1.1–1.2, body 1.6. Max line length 68ch.
- Minimum body size 16px on mobile.

## 4. Layout, spacing, radius, elevation
- Container: max `1240px`, padding `16px` mobile / `24px` tablet / `32px` desktop.
- Spacing scale: 4-pt (4, 8, 12, 16, 24, 32, 48, 64, 96, 128). Section vertical padding: `64px` mobile → `112px` desktop.
- Grid: 4 cols mobile, 8 tablet, 12 desktop.
- Radius: `8` inputs/buttons, `16` cards, `24` large feature panels, `999` pills.
- Shadows: subtle (`0 1px 2px / 0 8px 24px` at low alpha); hover lifts 2–4px.
- Breakpoints (Tailwind default): `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. **Design mobile first.**

## 5. Components (in `src/components/ui`, built once, reused everywhere)
Button (primary/secondary/ghost/link, sizes, loading), IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Slider (estimator), FormField (label + hint + error), Badge, Card, Tabs, Accordion (FAQ), Dialog/Sheet, Tooltip, Toast, Skeleton, EmptyState, ErrorState, Pagination, Breadcrumbs, Stat, SectionHeading, Container, Lightbox, BeforeAfterSlider, Stepper (estimator), DataTable (admin), ConfirmDialog.

States required on all interactive components: default, hover, focus-visible (2px outline `--brand-deep` + offset), active, disabled, loading, error.

## 6. Page blueprints

### Home
1. **Header** (transparent over hero → solid on scroll): logo, nav, phone, "Get Free Quote" button.
2. **Hero** (full-bleed building photo with charcoal gradient): H1 "Building trust since 2003" (editable), subtext on PMC / repair / redevelopment, CTAs *Get Free Quote* + *Call Now*, trust chips (MSME Registered · Insured workforce · 20+ years).
3. **Stats strip**: Years (since 2003), Projects completed, Sq.ft constructed, Societies served (counter animation once, respects reduced motion).
4. **Services grid** (11 cards, icon + short copy, "View all").
5. **Featured projects** (3–6 cards with status badge).
6. **Why choose us / process** (Survey → Plan → Execute → Handover), timeline.
7. **Specialty highlight**: Structural audit & repair for societies (key differentiator) with CTA "Request site inspection".
8. **Credentials & team teaser**.
9. **Testimonials** carousel (keyboard + swipe, no autoplay or pausable).
10. **Mini estimator teaser** → `/estimate`.
11. **FAQ teaser** + **Final CTA band** + **Footer** (contacts, links, socials, address).

### Services detail
Hero (title + short desc + CTA) → What we do (bullets) → Process → Related projects → Gallery → FAQs → CTA. Sticky side CTA on desktop.

### Projects
Filter bar (service, status, year) → responsive card grid → detail: gallery with lightbox, facts table (location, area, floors, scope, status, year), description, before/after, related projects, enquiry CTA ("Enquire about a similar project", prefilled).

### Estimator (`/estimate`)
Stepper layout: 1 Service → 2 Details → 3 Estimate result → 4 Contact. Sticky summary card on desktop, bottom sheet on mobile. Large tap targets, number input + slider for area, instant range update, clear disclaimer, progress indicator, back/next preserving state. Inspection-only services: short form + "Request site inspection".

### Contact
Two-column: form + info card (phones as `tel:` links, WhatsApp button, email, address, hours) and map below.

### Blog
Editorial layout, readable measure (68ch), ToC on desktop, share links, related posts.

### Global mobile bar
Fixed bottom bar: **Call · WhatsApp · Get Quote**; hides on scroll down, shows on scroll up; must not cover form fields (add bottom padding to page).

## 7. Motion principles
- Purpose: orient, give feedback, add polish — never block content.
- Durations 150–300ms for UI, up to 600ms for section reveals; easing `cubic-bezier(0.22, 1, 0.36, 1)`.
- Allowed: fade-up on scroll (once), counter-up for stats, card hover lift, image zoom on hover (≤ 1.05), header shrink, accordion height, estimator step transitions, before/after slider.
- **Always** honor `prefers-reduced-motion` (disable transforms/parallax, keep opacity only).
- Animate `transform` and `opacity` only; no layout-shifting animations; no autoplaying video with sound.

## 8. Imagery
- Real project photos only (stock only for abstract backgrounds, flagged `TODO(client)`).
- Consistent aspect ratios: cards `4:3`, hero `16:9` (mobile crop `4:5`), gallery masonry.
- Cloudinary transformations: `f_auto,q_auto`, responsive `sizes`; blur placeholders.
- Photos with burned-in text/watermarks (from the PDF) must be replaced by originals; if unavoidable, crop.
- Alt text describes content and context (e.g., "Waterproofing coating being applied on a terrace in Thane").

## 9. Voice & copy
Plain, specific, professional. Use numbers and facts (years, sqft, storeys). Avoid hype. Primary CTA verbs: "Get Free Quote", "Request Site Inspection", "Call Now", "Download Company Profile". Keep the estimator disclaimer visible: *"Indicative estimate. Final quotation after site inspection."*

## 10. Accessibility checklist (design level)
- Contrast AA; focus-visible everywhere; skip-to-content link; landmarks (`header/nav/main/footer`).
- Touch targets ≥ 44×44px; form labels always visible (no placeholder-only labels).
- Error messages linked via `aria-describedby`; `aria-live` for estimate updates (polite).
- Lightbox/Dialog trap focus and restore it; carousels keyboard operable.
- No information by color alone (status badges include text/icon).

## 11. Admin UI
- Clean, dense, utilitarian; left sidebar (collapses to drawer on mobile), top bar with user menu.
- Dashboard cards + charts; tables with search/filter/sort/pagination, bulk actions where useful.
- Forms: sticky save bar, dirty-state warning, inline validation, autosave drafts for blog.
- Every list: loading skeleton, empty state with primary action, error state with retry.
- Destructive actions use ConfirmDialog with explicit wording.
- Mobile-usable lead management (client will check leads on phone).
