# SEO post-launch checklist

Use this checklist after the production domain and final client content are live.

## Before launch

- [ ] `TODO(client)`: confirm the canonical production domain in `NEXT_PUBLIC_SITE_URL`.
- [ ] `TODO(client)`: provide the approved office address, business hours, email, social profiles, Google Business Profile URL and WhatsApp Business number.
- [ ] `TODO(client)`: provide the complete inventory of legacy URLs and approved destinations for `src/config/legacy-redirects.ts`.
- [ ] Confirm client permission before enabling `showClientName` for any project.
- [ ] Replace placeholder estimator rates and confirm the estimator disclaimer.
- [ ] Provide approved original project and team images with descriptive alt text.
- [ ] Review every SEO title and description in `/admin/seo` and for each published service and project.
- [ ] Validate JSON-LD with the [Schema Markup Validator](https://validator.schema.org/) and the [Rich Results Test](https://search.google.com/test/rich-results).
- [ ] Validate `/gallery`, its ImageGallery JSON-LD, category/year filters, canonical URL and filtered-view `noindex,follow` behavior.

## Search Console and sitemap

- [ ] Verify the production domain in Google Search Console.
- [ ] Submit `https://<production-domain>/sitemap.xml` in Search Console.
- [ ] Inspect the home page, the three local landing pages, priority service pages, project pages and FAQs.
- [ ] Inspect `/gallery` and confirm only the canonical unfiltered gallery URL is indexed.
- [ ] Confirm `/admin`, `/api` and all thank-you paths are excluded by robots and carry `noindex`.
- [ ] Monitor indexing coverage and canonical warnings after the first crawl.

## Google Business Profile and local SEO

- [ ] Create or claim the Google Business Profile using the approved business name, address, phone numbers and service area.
- [ ] Keep the website URL, phone numbers, hours and service area consistent between the website and the profile.
- [ ] Add approved project photos and service descriptions to the profile.
- [ ] Publish the three local landing URLs in relevant profile updates only after the copy is approved.

## Reviews and authority

- [ ] Ask completed-project contacts for permission before requesting a review or naming the client publicly.
- [ ] Send a direct Google review link after a successful project milestone.
- [ ] Request relevant, legitimate links from approved society, consultant, trade and local business partners.
- [ ] Keep project and service pages updated with verified facts, photographs and publication dates.

## Ongoing measurement

- [ ] Track impressions, clicks, average position and indexed URLs monthly in Search Console.
- [ ] Review lead conversions by landing page and search query quarterly.
- [ ] Refresh internal links when a new service or project is published.
- [ ] Re-test structured data after changing business settings, project visibility or FAQ templates.
