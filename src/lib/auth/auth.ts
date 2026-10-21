import "server-only";

import { prismaAdapter } from "@better-auth/prisma-adapter";
import { APIError } from "better-auth/api";
import { betterAuth } from "better-auth";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { createElement } from "react";

import { prisma } from "@/lib/db/client";
import { assertPasswordPolicy } from "@/lib/auth/password-policy";
import { revokeAllSessions } from "@/lib/auth/session-security";
import { getEnv, getRequiredSecret } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { PasswordResetEmail, renderTemplate } from "@/lib/email/templates";

export function isAuthConfigured(): boolean {
  return Boolean(getEnv().BETTER_AUTH_SECRET);
}

function capSessionExpiry(expiresAt: Date, createdAt: Date, absoluteTimeoutMs: number): Date {
  const absoluteExpiry = createdAt.getTime() + absoluteTimeoutMs;
  return new Date(Math.min(expiresAt.getTime(), absoluteExpiry));
}

function createAuth() {
  const runtimeEnv = getEnv();
  const authSecret = getRequiredSecret("BETTER_AUTH_SECRET");
  const absoluteSessionTimeoutMs = runtimeEnv.ADMIN_SESSION_MAX_HOURS * 60 * 60 * 1000;
  const absoluteSessionTimeoutSeconds = runtimeEnv.ADMIN_SESSION_MAX_HOURS * 60 * 60;
  return betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: runtimeEnv.BETTER_AUTH_URL ?? runtimeEnv.NEXT_PUBLIC_SITE_URL,
  secret: authSecret,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        const template = await renderTemplate(createElement(PasswordResetEmail, { data: { name: user.name, resetUrl: url } }));
        const result = await sendEmail({ to: user.email, subject: "Reset your Vakratund admin password", html: template.html, text: template.text, type: "PASSWORD_RESET" });
        if (!result.ok) console.error(JSON.stringify({ event: "email_delivery_failed", type: "PASSWORD_RESET", code: result.code }));
      } catch { console.error(JSON.stringify({ event: "email_delivery_failed", type: "PASSWORD_RESET", code: "PASSWORD_RESET_EMAIL_FAILED" })); }
    },
    password: {
      hash: async (password) => {
        assertPasswordPolicy(password);
        return hashPassword(password);
      },
      verify: ({ hash, password }) => verifyPassword({ hash, password }),
    },
    onPasswordReset: async ({ user }) => {
      await revokeAllSessions(user.id);
      await prisma.user.update({ where: { id: user.id }, data: { mustChangePassword: false } });
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", required: true, input: false, defaultValue: "EDITOR" },
      isActive: { type: "boolean", required: true, input: false, defaultValue: true },
      mustChangePassword: { type: "boolean", required: true, input: false, defaultValue: false },
    },
  },
  session: {
    expiresIn: absoluteSessionTimeoutSeconds,
    updateAge: 60 * 60,
    additionalFields: {
      lastActivityAt: { type: "date", required: false, input: false, returned: false, defaultValue: () => new Date() },
    },
  },
  advanced: {
    useSecureCookies: runtimeEnv.NODE_ENV === "production",
    ipAddress: {
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for", "x-real-ip"],
    },
    defaultCookieAttributes: {
      httpOnly: true,
      secure: runtimeEnv.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    customRules: {
      "/sign-in/email": false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          throw APIError.from("FORBIDDEN", {
            code: "SIGN_UP_DISABLED",
            message: "Public sign-up is disabled.",
          });
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          if (account.providerId === "credential") await revokeAllSessions(account.userId);
        },
      },
      update: {
        after: async (account) => {
          if (account.providerId === "credential") await revokeAllSessions(account.userId);
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          await assertActiveUser(session.userId);
          return { data: {
            ...session,
            expiresAt: capSessionExpiry(session.expiresAt, session.createdAt, absoluteSessionTimeoutMs),
          } };
        },
      },
      update: {
        before: async (session) => {
          const createdAt = session.createdAt ?? (session.id
            ? (await prisma.session.findUnique({ where: { id: session.id }, select: { createdAt: true } }))?.createdAt
            : undefined) ?? new Date();

          return {
            data: {
              ...session,
                ...(session.expiresAt ? { expiresAt: capSessionExpiry(session.expiresAt, createdAt, absoluteSessionTimeoutMs) } : {}),
            },
          };
        },
      },
    },
  },
  });
}

type Auth = ReturnType<typeof createAuth>;
let authInstance: Auth | undefined;

function getAuth(): Auth {
  const instance = authInstance ?? createAuth();
  authInstance = instance;
  return instance;
}

export const auth = new Proxy({} as Auth, {
  has(_target, property: string | symbol): boolean {
    if (property === "handler") return true;
    return Reflect.has(getAuth(), property);
  },
  get(_target, property: string | symbol, receiver: object): unknown {
    return Reflect.get(getAuth(), property, receiver);
  },
});

async function assertActiveUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
  if (!user?.isActive) {
    throw APIError.from("FORBIDDEN", { code: "ACCOUNT_INACTIVE", message: "Invalid email or password" });
  }
}
