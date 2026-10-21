import { toNextJsHandler } from "better-auth/next-js";

import { auth, isAuthConfigured } from "@/lib/auth/auth";
import { clearForcedPasswordChange } from "@/lib/auth/session-security";
import { clearAuthSessionCookies } from "@/lib/auth/session-timeout";
import { validateSessionHeaders, type AuthSession } from "@/lib/auth/session";
import { checkLoginLimit, recordFailedLogin, resetLoginLimit } from "@/lib/rate-limit/login";
import { getClientIp } from "@/lib/rate-limit/client-ip";
import { logActivity } from "@/server/services/activity";
import { findLockedAccount, notifySuperAdminsOfLockout } from "@/server/services/auth-lockout";

function guard(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    if (!isAuthConfigured()) return Response.json({ error: "Authentication service unavailable." }, { status: 500 });

    const pathname = new URL(request.url).pathname;
    const isLogin = request.method === "POST" && pathname.endsWith("/sign-in/email");
    const isLogout = request.method === "POST" && pathname.endsWith("/sign-out");
    const isPasswordChange = request.method === "POST" && pathname.endsWith("/change-password");
    const isGetSession = request.method === "GET" && pathname.endsWith("/get-session");
    const ipAddress = getClientIp(request);

    if (isLogin) {
      const email = await extractEmail(request);
      let limit;
      try {
        limit = await checkLoginLimit(request, email);
      } catch {
        console.error(JSON.stringify({ event: "auth.rate_limit_unavailable" }));
        return Response.json({ code: "AUTH_UNAVAILABLE", message: "Authentication is temporarily unavailable." }, { status: 503 });
      }
      if (!limit.allowed) {
        await recordActivity({ action: "auth.lockout", entityType: "Auth", summary: "Sign-in temporarily locked", ipAddress });
        return Response.json(
          { code: "RATE_LIMITED", message: "Too many login attempts. Try again later." },
          { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "X-RateLimit-Layer": "application-login-failure", "Cache-Control": "no-store" } },
        );
      }

      const response = await handler(request);
      if (response.ok) {
        try { await resetLoginLimit(request, email); } catch { console.error(JSON.stringify({ event: "auth.rate_limit_reset_failed" })); }
        await recordActivity({ userId: await extractUserId(response), action: "auth.login", entityType: "Auth", summary: "Successful login", ipAddress });
        return response;
      }
      const failedCredentials = response.status === 401 || response.status === 403;
      if (failedCredentials) {
        let failure;
        try {
          failure = await recordFailedLogin(request, email);
        } catch {
          console.error(JSON.stringify({ event: "auth.rate_limit_unavailable" }));
          return Response.json({ code: "AUTH_UNAVAILABLE", message: "Authentication is temporarily unavailable." }, { status: 503 });
        }
        await recordActivity({ action: "auth.login.failed", entityType: "Auth", summary: "Failed login attempt", ipAddress });
        if (failure.locked) {
          const account = await findLockedAccount(email).catch(() => null);
          await recordActivity({ action: "auth.lockout", entityType: "Auth", entityId: account?.id ?? null, summary: "Sign-in temporarily locked", ipAddress });
          if (account) await notifySuperAdminsOfLockout(account.maskedEmail);
        }
        return Response.json({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" }, { status: 401 });
      }
      return response;
    }

    const getSessionValidation = isGetSession ? await validateSessionForRequest(request, "passive") : null;
    if (getSessionValidation?.expired) {
      await clearAuthSessionCookies();
      return Response.json({ code: "SESSION_EXPIRED", message: "Session expired." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const logoutValidation = isLogout ? await validateSessionForRequest(request, "none") : null;
    const passwordValidation = isPasswordChange ? await validateSessionForRequest(request) : null;
    if (passwordValidation?.expired) {
      await clearAuthSessionCookies();
      return Response.json({ code: "SESSION_EXPIRED", message: "Session expired." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const sessionBeforeLogout = logoutValidation?.session ?? null;
    const sessionBeforePasswordChange = passwordValidation?.session ?? null;
    const response = await handler(request);
    if (isPasswordChange && response.ok && sessionBeforePasswordChange?.user.id) {
      try {
        await clearForcedPasswordChange(sessionBeforePasswordChange.user.id);
      } catch {
        return Response.json(
          { code: "PASSWORD_CHANGE_FINALIZATION_FAILED", message: "Password changed, but account setup could not be completed. Please sign in again or contact an administrator." },
          { status: 500 },
        );
      }
    }
    if (isLogout && response.ok) {
      await recordActivity({ userId: sessionBeforeLogout?.user.id ?? null, action: "auth.logout", entityType: "Auth", summary: "Successful logout", ipAddress });
    }
    return response;
  };
}

type AuthMethod = keyof ReturnType<typeof toNextJsHandler>;

function guardedMethod(method: AuthMethod) {
  return guard(async (request: Request) => {
    const handlers = toNextJsHandler(auth);
    return handlers[method](request);
  });
}

async function recordActivity(input: Parameters<typeof logActivity>[0]): Promise<void> {
  try {
    await logActivity(input);
  } catch {
    // Authentication must remain available if audit storage is temporarily unavailable.
  }
}

async function validateSessionForRequest(request: Request, activity: "active" | "passive" | "none" = "active") {
  try {
    return await validateSessionHeaders(request.headers, activity);
  } catch {
    return { session: null as AuthSession | null, expired: false };
  }
}

async function extractUserId(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.clone().json();
    if (typeof body === "object" && body !== null && "user" in body) {
      const user: unknown = body.user;
      if (typeof user === "object" && user !== null && "id" in user && typeof user.id === "string") return user.id;
    }
  } catch {
    // The audit record intentionally does not depend on response parsing.
  }
  return null;
}

async function extractEmail(request: Request): Promise<string> {
  try {
    const body: unknown = await request.clone().json();
    if (typeof body === "object" && body !== null && "email" in body && typeof body.email === "string") {
      return body.email.trim().slice(0, 254);
    }
  } catch {
    // Better Auth will return its normal validation response for malformed JSON.
  }
  return "unknown-email";
}

export const GET = guardedMethod("GET");
export const POST = guardedMethod("POST");
export const PATCH = guardedMethod("PATCH");
export const PUT = guardedMethod("PUT");
export const DELETE = guardedMethod("DELETE");
