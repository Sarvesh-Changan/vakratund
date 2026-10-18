-- Destructive migration: removes the retired blog content tables and their stored SEO/home-section rows.
-- The shared PublishStatus enum is retained because services, projects, FAQs, and testimonials still use it.
DELETE FROM "PageSeo" WHERE "path" = '/blog';
DELETE FROM "PageSection" WHERE "pageKey" = 'home' AND "sectionKey" = 'insights';

DROP TABLE IF EXISTS "BlogPost";
DROP TABLE IF EXISTS "BlogCategory";
