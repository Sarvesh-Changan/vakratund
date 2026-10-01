# PRD — Vakratund Construction Website Rebuild

Version 1.0 · Status: Draft for build · Source of truth for business content: client PDF (see `CONTENT.md`)

---

## 1. Background
M/s. Vakratund Construction (est. 2003, Thane, Maharashtra) is a civil engineering concern offering
PMC and turnkey project development, redevelopment project management, structural repair and
rehabilitation, waterproofing, painting, plumbing, interiors, piling, road works and porta-house
fabrication. Proprietor: Engr. Salil S. Chawan. The current website does not generate measurable
leads and cannot be fully managed by the client.

> Note: the business is **B2B/society-focused** (co-op housing societies, corporate offices,
> redevelopment owners) as well as individual owners. Messaging and the estimator must reflect this.

## 2. Goals and success metrics
| Goal | Metric (90 days after launch) |
|---|---|
| Generate leads | ≥ 3% visitor→lead conversion on `/estimate` and `/contact` |
| Build trust | Credentials, real projects and testimonials visible above the fold on Home |
| Self-management | Client edits any content without a developer (target: 100% of public content) |
| Performance | Lighthouse mobile ≥ 90 Performance, ≥ 95 SEO/Accessibility/Best Practices; LCP < 2.5s, CLS < 0.1, INP < 200ms |
| Local SEO | Rank for "structural audit Thane", "terrace waterproofing Thane", "building repair contractor Thane" (tracked, not guaranteed) |

## 3. Users
1. **Society committee member / secretary** — needs structural audit, repairs, redevelopment PMC; cautious, wants credentials and past society work.
2. **Individual property owner** — wants new construction, renovation, waterproofing, painting, interiors; wants a rough price.
3. **Corporate / commercial client** — strong room, commercial construction, maintenance contracts.
4. **Client admin (Engr. Salil / staff)** — manages content and leads on mobile and desktop.
5. **Sales staff** — works leads only.

## 4. Scope
### In scope (v1)
Public website, estimator, lead capture and pipeline, admin CMS, media management, SEO,
email notification, WhatsApp/call integrations, analytics events, deployment on Vercel + Neon.

### Out of scope (v1)
Online payments, customer portal, multi-language (Marathi planned for v1.1), live chat, CRM
integrations, native apps. Keep data model extensible for them.

## 5. Functional requirements

