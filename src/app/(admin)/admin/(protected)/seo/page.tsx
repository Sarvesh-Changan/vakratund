import { PageHeader, SeoEditor } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { SEO_PATHS } from "@/lib/validation/seo";
import { listPageSeo } from "@/server/services/seo";
import { listMediaAssets } from "@/server/services/media";
export default async function SeoPage() { await requirePermission("seo:write"); const [rows, media] = await Promise.all([listPageSeo(), listMediaAssets()]); return <div className="space-y-8"><PageHeader title="SEO" description="Manage metadata and indexation for static pages." breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "SEO" }]} /><SeoEditor initial={rows} assets={media.filter((asset) => asset.kind === "IMAGE")} /><section className="grid gap-3 rounded-panel border bg-white p-5"><h2 className="font-display text-xl">Sitemap preview</h2><pre className="overflow-auto text-xs">{SEO_PATHS.map((path) => `<url><loc>${path}</loc></url>`).join("\n")}</pre><h2 className="font-display text-xl">Robots preview</h2><pre className="text-xs">User-agent: *{"\n"}Allow: /{"\n"}Disallow: /admin/{"\n"}Disallow: /api/</pre></section></div>; }
