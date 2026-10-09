"use client";
import { AdminModuleError } from "@/components/admin";
export default function ProtectedAdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <AdminModuleError reset={reset} />; }
