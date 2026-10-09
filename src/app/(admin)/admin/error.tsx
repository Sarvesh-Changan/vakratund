"use client";
import { AdminModuleError } from "@/components/admin";
export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8"><AdminModuleError reset={reset} /></div>; }
