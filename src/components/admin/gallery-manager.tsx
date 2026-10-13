"use client";

import { useState } from "react";

import { refreshGalleryLists } from "@/app/(admin)/admin/(protected)/gallery/actions";
import { Tabs } from "@/components/ui";
import type { GalleryCategoryView, GalleryItemView } from "@/server/services/gallery";
import { GalleryCategoriesManager } from "@/components/admin/gallery-categories-manager";
import { GalleryImagesManager } from "@/components/admin/gallery-images-manager";

export function GalleryManager({ initialCategories, initialItems }: { initialCategories: GalleryCategoryView[]; initialItems: GalleryItemView[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  async function reload(): Promise<void> {
    const result = await refreshGalleryLists();
    if (result.ok) { setCategories(result.data.categories); setItems(result.data.items); }
  }
  return <Tabs defaultTab="images" tabs={[
    { id: "categories", label: "Categories", content: <GalleryCategoriesManager categories={categories} onReload={reload} /> },
    { id: "images", label: "Images", content: <GalleryImagesManager categories={categories} items={items} onReload={reload} onItemsChange={setItems} /> },
  ]} />;
}
