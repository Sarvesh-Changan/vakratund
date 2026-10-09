import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/estimate/thank-you", "/contact/thank-you", "/project-enquiry/thank-you", "/download/company-profile/thank-you", "/thank-you"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
