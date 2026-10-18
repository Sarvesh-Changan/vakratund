import { GalleryManager } from "@/components/admin/gallery-manager";
import { PageHeader } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { listGalleryCategories, listGalleryItems, listGalleryYears } from "@/server/services/gallery";

export default async function GalleryPage() {
  await requirePermission("content:write");
  const [categories, years, items] = await Promise.all([listGalleryCategories(), listGalleryYears(), listGalleryItems()]);
  return <div className="space-y-8"><PageHeader title="Gallery" eyebrow="Content workspace" description="Manage gallery categories, years, uploads, and the media shown publicly." /><GalleryManager initialCategories={categories} initialYears={years} initialItems={items} /></div>;
}

