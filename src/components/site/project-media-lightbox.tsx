"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CloudImage } from "@/components/cloud-image";
import { HoverCard, MaskImage, Reveal, RevealGroup } from "@/components/motion";
import type { PublishedProjectMedia } from "@/server/queries/projects";

export function ProjectMediaLightbox({ images }: { images: PublishedProjectMedia[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const active = activeIndex === null ? null : (images[activeIndex] ?? null);
  useEffect(() => { const dialog = dialogRef.current; if (!dialog) return; if (active && !dialog.open) { restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; dialog.showModal(); closeRef.current?.focus(); } else if (!active && dialog.open) { dialog.close(); restoreFocusRef.current?.focus(); } }, [active]);
  function step(direction: -1 | 1): void { if (activeIndex === null || images.length < 2) return; setActiveIndex((activeIndex + direction + images.length) % images.length); }
  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>): void { if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); } if (event.key === "ArrowRight") { event.preventDefault(); step(1); } }
  return <>
    <RevealGroup className="grid gap-4 sm:grid-cols-2">
      {images.map((image, index) => <Reveal key={image.id}><HoverCard className="group rounded-card"><button type="button" onClick={() => setActiveIndex(index)} className="block w-full overflow-hidden rounded-card border border-line bg-bg text-left shadow-soft focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2" aria-label={`View ${image.alt}`}><MaskImage><div className="relative aspect-[4/3] overflow-hidden bg-tint"><CloudImage src={image.url} alt={image.alt} fill sizes="(min-width: 768px) 40vw, 100vw" data-hover-image className="object-cover transition-transform duration-700 group-hover:scale-105" /></div></MaskImage><span className="block p-4 text-sm font-semibold text-ink">{image.alt}</span></button></HoverCard></Reveal>)}
    </RevealGroup>
    <dialog ref={dialogRef} aria-label="Project image viewer" onCancel={(event) => { event.preventDefault(); setActiveIndex(null); }} onKeyDown={handleKeyDown} onClick={(event) => { if (event.target === dialogRef.current) setActiveIndex(null); }} className="m-auto max-h-[92vh] w-[min(96vw,72rem)] max-w-none rounded-panel border border-white/15 bg-dark p-0 text-white shadow-raised backdrop:bg-dark/80">
      {active ? <div className="relative"><div className="flex items-center justify-between gap-4 border-b border-white/15 p-3 sm:px-5"><p className="truncate font-semibold">{active.alt}</p><button ref={closeRef} type="button" onClick={() => setActiveIndex(null)} className="flex size-11 items-center justify-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-accent-2" aria-label="Close project image viewer"><X size={20} aria-hidden="true" /></button></div><div className="relative h-[70vh] p-4"><CloudImage src={active.url} alt={active.alt} fill sizes="96vw" className="object-contain" />{images.length > 1 ? <><button type="button" onClick={() => step(-1)} className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-dark/80 text-white focus-visible:outline-2 focus-visible:outline-accent-2" aria-label="Previous project image"><ChevronLeft aria-hidden="true" /></button><button type="button" onClick={() => step(1)} className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-dark/80 text-white focus-visible:outline-2 focus-visible:outline-accent-2" aria-label="Next project image"><ChevronRight aria-hidden="true" /></button></> : null}</div><p className="border-t border-white/15 px-5 py-3 text-sm text-white/70" aria-live="polite">{(activeIndex ?? 0) + 1} of {images.length}</p></div> : null}
    </dialog>
  </>;
}
