import { describe, expect, it } from "vitest";

import { sessionRemaining, sessionTimeoutReason, type SessionRecord } from "@/lib/auth/session-timeout-policy";

const config = { idleTimeoutMs: 30_000, warningMs: 5_000, absoluteTimeoutMs: 60_000 };
const record: SessionRecord = { id: "session", userId: "user", createdAt: new Date(0), expiresAt: new Date(120_000), lastActivityAt: new Date(0) };

describe("server session timeout policy", () => {
  it("expires idle sessions and reports both remaining clocks", () => {
    expect(sessionTimeoutReason(record, 30_000, config)).toBe("idle");
    expect(sessionRemaining({ ...record, lastActivityAt: new Date(10_000) }, 20_000, config)).toEqual({ idleRemainingSeconds: 20, absoluteRemainingSeconds: 40 });
  });

  it("enforces the absolute lifetime even after activity", () => {
    expect(sessionTimeoutReason({ ...record, lastActivityAt: new Date(59_000) }, 60_000, config)).toBe("absolute");
  });
});
