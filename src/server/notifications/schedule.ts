import "server-only";

import { after } from "next/server";

import { notifyLeadCreated } from "./leads";

async function deliver(leadId: string): Promise<void> {
  try { await notifyLeadCreated(leadId); } catch { console.error(JSON.stringify({ event: "email_delivery_failed", type: "LEAD_NOTIFICATION", code: "NOTIFICATION_FAILED" })); }
}

export function scheduleLeadNotification(leadId: string): void {
  try { after(() => deliver(leadId)); } catch { void deliver(leadId); }
}
