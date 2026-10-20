# Estimator UX audit and simplification

This audit covers the twelve estimator records currently seeded in `prisma/seed.ts`.
The project documentation calls the service list eleven items, but the repository
retains two approved local landing-page records, so both are included here.

“Visible fields today” describes the configuration before this simplification:
the shared area, floors and location fields plus specification and add-ons for
priced services. Required means the field is required by the estimator config;
contact fields are not included in this table.

| Service | Today: visible / required / optional / steps | Target: core / required / optional extras / steps | Advanced after simplification |
|---|---:|---:|---|
| Building Construction | 5 / 3 / 2 / 4 | 4 / 2 / 2 / 3 | Add-ons |
| PMC & Turnkey Project Development | 3 / 2 / 1 / 4 | 3 / 2 / 1 / 3 | None |
| Redevelopment Project Management | 3 / 2 / 1 / 4 | 3 / 2 / 1 / 3 | None |
| Structural Repairs & Rehabilitation | 3 / 2 / 1 / 4 | 3 / 2 / 1 / 3 | None |
| Piling Work & Foundation | 3 / 2 / 1 / 4 | 3 / 2 / 1 / 3 | None |
| Waterproofing Solutions | 5 / 3 / 2 / 4 | 4 / 2 / 2 / 3 | Add-ons |
| Damp Proofing | 5 / 3 / 2 / 4 | 4 / 2 / 2 / 3 | Add-ons |
| Painting Works | 5 / 3 / 2 / 4 | 4 / 2 / 2 / 3 | Add-ons |
| Plumbing & Drainage Works | 3 / 2 / 1 / 4 | 3 / 2 / 1 / 3 | None |
| Interior Works | 5 / 3 / 2 / 4 | 4 / 2 / 2 / 3 | Add-ons |
| Road Works | 3 / 2 / 1 / 4 | 3 / 2 / 1 / 3 | None |
| Fabrication Work & Porta House | 5 / 3 / 2 / 4 | 4 / 2 / 2 / 3 | Add-ons |

## Interaction changes

- Step 1 is a service choice grouped into “Get an estimate” and “Needs a site inspection”. A service card advances immediately.
- Step 2 contains only core project questions. Number fields have configured quick picks and visible units; configured defaults keep the first valid result available.
- Optional add-ons are collapsed and show a selected-count badge. No contact information is stored in session storage before Step 3.
- Step 3 asks for name and phone, with email, notes and editable location optional in the UI. The existing server action still receives the validated contact shape and performs its existing checks.
- The range summary is sticky on desktop and becomes a focus-trapped bottom sheet on mobile. Call and WhatsApp escape hatches remain visible in every step.

## Configuration rules

An active service should have no more than five active non-advanced fields. Advanced
fields are never required. `isAdvanced` is intended for optional extras, not for
fields needed to calculate a safe result. The admin builder warns when a service
exceeds five core questions but does not silently change the administrator’s
configuration.
