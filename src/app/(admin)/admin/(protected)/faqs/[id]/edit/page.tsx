import { notFound } from "next/navigation";

import { FaqForm, PageHeader } from "@/components/admin";
import { requirePermission } from "@/lib/auth/session";
import { getFaq } from "@/server/services/faqs";
import { listServices } from "@/server/services/services";

export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) { await requirePermission("content:write"); const { id } = await params; const [faq, services] = await Promise.all([getFaq(id), listServices()]); if (!faq) notFound(); return <div className="space-y-6"><PageHeader title={`Edit FAQ: ${faq.question}`} eyebrow="FAQs" description="Update the answer, grouping, order, or publication status." /><FaqForm initial={faq} services={services.map(({ id: serviceId, title }) => ({ id: serviceId, title }))} /></div>; }
