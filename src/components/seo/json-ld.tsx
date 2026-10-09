import type { ResolvedSiteSettings } from "@/config/site";
import { buildArticleJsonLd, buildBreadcrumbListJsonLd, buildCreativeWorkJsonLd, buildFaqPageJsonLd, buildGeneralContractorJsonLd, buildServiceJsonLd, serializeJsonLd, type ArticleJsonLdInput, type BreadcrumbItem, type CreativeWorkJsonLdInput, type FaqJsonLdItem, type ServiceJsonLdInput } from "@/lib/seo/json-ld";

export function JsonLd({ data }: { data: Parameters<typeof serializeJsonLd>[0] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

export function GeneralContractorJsonLd({ settings }: { settings: ResolvedSiteSettings }) {
  return <JsonLd data={buildGeneralContractorJsonLd(settings)} />;
}

export function BreadcrumbJsonLd({ items }: { items: readonly BreadcrumbItem[] }) {
  return <JsonLd data={buildBreadcrumbListJsonLd(items)} />;
}

export function ServiceJsonLd({ service }: { service: ServiceJsonLdInput }) {
  return <JsonLd data={buildServiceJsonLd(service)} />;
}

export function FaqPageJsonLd({ faqs }: { faqs: readonly FaqJsonLdItem[] }) {
  return <JsonLd data={buildFaqPageJsonLd(faqs)} />;
}

export function ArticleJsonLd({ article }: { article: ArticleJsonLdInput }) {
  return <JsonLd data={buildArticleJsonLd(article)} />;
}

export function CreativeWorkJsonLd({ project }: { project: CreativeWorkJsonLdInput }) {
  return <JsonLd data={buildCreativeWorkJsonLd(project)} />;
}
