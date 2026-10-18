# Design reference: Sphere Digital Recruitment homepage

> Reference-only analysis for Vakratund Construction. This document describes visual patterns and behavior; it does not reproduce the reference site's copy, imagery, branding, icons, or implementation. Its palette is observational, not a recommendation to replace the Vakratund tokens.

## Scope and method

Re-read the [Sphere Digital Recruitment homepage](https://www.spheredigitalrecruitment.com/) on 16 October 2026 in Chromium at 1440 × 900 and 390 × 844 CSS pixels. The desktop and mobile passes checked the rendered page, section transitions, hero/header treatment, card surfaces, closing CTA and footer; the desktop header was also checked after scrolling. Hex values below are conversions of the computed RGB colors. Easing/implementation descriptions are marked as likely where source inspection was not part of this review. Screenshots are provided as visual evidence; numbered markers are annotations added for this report.

### Browser sampling pass — 17 October 2026

The reference was reopened at 1440px desktop and 390px mobile. The rendered rhythm stayed consistent: white page fields, a cool lavender-tint band, a deep dark editorial field, then a pastel closing CTA and dark footer. These are sampled approximations and are adapted for Vakratund rather than copied as a token sheet.

| Role | Sampled / adapted value | Notes |
|---|---|---|
| Page white | `#FFFFFF` | dominant light field |
| Tinted section | `#F0F1F8` | screenshot estimate `#EFEDFB` has the same role |
| Dark section | `#1B1B1F` | adapted to `--dark: #1B1A2B` |
| Primary accent | `#9787FA` | adapted to `--accent: #8B7CF6` |
| Secondary accent | `#89F0CA` | adapted to `--accent-2: #9BF0CF` |
| Heading text | `#1B1B1F` | adapted to `--ink: #1B1A2B` |
| Muted text | approximately `#5D5C67` | selected for AA on white and tint |
| Border / neutral control | `#E7E7E8` | adapted to `--line: #E7E7EA` |
| Glow 1 / 2 / 3 | pink / peach / mint | `#F7C8DE`, `#F8D7B6`, `#BFEEDD` |
| CTA gradient | lavender → pale pink → mint | `.section-gradient` / `bg-cta-gradient` |

Desktop keeps broad flat fields and generous whitespace. Mobile retains the same sequence, recrops the hero, stacks columns and makes content rails touch-friendly. The implementation does not import the reference's copy, photos, logo, icons, source code or exact composition.

### Screenshots

- [Annotated desktop first viewport — 1440px](design-reference/annotated-home-desktop-1440.png)
- [Annotated mobile first viewport — 390px](design-reference/annotated-home-mobile-390.png)
- [Desktop homepage, full page](design-reference/home-desktop-1440.png)
- [Mobile homepage, full page](design-reference/home-mobile-390.png)

## 1. Typography

The rendered page loads **Google Sans** in 400, 500 and 700 weights. Body copy is 16px/approximately 24px. Display and heading text are bold, tightly tracked, with an unusually large desktop scale. These sizes are measured examples, not a complete type ramp.

| Role | Desktop (1440px) | Mobile (390px) | Treatment |
|---|---|---|---|
| Hero display | 122px / 130px line-height, 700, −6.1px tracking | 62px / 70px, 700, −3.1px | Centered; one word gets a purple gradient; mixed white/purple; sentence case |
| Primary section headline | commonly 72px / 80px, 700, −3.6px | commonly 42px / 50px, 700, −2.1px | Sentence case, dark ink on light sections; white on dark section |
| Card/row headline | 32px / 40px, 700 | 26px / 34px | Tight negative tracking |
| Small editorial headline | 26px / 34px, 700 | 20px / 28px | Tight negative tracking |
| Eyebrow / kicker | 16px / 24px, 400 | 14px / 22px, 400 | Uppercase, muted; little or no additional tracking |
| Body / navigation | 16px / about 24px, 400–500 | 16px / about 24px, 400–500 | Mostly sentence case; compact metadata can be smaller |

Headlines use strong size contrast rather than decorative font changes. Negative tracking is consistent on large weights. Small section labels are uppercase; buttons and some navigation labels are also uppercase. The hero text is deliberately broken into a short stack and remains very large on mobile.

**Vakratund adaptation:** retain Sora/Inter from [DESIGN.md](DESIGN.md), but adapt the hierarchy rather than importing the reference's 122px display size. The project scale calls for 40–72px display, 26–38px section headings and a minimum 16px mobile body; keep line length around 68ch and body leading near 1.6.

## 2. Color usage

Observed computed palette (reference-site colors only):

| Use | Approximate hex | Observation |
|---|---|---|
| Main canvas / broad light sections | `#FFFFFF` | Dominant background; long white runs |
| Main text / dark panel | `#1B1B1F` | Near-black charcoal for type and a large editorial panel |
| Alternate pale surface | `#F0F1F8` | Cool lavender-gray band behind jobs/services/stat content |
| Accent purple | `#9787FA` | Buttons, highlighted hero word and CTA gradient |
| Accent mint | `#89F0CA` | Secondary action and gradient highlight |
| Neutral control fill | `#E7E7E8` | Small utility controls |
| Hero image overlay | `rgba(0,0,0,.5)` | Darkens the photo collage for white text |
| CTA field | gradient, purple → pale pink → mint | Full-width closing conversion panel |

### Current page-background rhythm

The live page does not use a single background color throughout. Its visible sequence is:

1. A darkened, full-bleed photo field for the hero, with the fixed header floating above it.
2. A long white proposition/intro area with dark near-black text.
3. A pale lavender-gray band (`#F0F1F8`) for industry, job and metric-led content.
4. White image-led case-study and service areas, where photos supply most of the color.
5. A near-black editorial/leadership feature (`#1B1B1F`) with white type and high-contrast statistics.
6. A return to white or pale neutral metric/insight sections.
7. A saturated purple–pink–mint gradient closing CTA, followed by a dark footer with grouped links and contact details.

On mobile, the same sequence remains intact: the hero is re-cropped, multi-column areas stack, and rails become touch-friendly horizontal groups. The pale band and closing gradient are not removed to simplify the page. This is the strongest reference lesson for Vakratund: vary the background field by story purpose, instead of repeating one dark surface or one orange band.

### Accent and text usage

Purple is used as a focused action/highlight color, not as a page-wide fill: it appears in key buttons, one highlighted hero word, selected controls and the opening side of the closing gradient. Mint is the secondary action/highlight color and appears mainly in the closing gradient and selected supporting controls. A neutral gray (`#E7E7E8`) is used for compact utility controls. The dominant text is near-black (`#1B1B1F`) on light surfaces; hero/dark editorial text is white; muted copy is materially lower contrast but remains visually subordinate. Images, rather than color accents, carry most of the saturation in the case-study areas.

Vakratund borrows the focus and restraint of this accent usage through `ACCENT_SET: REFERENCE`. The existing construction orange is retained only as the small logo-mark signature token; it is not used for page bands or repeated buttons. Images provide most of the visual color.

## 3. Layout and image treatment

- **Container:** visually broad but not uniformly full bleed. At 1440px, some large headings occupy about 877px and others about 652px; hero collage reaches almost the full 1440px width. These are observed content widths, not a claim that every section shares one max-width container. Desktop side gutters on ordinary content appear around 55–70px.
- **Grid:** editorial two-column compositions recur, pairing a large statement or graphic with imagery. Content tiles and featured work use horizontal rails/carousels; job and insight lists are cards. At 390px these layouts stack or become swipeable rails rather than shrinking desktop columns.
- **Vertical rhythm:** broad blocks with generous whitespace. At desktop, the sampled section labels were roughly 400–650px apart in document flow; mobile sections become longer due to stacked content, and the full document measured about 9,884px at 390px versus about 9,200px at 1440px. These heights depend on dynamic content and are not design tokens.
- **Corners:** featured case-study image/card measured around 15px radius; pill buttons and chips are strongly rounded (around 20px or fully pill-shaped). The hero collage uses rounded image tiles and a broad rounded lower edge. The overall system favors soft corners, not square-edged construction detail.
- **Borders/shadows:** cards rely more on surface contrast and image framing than visible borders. Some buttons/cards use a light shadow or no obvious shadow; controls can use a solid white plate. The dominant card recipe is a rounded image crop plus a compact label/metric treatment, not a boxed panel with multiple nested borders. Avoid treating every tile as a bordered card.
- **Gradients:** the distinctive gradient is reserved for the full-width closing conversion field, moving from purple through pale pink into mint. A gradient also highlights a hero word/button state, but the broad page fields remain flat white, pale lavender-gray or charcoal.
- **Images:** editorial people and client/culture photography use mixed tile sizes and crops. The hero is a dark, full-bleed collage of rounded photo tiles behind centered type. Feature cards use large edge-to-edge image crops with text and translucent metric overlays. Sampled sources included AVIF and WebP, plus SVG/JPG/PNG; image sources had responsive size variants. The hero's photo grid is the site's main visual signature and should not be recreated for Vakratund. Vakratund's adaptation should use one approved project image per focal section, consistent crops, and a restrained dark readability overlay rather than a collage.

## 4. Home-page section blueprint

Visual order and purpose, from top to bottom:

1. **Floating header over photo field** — brand mark, two primary audience actions and a compact menu/account/language control.
2. **Photo-collage hero** — oversized centered statement, supporting intro and a route into featured work; establishes energy and visual identity.
3. **Partner/client logo strip** — trust and recognition between the hero and narrative content.
4. **Introductory proposition** — short uppercase eyebrow, large centered statement, small proof/CTA elements.
5. **Industry selector** — large heading and a visual set of industry choices.
6. **Featured customer stories** — prominent image cards with overlaid outcomes and a horizontal browsing pattern.
7. **Worldwide presence** — globe/orbit-style graphic beside a short location statement and contact action.
8. **Featured jobs** — pale surface with role cards, metadata, and an all-jobs action.
9. **Services overview** — editorial introduction with image and a compact accordion/list of service categories.
10. **Dark editorial / leadership feature** — large image and statement with supporting narrative, followed by supporting statistics and a hiring action.
11. **Recent performance numbers** — a distinct light metric band with one CTA.
12. **Latest insights** — editorial cards/rail and link to the broader insight collection.
13. **Closing conversion panel** — full-width gradient field and two clear audience actions.
14. **Footer** — grouped navigation, social links, contact details, legal links and copyright.

For Vakratund, preserve the useful story arc (proof → services → project evidence → process/team → conversion), but use actual approved company content from [CONTENT.md](CONTENT.md). Do not imitate recruitment-specific sections or invent proof metrics.

## 5. Header and navigation

- The main header is `position: fixed`; measured height was about 115px desktop and 95px mobile. It overlays the dark hero rather than occupying a conventional separate solid nav band.
- Desktop places the logo/primary actions on the left and a compact white utility/menu plate to the right. Mobile preserves the brand mark and condenses controls into a floating capsule.
- Menu opens a large grouped navigation panel with category headings, link groups and featured content; this behaves more like a mega-menu than a tiny list. Mobile presents a narrow, vertically stacked panel with expandable grouped links (accordion/drawer behavior).
- The header's CSS declares a 0.4s transform transition. A scroll check at approximately 1200px found the same fixed position, height and visible transform as at the top; no clear shrink or solid-background swap was observed in this pass. The transition may support hide/reveal states triggered by scroll direction, but that was not established here.
- Buttons visibly use rounded, high-contrast fills. Hover affordances are expected from the declared 0.4s background/color/radius transitions on controls; hover color deltas were not exhaustively sampled. Keyboard focus styling was not audited.

**Adaptation:** Vakratund's own design blueprint calls for a transparent-to-solid header over the hero. Use that behavior only if it remains readable over real project photography, keep the quote CTA explicit, and make the mobile menu operable by keyboard and touch.

## 6. Motion inventory

Observed CSS declarations and visual behavior; likely implementation is an informed inference, not a source-code claim.

| Effect | What moves / trigger | Approx. timing and easing | Likely construction / notes |
|---|---|---|---|
| Logo/client rail | Long horizontal strip of brand marks moves continuously; runs on page load | 96s, linear, infinite | CSS keyframe marquee; many indexed animation names were present |
| Orbit/world graphic | Circular graphic layers rotate continuously in opposite directions | 60s, linear, infinite | CSS keyframes on nested elements; two directions observed |
| Header/control transition | Header/control transforms and menu button styling respond to state/interaction | 0.4s for header transform; menu color/background/radius also 0.4s | CSS transition; scroll state change itself was not reproduced during the check |
| Hero text treatment | A word is gradient-colored; no independent motion was measured | No animation detected in computed CSS | Static typographic treatment in sampled frame |
| Section reveals / text reveals | No consistent fade/slide reveal could be confirmed from computed styles or the two viewport captures | Not established | Could use script-driven behavior, but there is insufficient evidence to assign IntersectionObserver or a library |
| Counters | Metric values are visible in their sections; count-up behavior was not timed in this review | Not established | Do not assume count-up without a time-series test |
| Cards / image hover | Rounded image cards and controls invite hover; exact image zoom/lift delta was not measured | Control transition around 0.4s; card timing unknown | Likely CSS transitions; no claim of a specific transform |
| Marquee/rail on mobile | Rail presentation narrows into swipeable content; active continuous motion could remain | 96s if same animation rule applies | Touch interaction is likely native carousel/slider behavior; exact library not identified |
| Page transition, cursor effect, parallax | None clearly observed in this pass | None established | Avoid adding these to the adaptation based on assumption |

No video autoplay was observed in the captured first view. No distinct scroll-linked parallax depth or layered offset could be reliably measured; the hero does use multiple image layers but appears primarily as a collage, not confirmed parallax.

## 7. Mobile behavior

- At 390px the display headline scales from 122px to 62px and section headline examples from 72px to 42px; card/row headings also step down. Eyebrows reduce from 16px to 14px. Body/navigation remains around 16px.
- The desktop's multi-column text/image arrangements stack, while the header compacts and complex nav becomes a vertically grouped panel. Horizontal case-study/job/content rails are better suited to touch than forcing a dense grid.
- Hero remains image-led and full bleed, with a centered headline. The number of visible collage tiles is reduced/re-cropped, not replaced by a plain banner.
- Large light/dark section fields and the closing gradient are retained on mobile. Long page length is managed by stacking rather than removing whole sections.
- No clear mobile-specific animation removal was seen. The site still had 96s/60s infinite CSS animations in the mobile viewport. This is a point to improve in our own adaptation: simplify or stop nonessential motion under `prefers-reduced-motion` and consider whether ambient loops are useful on a phone at all.

## 8. Performance and accessibility observations

**Positive signals:** responsive image variants were present; sampled image URLs included AVIF and WebP, which suggests format optimization. Many content images had `loading="lazy"`. The page uses native text for headings rather than baking all typography into imagery. The key menu button exposed an accessible label in the tested markup.

**Cautions / not measured:** several sampled image elements exposed empty `alt` values; some may be decorative, but meaningful editorial imagery should be checked individually. Loading every image or slider state was outside this review. A full Lighthouse/Core Web Vitals run was not performed, so no claims are made about LCP, CLS, total transfer size, or real-device performance. Layout shift was not instrumented; responsive image dimensions and reserved aspect ratios should be verified before adoption. Focus order, visible focus, contrast across overlays, screen-reader naming, menu focus management, and carousel controls were not comprehensively audited.

With reduced motion emulated, the sampled infinite 96s and 60s animations still reported nonzero durations. That indicates those particular loops were not disabled by the observed reduced-motion CSS in this browser session. For Vakratund, follow [DESIGN.md](DESIGN.md): remove transforms/parallax and disable nonessential loops under `prefers-reduced-motion`; preserve content and functionality.

## 9. What we should adapt for a construction company

1. Use a large, confident hero statement, but keep it within Vakratund's own Sora scale and factual voice.
2. Lead with one genuine, high-resolution project image and a dark readability gradient; use approved project media rather than stock people/culture photos.
3. Follow the hero with compact trust evidence: MSME registration, insured workforce and confirmed project facts from [CONTENT.md](CONTENT.md), not invented totals.
4. Make service discovery visual and scannable; map the real service catalog into cards or a concise, accessible accordion.
5. Give project case studies a strong image, concise scope, location when approved, and a factual status badge; keep client names hidden until permission is given.
6. Use horizontal project cards on mobile only when swipe affordance and keyboard alternatives are clear; otherwise use a simple one-column list.
7. Pair a short process/story section with a real site-work or engineering photo to communicate how the firm works.
8. Add proof near relevant services: before/after repairs, waterproofing stages, building facts and team credentials from approved records.
9. Keep a persistent, clear “Get Free Quote” or “Request Site Inspection” action; on mobile ensure it does not obscure form fields or the bottom action bar.
10. Use section contrast intentionally—Vakratund's warm beige/white and charcoal from its token system—and reserve motion for small, purposeful transitions that honor reduced motion.

## Recommendation from the theme review

Recommend **ACCENT_SET: REFERENCE**. It captures the reference site's strongest structural lesson—white/light breathing room, a cool alternate band, one substantial dark editorial field, image-led cards and a gradient-led conversion moment—without importing its recruitment imagery, copy, logo, icons or code. Vakratund's orange remains a tiny signature mark, while lavender and mint are used as restrained, accessible interface accents.

The prior A/B/C comparison remains available at `/design-system/themes` for review, but the selected reference palette is now the live token set. Keep the reference-inspired values scoped to Vakratund's own components and content.

### What we must not copy

- No Sphere wording, taglines, recruitment messaging, section copy, logos, client marks, job data, photography, graphics or icons.
- No copied reference palette as branding, text, imagery or identity; use the adapted lavender/mint tokens only as Vakratund interface styling. Keep the orange signature mark intact.
- No recreation of the exact image-tile hero collage, orbit graphic, client-logo strip, page composition or card styling as a pixel-level clone.
- No unverified project counts, area totals, claims, customer names or testimonials for Vakratund. Use only approved facts from `CONTENT.md` and client permissions.
- No continuous marquees, rotating diagrams, parallax or auto-moving carousels by default; avoid motion that adds little to construction-service discovery, and always respect reduced-motion preferences.
- No text, metrics, imagery, or animation claims inferred solely from this reference when preparing Vakratund's public copy.
