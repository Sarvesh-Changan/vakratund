"use client";

import type { ReactNode } from "react";
import { Dialog } from "./dialog";
import { cn } from "@/lib/utils";

export interface SheetProps { open: boolean; onClose: () => void; title: string; children: ReactNode; }
export function Sheet({ open, onClose, title, children }: SheetProps) { return <Dialog open={open} onClose={onClose} title={title} className={cn("m-0 ml-auto min-h-full w-[min(90vw,28rem)] max-w-none rounded-none rounded-l-panel")}><div className="min-w-[min(80vw,24rem)]">{children}</div></Dialog>; }
