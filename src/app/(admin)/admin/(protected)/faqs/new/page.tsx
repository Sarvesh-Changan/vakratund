import { FaqForm, PageHeader } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { listServices } from "@/server/services/services";

export default async function NewFaqPage() { await requirePermission("content:write"); const services = await listServices(); return <div className="space-y-6"><PageHeader title="New FAQ" eyebrow="FAQs" description="Create a general or service-specific answer." /><FaqForm initial={null} services={services.map(({ id, title }) => ({ id, title }))} /></div>; }
