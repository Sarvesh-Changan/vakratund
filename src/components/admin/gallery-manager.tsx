"use client";

import { CalendarDays, FolderTree, Images, Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { refreshGalleryLists } from "@/app/(admin)/admin/(protected)/gallery/actions";
import { GalleryCategoriesManager } from "@/components/admin/gallery-categories-manager";
import { GalleryImagesManager } from "@/components/admin/gallery-images-manager";
import { GalleryYearsManager } from "@/components/admin/gallery-years-manager";
import { Breadcrumbs, Button } from "@/components/ui";
import type { GalleryCategoryView, GalleryItemView, GalleryYearView } from "@/server/services/gallery";

type GalleryTab = "categories" | "years" | "images";

const tabs: { id: GalleryTab; label: string; icon: typeof Images }[] = [
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "years", label: "Years", icon: CalendarDays },
  { id: "images", label: "Images", icon: Images },
];

export function GalleryManager({ initialCategories, initialYears, initialItems }: { initialCategories: GalleryCategoryView[]; initialYears: GalleryYearView[]; initialItems: GalleryItemView[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState(initialCategories);
  const [years, setYears] = useState(initialYears);
  const [items, setItems] = useState(initialItems);
  const [addImageOpen, setAddImageOpen] = useState(false);
  const requestedTab = searchParams.get("tab") as GalleryTab | null;
  const activeTab = tabs.some((tab) => tab.id === requestedTab) ? requestedTab! : "images";

  const setTab = (tab: GalleryTab) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", tab);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const reload = useCallback(async (): Promise<void> => {
    const result = await refreshGalleryLists();
    if (result.ok) {
      setCategories(result.data.categories);
      setYears(result.data.years);
      setItems(result.data.items);
    }
  }, []);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div>
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Gallery" }]} />
        <div className="mt-5 flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-control border border-accent/30 bg-accent/10 text-accent-ink"><Images size={21} aria-hidden="true" /></span>
          <div><p className="eyebrow">Content workspace</p><h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Gallery Management</h1><p className="mt-2 text-sm text-ink-muted">Manage gallery categories, years and media.</p></div>
        </div>
      </div>
      <Button type="button" onClick={() => setAddImageOpen(true)}><Plus size={17} aria-hidden="true" /> Add Image</Button>
    </div>

    <div role="tablist" aria-label="Gallery sections" className="flex overflow-x-auto border-b border-line">
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} aria-controls={`gallery-${id}-panel`} onClick={() => setTab(id)} className={`inline-flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold ${activeTab === id ? "border-brand-deep text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}><Icon size={17} aria-hidden="true" />{label}</button>)}
    </div>

    {activeTab === "categories" ? <div id="gallery-categories-panel" role="tabpanel"><GalleryCategoriesManager categories={categories} onReload={reload} /></div> : null}
    {activeTab === "years" ? <div id="gallery-years-panel" role="tabpanel"><GalleryYearsManager years={years} onReload={reload} /></div> : null}
    {activeTab === "images" ? <div id="gallery-images-panel" role="tabpanel"><GalleryImagesManager categories={categories} years={years} items={items} onReload={reload} onItemsChange={setItems} uploadOpen={addImageOpen} onUploadOpenChange={setAddImageOpen} /></div> : null}
  </div>;
}
