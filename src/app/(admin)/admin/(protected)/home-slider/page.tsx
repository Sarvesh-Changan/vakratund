import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { getHomeShowcaseSettings, listAdminHomeSlides } from "@/server/services/home-slides";
import { HomeSliderManager } from "@/components/admin/home-slider-manager";

export const metadata: Metadata = {
  title: "Home Slider — Admin",
  description: "Manage homepage moving photo slider and presentation settings.",
};

export default async function AdminHomeSliderPage() {
  await requirePermission("content:write");
  const [slides, settings] = await Promise.all([
    listAdminHomeSlides(),
    getHomeShowcaseSettings(),
  ]);

  return <HomeSliderManager initialSlides={slides} initialSettings={settings} />;
}

