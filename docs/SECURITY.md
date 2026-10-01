# SECURITY

These rules are **non-negotiable** and take precedence over all other documents.
The site stores personal data (names, phones, emails of enquirers) and has an admin that controls public content.

## 1. Threat model (summary)
| Threat | Example | Primary controls |
|---|---|---|
| Account takeover | Brute-force admin login | Strong hashing, rate limit, lockout, secure cookies, optional 2FA |
| Privilege escalation | EDITOR reads leads | Central permission map, server-side checks everywhere |
| Injection | SQLi, XSS in blog/FAQ | Prisma parameterization, Zod, Markdown sanitization, CSP |
| Spam/abuse | Bot floods lead form | Rate limit, honeypot, optional Turnstile, duplicate detection |
| Malicious upload | Executable disguised as image | Signed uploads, MIME/size allowlist, Cloudinary-only storage |
| Secret leakage | Keys in repo/client | Env-only secrets, `NEXT_PUBLIC_` discipline, secret scanning |
| Price tampering | Client sends fake estimate | Server recomputes from DB config; snapshot stored |
| PII exposure | Lead data leak | Least privilege, no PII in logs, HTTPS only, retention policy |
| Supply chain | Malicious dependency | Lockfile, audit, minimal deps, Dependabot |

## 2. Authentication
- Email + password via the chosen auth library; DB-backed sessions; cookies: `HttpOnly`, `Secure`, `SameSite=Lax`, `__Host-` prefix where supported.
- Password hashing with a modern KDF (argon2id or scrypt as provided by the library); never log or return hashes.
- Password policy: ≥ 12 chars, block top common passwords, no max-length below 128; force change for seeded admin on first login.
- Login rate limit: 5 attempts / 15 min per (IP + email); generic error message ("Invalid email or password"); temporary lockout with notification to SUPER_ADMIN.
- Session lifetime 7 days sliding, absolute max 30 days; revoke all sessions on password change/role change/deactivation.
- Optional TOTP 2FA for SUPER_ADMIN/ADMIN (recommended; ADR if deferred).
- No public sign-up. Users are created by SUPER_ADMIN only. Password reset via time-limited, single-use token email.

## 3. Authorization (RBAC)
Single source: `src/config/permissions.ts`; helper `can(role, permission)` and `requirePermission()`.

| Permission area | SUPER_ADMIN | ADMIN | EDITOR | SALES |
|---|:-:|:-:|:-:|:-:|
| Dashboard (leads analytics) | ✅ | ✅ | ❌ (content stats only) | ✅ |
| Leads/Quotes read | ✅ | ✅ | ❌ | ✅ |
| Leads update/notes/assign | ✅ | ✅ | ❌ | ✅ (own + unassigned) |
| Leads export / delete | ✅ | ✅ | ❌ | ❌ |
| Estimator config & pricing | ✅ | ✅ | ❌ | ❌ |
| Projects/Services/Gallery/Media | ✅ | ✅ | ✅ | ❌ |
| Blog/FAQ/Testimonials/Team/Pages | ✅ | ✅ | ✅ | ❌ |
| SEO | ✅ | ✅ | ✅ | ❌ |
| Site settings | ✅ | ✅ | ❌ | ❌ |
| Users & roles | ✅ | ❌ | ❌ | ❌ |
| Activity log | ✅ | ✅ (read) | ❌ | ❌ |

Rules:
1. Check authorization in **every** Server Action, route handler and protected layout — never rely on hiding UI or on interception rules alone.
2. Deny by default. Unknown permission = forbidden.
3. Prevent self-lockout: cannot demote/deactivate the last active SUPER_ADMIN.
4. Return 401 (unauthenticated) vs 403 (forbidden) consistently; do not leak whether a resource exists.

## 4. Input validation & output encoding
- Validate all inputs with Zod on the server: types, lengths, formats, enums, ranges. Reject unknown keys (`.strict()`).
- Never concatenate user input into SQL; no `$queryRawUnsafe`.
- Markdown (blog, FAQ, descriptions) rendered through a sanitizing pipeline (no raw HTML, no `javascript:` URLs, `rel="noopener noreferrer nofollow ugc"` on user-supplied links).
- Never use `dangerouslySetInnerHTML` except for JSON-LD (serialized with `JSON.stringify` and `<` escaped).
- Escape values placed into emails; strip CR/LF from header fields (email header injection).
- Validate redirect targets against an allowlist (no open redirects).
- Normalize and validate phone, email, and URLs; cap field lengths (name 100, email 254, message 2000).

