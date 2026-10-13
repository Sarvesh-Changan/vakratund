import { GalleryManager } from "@/components/admin/gallery-manager";
import { PageHeader } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { listGalleryCategories, listGalleryItems } from "@/server/services/gallery";

export default async function GalleryPage() {
  await requirePermission("content:write");
  const [categories, items] = await Promise.all([listGalleryCategories(), listGalleryItems()]);
  return <div className="space-y-8"><PageHeader title="Gallery" eyebrow="Content workspace" description="Manage gallery categories, upload construction media, and choose what appears publicly." /><GalleryManager initialCategories={categories} initialItems={items} /></div>;
}

