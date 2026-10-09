import { GalleryManager } from "@/components/admin/gallery-manager";
import { PageHeader } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { listGalleryItems } from "@/server/services/gallery";
import { listMediaAssets } from "@/server/services/media";

export default async function GalleryPage() {
  await requirePermission("media:write");
  const [items, assets] = await Promise.all([listGalleryItems(), listMediaAssets()]);
  return <div className="space-y-8"><PageHeader title="Gallery" eyebrow="Content workspace" description="Build the public category-filtered gallery from reusable media assets." /><GalleryManager initialItems={items} assets={assets.filter((asset) => asset.kind !== "DOCUMENT")} /></div>;
}

