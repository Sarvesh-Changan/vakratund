# ADR 001: Authentication library

- Status: Accepted
- Date: 2026-10-02

## Context

The application needs email/password authentication with no public registration, database-backed sessions, role and active-state fields on `User`, password reset support, and reliable session revocation. The security requirements also require a minimum 12-character password, secure cookies, and four application roles.

## Decision

Use Better Auth 1.7.7 with its official Prisma adapter (`@better-auth/prisma-adapter`) and the PostgreSQL provider. The installed Prisma major is 7, so the generated client uses Prisma 7's custom output and the adapter receives the existing singleton Prisma client.

The application configuration:

- Enables email/password authentication and sets `disableSignUp: true`.
- Adds a database hook that rejects any Better Auth user-creation attempt. This is defense in depth; the seed and future authenticated admin provisioning use controlled server-side paths.
- Uses Better Auth's default secure Scrypt password hashing through the documented `password.hash` and `password.verify` hooks, with the application's 12-character policy and common-password deny list applied before hashing.
- Keeps the Better Auth core tables (`User`, `Session`, `Account`, and `Verification`) in the application schema, retaining all fields required by `DATABASE.md` and adding `User.mustChangePassword`.
- Configures seven-day sliding sessions (`expiresIn: 7 days`, `updateAge: 1 day`). Session database hooks cap every session at thirty days from its original `createdAt`, providing the required absolute lifetime.
- Explicitly sets `HttpOnly`, `SameSite=Lax`, and production-only `Secure` cookie attributes.
- Requires `BETTER_AUTH_SECRET` whenever authentication is initialized. There is no fallback secret; missing, weak, placeholder, or reused secrets fail with a secret-free configuration error.
- Configures Better Auth's client-IP source in the same trusted-header order as the application (`x-vercel-forwarded-for`, `x-forwarded-for`, `x-real-ip`). Its general production limiter remains enabled at 100 requests per 10 seconds, but the built-in `/sign-in/email` special rule is disabled because the application limiter is the authoritative failure-only login policy. This avoids Better Auth's default 3 requests per 10 seconds rule counting successful credentials, sessions, or other auth calls against the login lockout.
- Stores application login lockout buckets in PostgreSQL through the `RateLimitBucket` model in production. The application deliberately does not select Upstash/Redis; this keeps lockout recovery, health checks, and the `auth:unlock` command on the same database-backed store. In-memory storage remains limited to development and tests.
- Revokes sessions after credential-account creation/update (covering Better Auth password change and reset flows) and provides transaction-based application helpers for password changes, role changes, and deactivation. Those helpers are the required mutation boundary for future admin actions.
- Exposes `getSession`, `requireSession`, `requireRole`, and `requirePermission` helpers. Page calls redirect unauthenticated users to `/admin/login`; API-mode calls raise a 401 error, while failed authorization raises 403.

Auth.js was not selected because Better Auth's current official Prisma adapter and email/password configuration directly provide the requested database session model, signup switch, password hooks, and session revocation API. Switching libraries would add an adapter and migration surface without solving a current requirement.

## Schema review and deviations

The existing `User`, `Session`, `Account`, and `Verification` models already match Better Auth's current Prisma adapter fields and relations. No existing entity or business rule was removed.

The following intentional additions are recorded:

1. `User.mustChangePassword Boolean @default(false)` supports the first-admin bootstrap flow and forced credential rotation without changing Better Auth's core user fields.
2. `User.role` remains the project `Role` enum rather than Better Auth's optional generic role string. It is exposed to Better Auth as a non-input additional field and is enforced by the application permission map.
3. `User.isActive` remains an application field and is checked by `getSession`; inactive users are treated as unauthenticated.

## Consequences

Better Auth owns credential verification, cookie/session endpoints, reset-token handling, and core session persistence. The application owns role authorization, inactive-user checks, bootstrap administration, and security-sensitive user mutations. Public sign-up is unavailable in both the Better Auth route configuration and its user-creation hook.

The absolute 30-day cap is application code because Better Auth exposes sliding expiry (`expiresIn`/`updateAge`) but no separate absolute lifetime option. Any future direct mutation of role, active status, or credentials must call the helpers in `src/lib/auth/session-security.ts` so all sessions are revoked atomically.

## References

- [Better Auth Prisma adapter](https://better-auth.com/docs/adapters/prisma)
- [Better Auth email and password](https://better-auth.com/docs/authentication/email-password)
- [Better Auth session management](https://better-auth.com/docs/concepts/session-management)
- [Better Auth cookies](https://better-auth.com/docs/concepts/cookies)
- [Better Auth database hooks and additional fields](https://better-auth.com/docs/concepts/database)
