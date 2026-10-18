"use client";

import { useState } from "react";

import { refreshGalleryLists } from "@/app/(admin)/admin/(protected)/gallery/actions";
import { Tabs } from "@/components/ui";
import type { GalleryCategoryView, GalleryItemView } from "@/server/services/gallery";
import type { GalleryYearView } from "@/server/services/gallery";
import { GalleryCategoriesManager } from "@/components/admin/gallery-categories-manager";
import { GalleryImagesManager } from "@/components/admin/gallery-images-manager";
import { GalleryYearsManager } from "@/components/admin/gallery-years-manager";

export function GalleryManager({ initialCategories, initialYears, initialItems }: { initialCategories: GalleryCategoryView[]; initialYears: GalleryYearView[]; initialItems: GalleryItemView[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [years, setYears] = useState(initialYears);
  const [items, setItems] = useState(initialItems);
  async function reload(): Promise<void> {
    const result = await refreshGalleryLists();
    if (result.ok) { setCategories(result.data.categories); setYears(result.data.years); setItems(result.data.items); }
  }
  return <Tabs defaultTab="images" tabs={[
    { id: "categories", label: "Categories", content: <GalleryCategoriesManager categories={categories} onReload={reload} /> },
    { id: "years", label: "Years", content: <GalleryYearsManager years={years} onReload={reload} /> },
    { id: "images", label: "Images", content: <GalleryImagesManager categories={categories} years={years} items={items} onReload={reload} onItemsChange={setItems} /> },
  ]} />;
}
