import { describe, expect, it } from "vitest";

import { idleSessionState } from "@/components/admin/idle-session-tracker";

describe("idle session tracker", () => {
  it("warns only during the configured warning period", () => {
    expect(idleSessionState({ now: 0, lastActivityAt: 0 }, 30_000, 5_000).state).toBe("active");
    expect(idleSessionState({ now: 26_000, lastActivityAt: 0 }, 30_000, 5_000).state).toBe("warning");
    expect(idleSessionState({ now: 30_000, lastActivityAt: 0 }, 30_000, 5_000).state).toBe("expired");
  });

  it("uses the earliest server deadline", () => {
    const state = idleSessionState({ now: 1, lastActivityAt: 1, serverIdleDeadlineAt: 10_000, serverAbsoluteDeadlineAt: 20_000 }, 30_000, 5_000);
    expect(state.remainingMs).toBe(9_999);
    expect(state.state).toBe("active");
  });

  it("does not treat uninitialized client clocks as an expired session", () => {
    expect(idleSessionState({ now: 0, lastActivityAt: 0 }, 1_800_000, 300_000).state).toBe("active");
    expect(idleSessionState({ now: 1_700_000_000_000, lastActivityAt: 0 }, 1_800_000, 300_000).state).toBe("active");
  });
});
