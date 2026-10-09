import { toNextJsHandler } from "better-auth/next-js";

import { auth, isAuthConfigured } from "@/lib/auth/auth";
import { clearForcedPasswordChange } from "@/lib/auth/session-security";
import { checkLoginLimit, resetLoginLimit } from "@/lib/rate-limit/login";
import { logActivity } from "@/server/services/activity";

function guard(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    if (!isAuthConfigured()) return Response.json({ error: "Authentication service unavailable." }, { status: 500 });

    const pathname = new URL(request.url).pathname;
    const isLogin = request.method === "POST" && pathname.endsWith("/sign-in/email");
    const isLogout = request.method === "POST" && pathname.endsWith("/sign-out");
    const isPasswordChange = request.method === "POST" && pathname.endsWith("/change-password");
    const ipAddress = getIpAddress(request);

    if (isLogin) {
      const email = await extractEmail(request);
      const limit = checkLoginLimit(request, email);
      if (!limit.allowed) {
        await recordActivity({ action: "auth.login.failed", entityType: "Auth", summary: "Failed login attempt", ipAddress });
        return Response.json(
          { code: "RATE_LIMITED", message: "Too many login attempts. Try again later." },
          { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
        );
      }

      const response = await handler(request);
      if (response.ok) {
        resetLoginLimit(request, email);
        await recordActivity({ userId: await extractUserId(response), action: "auth.login", entityType: "Auth", summary: "Successful login", ipAddress });
        return response;
      }
      await recordActivity({ action: "auth.login.failed", entityType: "Auth", summary: "Failed login attempt", ipAddress });
      if (response.status >= 400 && response.status < 500) {
        return Response.json({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" }, { status: 401 });
      }
      return response;
    }

    const sessionBeforeLogout = isLogout ? await getSessionForRequest(request) : null;
    const sessionBeforePasswordChange = isPasswordChange
      ? await getSessionForRequest(request)
      : null;
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

async function getSessionForRequest(request: Request) {
  try {
    return await auth.api.getSession({ headers: request.headers });
  } catch {
    return null;
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

function getIpAddress(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
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
