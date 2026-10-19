# DESIGN SYSTEM

Goal: a premium, trustworthy, engineering-led look with the spacious color rhythm of the reviewed reference site, while keeping Vakratund's own content, logo, photography and voice.

## 1. Brand
- Name: **Vakratund Construction** · Tagline: **"Quality is our first priority"** · Est. 2003
- Personality: reliable, precise, experienced, approachable.
- `ACCENT_SET: REFERENCE`. Lavender/indigo and mint are structural inspiration only; the existing construction orange remains only as the tiny logo-mark signature cue.
- Do not copy the reference site's text, imagery, logo, icons, code, page composition or distinctive collage.

## 2. Color tokens (CSS variables in `globals.css`, mapped in Tailwind theme)

The live palette follows the reference's observed white → cool tint → dark editorial → pastel CTA rhythm. Values are adapted for Vakratund and recorded with the browser review in [DESIGN_REFERENCE.md](DESIGN_REFERENCE.md).

| Token | Value | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | page and card canvas |
| `--tint` | `#F0F1F8` | soft lavender alternate section |
| `--dark` | `#1B1A2B` | dark editorial sections and footer |
| `--ink` | `#1B1A2B` | primary text |
| `--ink-muted` | `#5D5C67` | secondary text |
| `--line` | `#E7E7EA` | borders and dividers |
| `--accent` | `#8B7CF6` | primary action and highlight |
| `--accent-ink` | `#17152E` | text on lavender accent |
| `--accent-2` | `#9BF0CF` | secondary action and mint highlight |
| `--accent-2-ink` | `#173A32` | text on mint accent |
| `--glow-1` | `#F7C8DE` | pink glow |
| `--glow-2` | `#F8D7B6` | peach glow |
| `--glow-3` | `#BFEEDD` | mint glow |
| `--brand-signature` | `#D87400` | logo mark dot only in this accent set |

`bg-glow-radial` uses the soft glow colors. `bg-cta-gradient` and `.section-gradient` use lavender → pale pink → mint. The old warm-construction values are removed; compatibility class names such as `bg-brand` resolve to the new semantic tokens so existing page markup does not need a layout rewrite.

### Section recipes

| Utility | Background | Text | Muted text | Border | Link |
|---|---|---|---|---|---|
| `.section-light` | `--bg` | `--ink` | `--ink-muted` | `--line` | `--brand-deep` |
| `.section-tint` | `--tint` | `--ink` | `--ink-muted` | `--line` | `--brand-deep` |
| `.section-dark` | `--dark` | white | `#C6C5D0` | 22% white | `--accent-2` |
| `.section-gradient` | `--cta-gradient` | `--dark` | 76% `--dark` | 22% `--dark` | `--dark` |

Use light for the main canvas, tint for proof/process bands, dark for an occasional editorial feature or footer, and gradient for one focused conversion moment. `GlowBlob` is absolute, decorative and `aria-hidden`; it uses a blurred radial gradient and transform-only ambient motion, disabled under reduced motion. The admin uses these tokens in a flat, neutral mode with no gradients, glow blobs or animations.

### Contrast reference

Ratios below use the final light-theme hex tokens and WCAG 2 relative luminance. Normal text passes at 4.5:1; large text and UI pass at 3:1.

| Text / background pair | Ratio | Result |
|---|---:|---|
| `--ink` / `--bg` | 17.08:1 | Pass |
| `--ink` / `--tint` | 15.17:1 | Pass |
| `--ink-muted` / `--bg` | 6.58:1 | Pass |
| `--ink-muted` / `--tint` | 5.84:1 | Pass |
| `--brand-deep` / `--bg` | 6.10:1 | Pass |
| `--brand-deep` / `--tint` | 5.41:1 | Pass |
| white / `--dark` | 17.08:1 | Pass |
| `--accent-ink` / `--accent` | 5.33:1 | Pass |
| `--accent-2-ink` / `--accent-2` | 9.34:1 | Pass |
| `--charcoal` / WhatsApp green `#25D366` | 8.61:1 | Pass |
| `--dark` / `--glow-1` | 11.61:1 | Pass |
| `--dark` / `--glow-2` | 12.52:1 | Pass |
| `--dark` / `--glow-3` | 13.41:1 | Pass |

### Button rules

- `primary`: `--accent` fill with `--accent-ink` text.
- `secondary`: `--accent-2` fill with `--accent-2-ink` text.
- `dark`: `--dark` fill with white text.
- `outline-on-light`: accent border/text on light or tinted sections.
- `outline-on-dark`: white border/text; hover shifts to mint.
- All buttons are pill-shaped, at least 44px high, use the shared contrast-safe focus ring, lift 1–2px on public hover and nudge the arrow. Admin retains focus visibility but disables lift and transitions.

## 3. Typography (`next/font`, self-hosted)
- Headings: **Sora** (600/700) — confident weights, tight negative tracking, engineered feel.
- Body/UI: **Inter** (400/500/600).
- Optional numerals/stats: Sora tabular figures.
- Use the fluid Tailwind utilities `text-hero`, `text-display`, `text-h1`, `text-h2`, and `text-h3`, backed by CSS `clamp()` tokens:

  | Utility | Fluid size | Typical use |
  |---|---|---|
  | `text-hero` | `clamp(52px, 8vw + 16px, 128px)` | Home/feature hero only; scale down when the copy wraps awkwardly |
  | `text-display` | `clamp(48px, 5vw + 16px, 96px)` | Editorial statement or major feature heading |
  | `text-h1` | `clamp(40px, 4vw + 16px, 72px)` | Page title |
  | `text-h2` | `clamp(32px, 2.5vw + 16px, 52px)` | Section heading |
  | `text-h3` | `clamp(24px, 1.2vw + 16px, 32px)` | Card and subsection heading |
  | body / small / caption | `16–18px` / `14px` / `12px` | Body, metadata and compact labels |

