import Link from "next/link";
import { notFound } from "next/navigation";

import {
  DeleteLeadButton,
  LeadAssignmentForm,
  LeadNoteForm,
  LeadStatusForm,
  PageHeader,
  ResendEmailForm,
} from "@/components/admin";
import { Badge } from "@/components/ui";
import { requirePermission } from "@/lib/auth/session";
import { buildWhatsAppHref } from "@/lib/contact/whatsapp";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { phoneHref } from "@/components/site/contact-utils";
import { getAdminLead, listAssignees } from "@/server/services/admin-leads";

type Params = Promise<{ id: string }>;
function pretty(value: string) {
  return value.replaceAll("_", " ");
}
function safeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default async function LeadDetailPage({ params }: { params: Params }) {
  const session = await requirePermission("leads:read");
  const { id } = await params;
  let lead;
  try {
    lead = await getAdminLead(id, {
      id: session.user.id,
      role: session.user.role,
    });
  } catch {
    notFound();
  }
  const assignees = await listAssignees();
  const timeline = [
    ...lead.history.map((item) => ({
      key: `history-${item.id}`,
      date: item.createdAt,
      title: `Status changed to ${item.toStatus}`,
      body: item.fromStatus
        ? `${item.fromStatus} → ${item.toStatus}`
        : `Lead created as ${item.toStatus}`,
      meta: "Status history",
    })),
    ...lead.notes.map((item) => ({
      key: `note-${item.id}`,
      date: item.createdAt,
      title: item.author?.name ?? "Staff note",
      body: item.body,
      meta: "Note",
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.name}
        eyebrow={lead.publicId}
        description={`${pretty(lead.type)} lead received ${lead.createdAt.toLocaleString("en-IN")}.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/leads"
              className="rounded-control border px-4 py-2 font-semibold"
            >
              Back to leads
            </Link>
            {session.user.role === "ADMIN" ||
            session.user.role === "SUPER_ADMIN" ? (
              <DeleteLeadButton leadId={lead.id} />
            ) : null}
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="space-y-6">
          <section className="rounded-card border bg-surface p-5">
            <h2 className="text-lg font-semibold">Contact details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Phone
                </dt>
                <dd className="mt-1">
                  <a
                    href={phoneHref(lead.phone)}
                    className="font-semibold text-brand-deep underline"
                  >
                    {lead.phone}
                  </a>
                  <a
                    href={buildWhatsAppHref({ whatsappNumber: lead.phone, whatsappMessage: "" }, { pageTitle: "Lead follow-up", estimateReference: lead.publicId }) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 inline-flex items-center gap-1 text-sm text-whatsapp-text underline"
                  >
                    <WhatsAppIcon size={16} />
                    WhatsApp
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Email
                </dt>
                <dd className="mt-1">
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-brand-deep underline"
                    >
                      {lead.email}
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Location
                </dt>
                <dd className="mt-1">{lead.location ?? "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Source
                </dt>
                <dd className="mt-1">{lead.sourcePage ?? "Unknown"}</dd>
              </div>
            </dl>
            {lead.message ? (
              <div className="mt-5 border-t pt-4">
                <h3 className="text-sm font-semibold">Message</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">
                  {lead.message}
                </p>
              </div>
            ) : null}
          </section>
          {lead.quote ? (
            <section className="rounded-card border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Quote snapshot</h2>
                  <p className="text-sm text-ink-muted">
                    {lead.quote.estimatorService.name} · version{" "}
                    {lead.quote.configVersion} ·{" "}
                    {lead.quote.locationZone?.name ?? "No zone"}
                  </p>
                </div>
                {lead.quote.estimatorService.pricingMode ===
                "INSPECTION_ONLY" ? (
                  <Badge variant="warning">Inspection only</Badge>
                ) : (
                  <p className="text-xl font-bold text-brand-deep">
                    ₹{lead.quote.lowAmount.toLocaleString("en-IN")} – ₹
                    {lead.quote.highAmount.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-ink-muted">Area</dt>
                  <dd className="font-semibold">{lead.quote.areaValue}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Config hash</dt>
                  <dd className="break-all font-mono text-xs">
                    {lead.quote.configHash}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Captured</dt>
                  <dd>{lead.quote.createdAt.toLocaleDateString("en-IN")}</dd>
                </div>
              </dl>
              <details className="mt-5 rounded-control border p-3">
                <summary className="cursor-pointer font-semibold">
                  View breakdown, answers and config
                </summary>
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div>
                    <h3 className="text-sm font-semibold">Breakdown</h3>
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs text-ink-muted">
                      {safeJson(lead.quote.breakdown)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Answers</h3>
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs text-ink-muted">
                      {safeJson(lead.quote.answers)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Config snapshot</h3>
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs text-ink-muted">
                      {safeJson(lead.quote.configSnapshot)}
                    </pre>
                  </div>
                </div>
              </details>
            </section>
          ) : null}
          <section className="rounded-card border bg-surface p-5">
            <h2 className="text-lg font-semibold">Timeline</h2>
            {timeline.length ? (
              <ol className="mt-4 space-y-4 border-l pl-5">
                {timeline.map((item) => (
                  <li key={item.key} className="relative">
                    <span className="absolute -left-[1.6rem] top-1.5 h-2 w-2 rounded-full bg-brand" />
                    <p className="text-xs text-ink-muted">
                      <time dateTime={item.date.toISOString()}>
                        {item.date.toLocaleString("en-IN")}
                      </time>{" "}
                      · {item.meta}
                    </p>
                    <h3 className="mt-1 font-semibold">{item.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">
                No timeline events yet.
              </p>
            )}
          </section>
          <section className="rounded-card border bg-surface p-5">
            <LeadNoteForm leadId={lead.id} />
          </section>
        </main>
        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-card border bg-surface p-5">
            <h2 className="text-lg font-semibold">Manage lead</h2>
            <div className="mt-4">
              <LeadStatusForm leadId={lead.id} current={lead.status} />
            </div>
          </section>
          <section className="rounded-card border bg-surface p-5">
            <LeadAssignmentForm
              leadId={lead.id}
              assignedToId={lead.assignedToId}
              followUpAt={lead.followUpAt?.toISOString() ?? null}
              assignees={
                session.user.role === "SALES"
                  ? assignees.filter(
                      (assignee) => assignee.id === session.user.id,
                    )
                  : assignees
              }
            />
          </section>
          <section className="rounded-card border bg-surface p-5">
            <h2 className="text-lg font-semibold">Email delivery</h2>
            <div className="mt-4">
              <ResendEmailForm
                leadId={lead.id}
                latest={
                  lead.emailLogs[0]
                    ? {
                        ...lead.emailLogs[0],
                        createdAt: lead.emailLogs[0].createdAt.toISOString(),
                      }
                    : null
                }
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
