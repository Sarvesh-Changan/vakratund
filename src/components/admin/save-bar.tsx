"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui";

export function SaveBar({ dirty, saving = false, onSave, onDiscard }: { dirty: boolean; saving?: boolean; onSave: () => void; onDiscard: () => void }) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (!dirty) return null;
  return <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-surface/95 p-3 shadow-raised backdrop-blur sm:bottom-4 sm:left-auto sm:right-4 sm:w-auto sm:rounded-card sm:border"><div className="flex items-center justify-end gap-3"><span className="mr-auto text-sm text-ink-muted sm:mr-3">Unsaved changes</span><Button type="button" variant="ghost" size="sm" onClick={onDiscard}>Discard</Button><Button type="button" size="sm" loading={saving} onClick={onSave}>Save changes</Button></div></div>;
}
