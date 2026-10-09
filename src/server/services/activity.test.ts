import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

const activityCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "activity-1" }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ prisma: { activityLog: { create: activityCreate } } }));
vi.mock("@/lib/env", () => ({ getRequiredSecret: vi.fn(() => "unit-test".repeat(4)) }));

import { logActivity, sanitizeActivityDiff } from "@/server/services/activity";

describe("activity logging", () => {
  it("removes sensitive values from nested diffs", () => {
    expect(sanitizeActivityDiff({ password: "secret", nested: { accessToken: "token", safe: "kept" }, passwordHash: "hash", count: 2 })).toEqual({ nested: { safe: "kept" }, count: 2 });
  });

  it("stores an HMAC IP digest and sanitized diff", async () => {
    await logActivity({ userId: "user-1", action: "lead.updated", entityType: "Lead", entityId: "lead-1", diff: { status: "CONTACTED", token: "redacted" }, ipAddress: "192.0.2.1" });

    expect(activityCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: "user-1", diff: { status: "CONTACTED" }, ipHash: createHmac("sha256", "unit-test".repeat(4)).update("192.0.2.1").digest("hex") }) });
  });
});