## 5. CSRF, headers, and transport
- Server Actions: rely on Next.js origin checks; additionally verify `Origin` header on custom POST handlers; all state changes via POST.
- HTTPS only; `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- Security headers via `next.config`: 
  - `Content-Security-Policy` (nonce-based; allow self, Cloudinary images, Google Maps embed, GA if used, Turnstile if used; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`)
  - `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (disable camera, mic, geolocation unless needed), `X-Frame-Options: DENY`.
- Admin pages: `X-Robots-Tag: noindex`, `Cache-Control: no-store`.
- CORS: no wildcard; API is same-origin only.

## 6. Rate limiting & bot protection
| Endpoint | Limit (per IP hash) |
|---|---|
| Login | 5 / 15 min (+ per email) |
| Lead / quote / contact submit | 5 / 10 min, 20 / day |
| Brochure download request | 5 / 10 min |
| Estimate calculation API | 60 / min |
| Upload signature | 30 / hour (authenticated) |
| Password reset | 3 / hour per email |
- Honeypot field + minimum-fill-time check on public forms; Cloudflare Turnstile (optional) if spam appears.
- Return generic 429 messages with `Retry-After`.
- IPs are **hashed with a server secret** before storage (never store raw IPs).

## 7. File uploads (Cloudinary)
- Only authenticated, authorized users may request a signature; folder allowlist (`vakratund/projects`, `/gallery`, `/blog`, `/team`, `/docs`).
- Signed upload params include `folder`, `timestamp`, `allowed_formats`; short expiry.
- Allowed: `jpg, jpeg, png, webp, avif` (images), `mp4, webm` (video, size-capped), `pdf` (documents, admin only). Max 10 MB image / 50 MB video / 15 MB PDF.
- API secret only on the server; never exposed to the client.
- Store only metadata in DB; require alt text; strip EXIF GPS where possible (Cloudinary `fl_strip_profile` or on upload preset).
- Gated brochure: serve via a short-lived signed URL, not a permanent public link, if confidentiality is desired.

## 8. Secrets & configuration
- `.env.local` for development only; production secrets in Vercel project env (Production/Preview separated).
- `.env.example` documents names only. `src/lib/env.ts` validates at boot and never logs values.
- Enable GitHub secret scanning/push protection. Rotate any secret that was ever pasted in a chat/issue/PR.
- Separate Neon branches/credentials for preview vs production; principle of least privilege DB role for the app.
- **Never paste real secrets into AI coding agents' prompts.** Put them in env files locally and tell the agent only the variable names.

## 9. Personal data & privacy (India DPDP Act 2023 aware)
- Collect only what's needed (name, phone, email optional, location, requirements).
- Explicit, unticked **consent checkbox** + link to Privacy Policy on every lead form; store `consent` and `consentAt`.
- Privacy Policy states: purposes, retention (24 months default), sharing (email provider, hosting), contact for access/correction/erasure requests.
- Admin tools: export a person's data, anonymize/delete on request (log action).
- Logs never contain names, phones, emails, message bodies, or raw IPs.
- Analytics loaded only after consent if cookies are used (banner when GA is enabled).
- Backups encrypted by provider; access limited to SUPER_ADMIN.

## 10. Estimator-specific security
- Server recomputes every estimate from the DB; client numbers are ignored.
- Config snapshot stored with the quote (tamper-evident via `configHash`).
- Validate answers against the config (option membership, numeric ranges, visibility rules).
- Admin pricing edits: ADMIN+ only, logged with before/after diff, version bump.

## 11. Logging, monitoring, audit
- `ActivityLog` for all admin mutations (who/what/when, sanitized diff). Append-only.
- Structured server logs with request id; redact PII; alert on spikes of 401/403/429/500.
- Optional Sentry with PII scrubbing; Vercel Analytics/Speed Insights for performance.

## 12. Dependency & CI hygiene
- `npm audit --omit=dev` in CI; Dependabot/Renovate weekly; review changelogs for major updates.
- CI gates: typecheck, lint, test, build, secret scan.
- Lockfile committed; use `npm ci` in CI.

## 13. Incident response (short)
1. Contain: revoke sessions/rotate secrets, disable affected feature.
2. Assess: check `ActivityLog`, Vercel/Neon logs.
3. Notify the client and, where required, affected individuals/authority.
4. Fix, add a regression test, document in `docs/RUNBOOK.md`.

## 14. Pre-launch security checklist
- [ ] All admin routes/actions/handlers enforce auth + role (verified by tests)
- [ ] No public sign-up; seeded admin password changed
- [ ] Headers/CSP verified (securityheaders.com or equivalent) and no CSP violations in console
- [ ] Rate limits tested on login and lead forms
- [ ] Upload restrictions tested (wrong type/size rejected)
- [ ] Markdown sanitization tested with XSS payloads
- [ ] Estimator tamper test: modified client values do not change stored price
- [ ] No secrets in repo history (`git log -p` scan / secret scanner)
- [ ] `npm audit` clean (or exceptions documented)
- [ ] Privacy policy, consent checkbox and data-request process live
- [ ] Backups/restore procedure tested on Neon
- [ ] robots/noindex on admin and thank-you pages
