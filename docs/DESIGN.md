# DESIGN SYSTEM

Goal: a premium, trustworthy, engineering-led look. Not flashy. Confident typography, strong photography,
generous whitespace, purposeful motion. The brand reads as "serious engineers who deliver on time".

## 1. Brand
- Name: **Vakratund Construction** · Tagline: **"Quality is our first priority"** · Est. 2003
- Personality: reliable, precise, experienced, approachable.
- Logo: `TODO(client)`. Until supplied, use a text wordmark (see Typography) with a small orange accent mark.

## Visual direction

Use an editorial, engineering-led visual language: confident oversized Sora headlines, clear section-to-section rhythm, generous whitespace, and large, real project photography. Keep layouts crisp and purposeful rather than decorative. The Sphere reference informs the scale and pacing only; Vakratund retains its own warm amber, charcoal and neutral palette, its Sora/Inter typography, and original project imagery. Do not reproduce the reference site's purple/mint colors, collage composition, graphics, copy, or brand assets.

- Lead with one clear headline and one strong, approved image; let each section have a single visual focus.
- Establish hierarchy with large headlines and compact uppercase eyebrow labels, not extra font families or ornamental effects.
- Alternate page background (`bg`), warm contrast band (`surface-alt`) and occasional charcoal feature sections. Use white `surface` for cards and content that needs separation.
- Keep section spacing generous but responsive; use tighter rhythm for related controls, data and admin content.
- Prefer crisp cards with a clear image/content boundary, fine tokenized border, 16px radius and restrained shadow. Use larger 24px radius only for feature panels; avoid stacking borders and shadows on every surface.
- Use `narrow`, `default`, `wide` and `full-bleed` container variants to give editorial text, standard content, galleries and hero imagery the right measure.

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
| `--whatsapp` `--whatsapp-dark` `--whatsapp-text` | `#25D366` `#128C7E` `#137A3A` | WhatsApp actions, pressed state, and readable text on white |

Rules:
- **Never** use `--brand` as text color on white (fails contrast). Use `--brand-deep` for text, `--brand` for fills with `--brand-ink` text.
- Check every pair for WCAG AA (4.5:1 body, 3:1 large text/UI).
- WhatsApp green is the sole brand-color exception to the no-hard-coded-hex rule. Use the `whatsapp` theme tokens; `--whatsapp-text` has at least 4.5:1 contrast on white. WhatsApp links must remain visibly labeled when an icon is present.
- Light theme is default; dark theme supported via `prefers-color-scheme` + manual toggle (admin first, public optional).

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
- Use the `.eyebrow` style for short uppercase section labels: compact, semibold, tracked, and colored with the text-safe `brand-deep` token. Do not use it for sentences or as the only accessible name of a section.
- Minimum body size 16px on mobile.

## 4. Layout, spacing, radius, elevation
- Containers: `narrow` (48rem / 768px, editorial copy), `default` (77.5rem / 1240px), `wide` (90rem / 1440px), and `full-bleed` (viewport width for hero/media). Padded variants use `16px` mobile / `24px` tablet / `32px` desktop.
- Spacing scale: 4-pt (4, 8, 12, 16, 24, 32, 48, 64, 96, 128). Section utilities: `section-space-compact` (48→80px), `section-space` (64→112px), and `section-space-generous` (80→128px), fluid between breakpoints. Use compact for adjacent/detail sections, default for primary sections and generous for a hero or major editorial break.
- Section rhythm: page background `bg-bg` → selected `bg-surface-alt` bands → occasional `bg-charcoal` feature → return to `bg-bg`. Keep this sequence varied but avoid alternating every small section mechanically.
- Grid: 4 cols mobile, 8 tablet, 12 desktop.
- Cards: `surface` background, `line` border, `16px` radius, restrained `shadow-soft`; use tokenized hover elevation only where the card is interactive. Media cards prioritize a large, consistent crop (usually 4:3) with text on a clean surface; avoid placing essential copy over busy photos.
- Radius: `8px` inputs/buttons, `16px` cards, `24px` large feature panels, `999px` pills.
- Shadows: subtle (`0 1px 2px / 0 8px 24px` at low alpha); interactive hover lifts 2–4px.
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

## 7. Motion system
- Shared primitives live in `src/components/motion`; they use native browser APIs and CSS (IntersectionObserver, requestAnimationFrame fallbacks, and CSS scroll timelines where supported). No animation dependency or smooth-scroll library is required.
- `Reveal` and `RevealGroup` reveal once on entry with fade/rise; `SplitText` supports words or explicit newline-separated lines and exposes one accessible label; `MaskImage` uses a transform curtain; `CountUp` accepts prefix, suffix and easing; `Marquee`, `Parallax`, `ScrollProgress` and `HoverCard` cover the remaining patterns. Import from `@/components/motion`; legacy `@/components/ui/motion` and `count-up` exports remain compatible.
- Effects enhance content only after hydration and preference detection. Without JavaScript, before detection, and with reduced motion enabled, content is visible and static. Keep LCP hero headings and images unwrapped or use `priority` on Reveal/MaskImage so they never wait for an animation.
- Every entrance runs at most once. Use the shared easing `cubic-bezier(0.22, 1, 0.36, 1)`, 150–300ms for interaction feedback, and no more than 600ms for reveals. Animate transform and opacity only; reserve dimensions for counters and never move content in a way that causes layout shift.
- Respect `prefers-reduced-motion` for every component: no reveal, count-up, parallax, or looping marquee. Parallax is disabled below 768px and for coarse pointers. It uses CSS scroll timelines when supported and a passive, frame-throttled scroll fallback otherwise.
- Marquees pause on hover and keyboard focus. Do not use motion to convey information, autoplay video, animate large areas continuously, or delay interaction. `/design-system/motion` is a development-only visual check and includes a reduced-motion simulation switch.

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
