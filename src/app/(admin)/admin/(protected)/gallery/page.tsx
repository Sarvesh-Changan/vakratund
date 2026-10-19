import { GalleryManager } from "@/components/admin/gallery-manager";
import { requirePermission } from "@/lib/auth/session";
import { listGalleryCategories, listGalleryItems, listGalleryYears } from "@/server/services/gallery";

export default async function GalleryPage() {
  await requirePermission("content:write");
  const [categories, years, items] = await Promise.all([listGalleryCategories(), listGalleryYears(), listGalleryItems()]);
  return <GalleryManager initialCategories={categories} initialYears={years} initialItems={items} />;
}

