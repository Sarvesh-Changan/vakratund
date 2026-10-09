import "server-only";

import { createElement } from "react";

import { resolveNotifyRecipients, sendEmail } from "@/lib/email";
import { renderTemplate, AdminNewLeadEmail, BrochureDeliveryEmail, VisitorConfirmationEmail } from "@/lib/email/templates";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/db/client";
import { createBrochureToken } from "@/server/brochure-token";
import { getPublicBrochureMedia } from "@/server/queries/brochure";
import { getSettings } from "@/server/services/settings";
import { buildWhatsAppHref } from "@/lib/contact/whatsapp";

function logFailure(type: string, code: string): void {
  console.error(JSON.stringify({ event: "email_delivery_failed", type, code }));
}

export async function notifyLeadCreated(leadId: string, options: { admin?: boolean; visitor?: boolean } = {}): Promise<void> {
  const sendAdmin = options.admin ?? true;
  const sendVisitor = options.visitor ?? true;
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, type: true, name: true, phone: true, email: true, location: true, message: true, sourcePage: true, isDuplicate: true, quote: { select: { lowAmount: true, highAmount: true, estimatorService: { select: { name: true, pricingMode: true } } } } } });
  if (!lead) return;
  const environment = getEnv();
  const settings = await getSettings().catch(() => null);
  const notifyRecipients = resolveNotifyRecipients(settings?.notifyEmails ?? [], environment.LEAD_NOTIFY_TO);
  const adminUrl = environment.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const quote = lead.quote ? { serviceName: lead.quote.estimatorService.name, lowAmount: lead.quote.lowAmount, highAmount: lead.quote.highAmount, pricingMode: lead.quote.estimatorService.pricingMode } : null;
  if (sendAdmin) {
    try {
      const adminTemplate = await renderTemplate(createElement(AdminNewLeadEmail, { data: { leadId: lead.id, leadType: lead.type, name: lead.name, phone: lead.phone, email: lead.email, location: lead.location, message: lead.message, sourcePage: lead.sourcePage, isDuplicate: lead.isDuplicate, adminUrl, quote } }));
      const adminResult = await sendEmail({ to: notifyRecipients, subject: `New ${lead.type} lead: ${lead.name}`, html: adminTemplate.html, text: adminTemplate.text, replyTo: lead.email ?? undefined, type: "LEAD_ADMIN_NOTIFICATION", leadId: lead.id });
      if (!adminResult.ok) logFailure("LEAD_ADMIN_NOTIFICATION", adminResult.code);
    } catch { logFailure("LEAD_ADMIN_NOTIFICATION", "EMAIL_RENDER_FAILED"); }
  }

  if (!sendVisitor || !lead.email) return;
  const phones = settings?.phones ?? [];
  const whatsapp = buildWhatsAppHref({ whatsappNumber: settings?.whatsappNumber || phones[0] || lead.phone, whatsappMessage: settings?.whatsappMessage, phones }, { pageTitle: "Enquiry confirmation" }, `Hello, I am following up on my ${lead.type.toLowerCase().replaceAll("_", " ")} enquiry.`);
  if (lead.type === "BROCHURE") {
    try {
      const brochure = await getPublicBrochureMedia();
      if (!brochure) return;
      const token = createBrochureToken(brochure.id);
      const template = await renderTemplate(createElement(BrochureDeliveryEmail, { data: { name: lead.name, downloadUrl: `${adminUrl}/api/brochure/download?token=${encodeURIComponent(token)}` } }));
      const result = await sendEmail({ to: lead.email, subject: "Your Vakratund company profile", html: template.html, text: template.text, replyTo: notifyRecipients[0], type: "BROCHURE_DELIVERY", leadId: lead.id });
      if (!result.ok) logFailure("BROCHURE_DELIVERY", result.code);
    } catch { logFailure("BROCHURE_DELIVERY", "EMAIL_RENDER_FAILED"); }
    return;
  }
  try {
    if (!whatsapp) return;
    const template = await renderTemplate(createElement(VisitorConfirmationEmail, { data: { name: lead.name, summary: lead.message || `Your ${lead.type.toLowerCase().replaceAll("_", " ")} enquiry`, phones, whatsappUrl: whatsapp, quote: quote && quote.lowAmount > 0 && quote.pricingMode === "ESTIMATE" ? quote : null } }));
    const result = await sendEmail({ to: lead.email, subject: "We received your Vakratund enquiry", html: template.html, text: template.text, replyTo: notifyRecipients[0], type: "LEAD_VISITOR_CONFIRMATION", leadId: lead.id });
    if (!result.ok) logFailure("LEAD_VISITOR_CONFIRMATION", result.code);
  } catch { logFailure("LEAD_VISITOR_CONFIRMATION", "EMAIL_RENDER_FAILED"); }
}
