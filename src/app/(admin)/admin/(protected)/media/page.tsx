import { MediaLibrary } from "@/components/admin/media-library";
import { PageHeader } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { listMediaAssets } from "@/server/services/media";

export default async function MediaPage() {
  await requirePermission("media:write");
  const assets = await listMediaAssets();
  return <div className="space-y-8"><PageHeader eyebrow="Content workspace" title="Media library" description="Upload, organize, describe, and safely reuse Cloudinary media across the website." /><MediaLibrary initialAssets={assets} /></div>;
}
