import { PageHeader, PagesContentEditor } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { listPageSections } from "@/server/services/pages";
import { listMediaAssets } from "@/server/services/media";
export default async function PagesPage() { await requirePermission("content:write"); const [sections, media] = await Promise.all([listPageSections(), listMediaAssets()]); return <div className="space-y-8"><PageHeader title="Pages" description="Edit structured home and about sections with validated text fields." breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Pages" }]} /><PagesContentEditor initial={sections} assets={media.filter((asset) => asset.kind === "IMAGE")} /></div>; }