- Headings use tighter tracking as size increases (hero about `-0.055em`, display `-0.045em`, section headings about `-0.035em`) and line-height from `0.95` to `1.15`. Body line-height is `1.6`; max line length is `68ch`.
- Use the `.eyebrow` style for short uppercase section labels: compact, semibold, tracked, and colored with the text-safe `brand-deep` token on light sections. Dark and gradient recipes override it with their section link color. Do not use it for sentences or as the only accessible name of a section.
- Minimum body size 16px on mobile.

## 4. Layout, spacing, radius, elevation
- Containers: `narrow` (48rem / 768px, editorial copy), `default` (77.5rem / 1240px), `wide` (90rem / 1440px), and `full-bleed` (viewport width for hero/media). Padded variants use `16px` mobile / `24px` tablet / `32px` desktop.
- Spacing scale: 4-pt (4, 8, 12, 16, 24, 32, 48, 64, 96, 128). Section utilities: `section-space-compact` (48→80px), `section-space` (64→112px), and `section-space-generous` (80→128px), fluid between breakpoints. Use compact for adjacent/detail sections, default for primary sections and generous for a hero or major editorial break.
- Section rhythm: `.section-light` → `.section-tint` → occasional `.section-dark` → `.section-light` → one `.section-gradient` conversion moment. Keep this sequence varied but avoid alternating every small section mechanically.
- Grid: 4 cols mobile, 8 tablet, 12 desktop.
- Cards: `bg`, `line` border, 28–32px radius, restrained `shadow-soft`; large feature cards use 36px. Use tokenized hover elevation only where the card is interactive. Media cards prioritize a large, consistent crop (usually 4:3) with text on a clean surface; avoid placing essential copy over busy photos.
- Radius: controls and buttons are fully rounded pills, cards are 32px, large feature panels are 36px.
- Shadows: subtle (`0 1px 2px / 0 8px 24px` at low alpha); interactive hover lifts 2–4px.
- Breakpoints (Tailwind default): `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. **Design mobile first.**

## 5. Components (in `src/components/ui`, built once, reused everywhere)
Button (primary/secondary/ghost/link, sizes, loading), IconButton, Input, Textarea, Select, Checkbox, Radio, Switch, Slider (estimator), FormField (label + hint + error), Badge, Card, Tabs, Accordion (FAQ), Dialog/Sheet, Tooltip, Toast, Skeleton, EmptyState, ErrorState, Pagination, Breadcrumbs, Stat, SectionHeading, Container, Lightbox, BeforeAfterSlider, Stepper (estimator), DataTable (admin), ConfirmDialog.

States required on all interactive components: default, hover, focus-visible (2px contrast-safe outline + offset), active, disabled, loading, error.

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

### Global mobile bar
Fixed bottom bar: **Call · WhatsApp · Get Quote**; hides on scroll down, shows on scroll up; must not cover form fields (add bottom padding to page).

## 7. Motion system
- Shared primitives live in `src/components/motion`; they use native browser APIs and CSS (IntersectionObserver, requestAnimationFrame fallbacks, and CSS scroll timelines where supported). No animation dependency or smooth-scroll library is required.
- `Reveal` and `RevealGroup` reveal once on entry with fade/rise; `SplitText` supports words or explicit newline-separated lines and exposes one accessible label; `MaskImage` uses a transform curtain; `CountUp` accepts prefix, suffix and easing; `Marquee`, `Parallax`, `ScrollProgress` and `HoverCard` cover the remaining patterns. Import from `@/components/motion`; legacy `@/components/ui/motion` and `count-up` exports remain compatible.
- Effects enhance content only after hydration and preference detection. Without JavaScript, before detection, and with reduced motion enabled, content is visible and static. Keep LCP hero headings and images unwrapped or use `priority` on Reveal/MaskImage so they never wait for an animation.
- Every entrance runs at most once. Use the shared easing `cubic-bezier(0.22, 1, 0.36, 1)`, 150–300ms for interaction feedback, and no more than 600ms for reveals. Animate transform and opacity only; reserve dimensions for counters and never move content in a way that causes layout shift.
- Respect `prefers-reduced-motion` for every component: no reveal, count-up, parallax, or looping marquee. Parallax is disabled below 768px and for coarse pointers. It uses CSS scroll timelines when supported and a passive, frame-throttled scroll fallback otherwise.
- Marquees pause on hover and keyboard focus. Do not use motion to convey information, autoplay video, animate large areas continuously, or delay interaction.

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
- Forms: sticky save bar, dirty-state warning, and inline validation.
- Every list: loading skeleton, empty state with primary action, error state with retry.
- Destructive actions use ConfirmDialog with explicit wording.

### Admin theme scope

All protected admin screens are wrapped in `.admin-theme`. This scope overrides
the public editorial treatment without changing public pages: controls and
chips use an 8px radius, cards and panels use a 12px radius, surfaces are
neutral with 1px borders and restrained shadows, and buttons do not lift,
nudge arrows, blur, or use gradients. Primary buttons are solid accent fills;
secondary buttons are outlined; danger actions use red text and borders.
Small icon buttons are 36px squares and must have an accessible label and
tooltip. Admin tables use sticky headers, dense spacing, real labeled switches,
and responsive cards below 768px. Decorative blobs, animated reveals, and
nonessential transitions are disabled in the admin scope.
- Mobile-usable lead management (client will check leads on phone).
