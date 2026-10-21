import { describe, expect, it } from "vitest";

import { idleSessionState } from "@/components/admin/idle-session-tracker";

describe("idle session tracker", () => {
  it("warns only during the configured warning period", () => {
    expect(idleSessionState({ now: 0, lastActivityAt: 0 }, 30_000, 5_000).state).toBe("active");
    expect(idleSessionState({ now: 26_000, lastActivityAt: 0 }, 30_000, 5_000).state).toBe("warning");
    expect(idleSessionState({ now: 30_000, lastActivityAt: 0 }, 30_000, 5_000).state).toBe("expired");
  });

  it("uses the earliest server deadline", () => {
    const state = idleSessionState({ now: 0, lastActivityAt: 0, serverIdleDeadlineAt: 10_000, serverAbsoluteDeadlineAt: 20_000 }, 30_000, 5_000);
    expect(state.remainingMs).toBe(10_000);
    expect(state.state).toBe("active");
  });
});