### 5.1 Public website
| ID | Requirement | Acceptance criteria |
|---|---|---|
| PUB-1 | Home page | Hero with primary CTA "Get Free Quote" and secondary "Call Now"; stats (since 2003, projects, sqft built); services; featured projects; process; credentials; testimonials; FAQ teaser; final CTA. All content is DB-driven. |
| PUB-2 | About | Company story, mission, proprietor and team (4 members from PDF), credentials (MSME, workmen's compensation insurance), experience stats. |
| PUB-3 | Services | Index + one detail page per service (11 seeded). Each has description, scope bullets, process, related projects, gallery, FAQs, CTA. |
| PUB-4 | Projects | Index with filters (service, status, year); detail page with gallery, scope, area, floors, location, status, optional client name (toggle), before/after pairs. |
| PUB-5 | Gallery | Category-filtered grid, lazy-loaded, keyboard-accessible lightbox. |
| PUB-6 | Testimonials | Cards with name, role/society, rating optional; shown on Home, About and relevant services. |
| PUB-7 | Blog | Index, category filter, detail page with ToC, author, reading time, related posts, Article schema. |
| PUB-8 | FAQs | Grouped by service/general; FAQPage schema. |
| PUB-9 | Contact | Form, map embed, address, phones, email, WhatsApp, hours. |
| PUB-10 | Estimator | See 5.2. |
| PUB-11 | Brochure download | Company profile PDF gated by lead form (name, phone, email); download link returned after submit; lead stored with type `BROCHURE`. |
| PUB-12 | Global CTAs | Sticky mobile bar (Call / WhatsApp / Quote), floating WhatsApp button, header CTA. |
| PUB-13 | Legal & errors | Privacy policy, Terms, 404, 500, loading skeletons. |

### 5.2 Estimator (database-driven)
| ID | Requirement | Acceptance criteria |
|---|---|---|
| EST-1 | Service selection | Visitor picks a service type configured in DB (e.g., New Building Construction, Painting, Waterproofing, Interiors, Porta House). |
| EST-2 | Dynamic questions | Fields, options, order, help text and visibility rules come from DB (area, floors, location zone, specification level, add-ons). |
| EST-3 | Live estimate | Result is a **range** (low–high) with a breakdown and disclaimer, calculated by the server-side pure function; client preview uses the same function. |
| EST-4 | Inspection-only services | Services with `pricingMode = INSPECTION_ONLY` (structural repair, rehabilitation, piling, PMC) skip price and go to "Request site inspection". |
| EST-5 | Lead capture | After seeing the estimate: name, phone (India format), email, location, requirements, consent checkbox. |
| EST-6 | Persistence | Lead + Quote stored with an immutable **config snapshot** so later price edits never change old quotes. |
| EST-7 | Notifications | Admin email on new lead; visitor confirmation email with estimate summary. |
| EST-8 | Admin control | Admin edits services, fields, options, rates, multipliers, rules, spread %, minimum charge, disclaimer without code; includes a **test sandbox** to preview calculations. |
| EST-9 | Safety | All inputs validated server-side; area min/max enforced; rate limited; no price shown if configuration is incomplete. |

### 5.3 Lead generation
| ID | Requirement |
|---|---|
| LEAD-1 | Capture source page, referrer, UTM params, device, timestamp (IP stored only as hash). |
| LEAD-2 | Types: `QUOTE`, `CONTACT`, `PROJECT_ENQUIRY`, `BROCHURE`, `INSPECTION`. Call/WhatsApp clicks logged as `ContactEvent`. |
| LEAD-3 | Pipeline: NEW → CONTACTED → QUALIFIED → CONVERTED → CLOSED with status history, notes, assignee, follow-up date. |
| LEAD-4 | Duplicate detection by phone within 30 days (flag, don't discard). |
| LEAD-5 | Thank-you pages per lead type with next steps and optional conversion tracking event. |
| LEAD-6 | CSV export (role-restricted). |

### 5.4 Admin dashboard
| ID | Module | Capabilities |
|---|---|---|
| ADM-1 | Dashboard | Leads by day/status/source, conversion rate, top pages, recent leads, quotes value range, quick actions. |
| ADM-2 | Leads & Quotes | List, filter, search, detail, status change, notes, assign, export. |
| ADM-3 | Estimator | CRUD for services, fields, options, location zones, rules; sandbox; version bump on publish. |
| ADM-4 | Projects | CRUD, drag-order, featured, publish/draft, media attach, SEO. |
| ADM-5 | Services | CRUD, order, FAQs, SEO, icon/image. |
| ADM-6 | Testimonials, FAQs, Team | CRUD, order, publish. |
| ADM-7 | Blog | CRUD, Markdown editor with preview, categories, scheduled publish, SEO. |
| ADM-8 | Gallery & Media | Cloudinary uploads (signed), library, alt text required, delete with usage check. |
| ADM-9 | Pages/content | Edit Home hero, stats, About text, CTA copy via structured sections (no HTML injection). |
| ADM-10 | SEO | Per-page and per-entity title/description/OG image/canonical/noindex; sitemap and robots preview. |
| ADM-11 | Settings | Business info, phones, email, address, hours, social links, WhatsApp number/message, brochure file, email recipients. |
| ADM-12 | Users & roles | SUPER_ADMIN manages users; roles SUPER_ADMIN, ADMIN, EDITOR, SALES; deactivate users; password reset. |
| ADM-13 | Activity log | Who did what, when; filterable; immutable. |

### 5.5 Role access (summary; full matrix in `SECURITY.md`)
SUPER_ADMIN everything · ADMIN everything except user management · EDITOR content only (no leads, no estimator pricing) · SALES leads/quotes only.

## 6. Non-functional requirements
- **Performance:** SSG/ISR for public pages; image optimization via Cloudinary + `next/image`; JS budget per page < 170 KB gzipped on content pages.
- **SEO:** metadata API, sitemap.xml, robots.txt, canonical URLs, JSON-LD (LocalBusiness/GeneralContractor, Service, BreadcrumbList, FAQPage, Article, Project as CreativeWork), clean slugs, OG images.
- **Accessibility:** WCAG 2.2 AA; keyboard navigation; reduced-motion support; contrast checked.
- **Responsive:** mobile-first; tested at 360, 390, 768, 1024, 1280, 1536 px.
- **Security:** see `SECURITY.md`.
- **Reliability:** graceful degradation if email or Cloudinary is down (lead is still saved).
- **Maintainability:** typed, documented, tested core logic; ADRs for decisions.
- **Compliance:** India DPDP Act 2023 aware — explicit consent on forms, privacy policy, data retention and deletion process.

## 7. Content requirements and gaps
Real content is in `CONTENT.md`. Items needing the client (`TODO(client)`): logo and brand assets,
original project photos, office address, email, GST/MSME numbers, testimonials, permission to publish
client names, estimator base rates, brochure PDF final version, WhatsApp Business number, domain access.

## 8. Release plan
| Milestone | Contents |
|---|---|
| M1 Foundation | Project, design system, DB, auth, admin shell |
| M2 CMS | Media + all content modules |
| M3 Public site | All public pages with seeded content |
| M4 Estimator & Leads | Engine, admin, public flow, notifications |
| M5 Hardening | SEO, security, performance, accessibility, tests |
| M6 Launch | Production deploy, content load, handover, training |

## 9. Risks
| Risk | Mitigation |
|---|---|
| Low-quality legacy photos | Request originals; design handles mixed quality with consistent crop/overlay |
| Estimator seen as binding quote | Prominent disclaimer, ranges, "subject to site inspection" |
| Publishing client names without consent | Per-project "show client name" toggle default off |
| Scope creep | Phase gates in `BUILD_GUIDE.md`; change requests logged as ADRs |

## 10. Open questions
1. Estimator service list and real base rates per service (client to provide).
2. Is a Marathi version required at launch?
3. Preferred email provider/domain for notifications.
4. Analytics: GA4 only, or also Meta Pixel / Google Ads conversion tracking?
