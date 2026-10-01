# CODING STANDARDS

Applies to humans and AI agents. When in doubt: simple, typed, tested, readable.

## 1. TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`.
- No `any`, no non-null assertions (`!`) unless commented with justification, no `@ts-ignore` (use `@ts-expect-error` with reason only if unavoidable).
- Prefer `type` for unions/shapes, `interface` for extensible object contracts. Use `satisfies` for config objects.
- Derive types from Zod schemas: `type X = z.infer<typeof xSchema>`; derive Prisma types via `Prisma.XGetPayload` for read models.
- Exhaustive `switch` with a `never` check on unions/enums.
- Dates: store/transport as ISO strings or `Date` at boundaries; format with `Intl.DateTimeFormat('en-IN')`.

## 2. Naming & files
| Thing | Convention | Example |
|---|---|---|
| Files/folders | kebab-case | `lead-status-select.tsx` |
| React components | PascalCase export | `LeadStatusSelect` |
| Functions/vars | camelCase | `calculateEstimate` |
| Constants | UPPER_SNAKE | `MAX_UPLOAD_BYTES` |
| Types/Zod schemas | PascalCase / camelCase+Schema | `Lead`, `leadCreateSchema` |
| Server Actions | verb-first in `actions.ts` | `createProject`, `updateLeadStatus` |
| DB models | PascalCase singular; fields camelCase | `Lead.createdAt` |
| Tests | `*.test.ts(x)` next to source | `calculate.test.ts` |

- One component per file; max ~200 lines (split otherwise). Co-locate component-specific helpers.
- Prefer **named exports**; default exports only where Next.js requires (pages, layouts, route files).
- Use the `@/` alias; no deep relative `../../../` imports.

## 3. React / Next.js (App Router)
- **Server Components by default.** Add `"use client"` only for interactivity (state, effects, browser APIs) and keep client components small and at the leaves.
- Fetch data in Server Components via `src/server/queries/*` (cached, tagged). Don't fetch your own API routes from server code.
- Mutations: Server Actions (admin + forms). Route handlers for webhooks/signing/health/estimate.
- Every route segment with data: `loading.tsx`, `error.tsx`; public 404 via `not-found.tsx`.
- Use `next/image`, `next/link`, `next/font`, Metadata API (`generateMetadata`) — no manual `<head>` hacks.
- No business logic or Prisma in components. No secrets in client bundles (`NEXT_PUBLIC_` only for public values).
- Accessibility: semantic elements, labels, `alt`, keyboard support, focus management; run `eslint-plugin-jsx-a11y` rules.
- Avoid `useEffect` for data fetching; avoid prop drilling >2 levels (compose or use context sparingly).
- Memoization only after measuring.

## 4. Forms & validation
- Zod schema in `src/lib/validation/*` shared by client and server.
- Client: React Hook Form + resolver for UX. **Server always re-validates** (never trust the client).
- Reusable primitives: `FormField`, `TextField`, `SelectField`, `PhoneField`, `FileField`, `SubmitButton` (pending state).
- Phone: normalize to `+91XXXXXXXXXX`; accept 10-digit Indian mobiles and `+91` prefix.
- Strings trimmed, length-capped; reject HTML in plain-text fields; Markdown fields sanitized on render.

## 5. Server Actions / API contract
```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
```
Order of operations (always): **rate limit (public) → authenticate → authorize → validate → execute (service layer) → audit log → revalidate → return**.

## 6. Prisma & data access
- Single Prisma client (`src/lib/db/client.ts`), instantiated once (global cache in dev).
- Select only needed fields (`select`/`include` deliberately); paginate every list (cursor or offset with caps).
- Multi-write operations use `prisma.$transaction`.
- No raw queries without a comment explaining why + parameterization via `Prisma.sql`.
- Avoid N+1 (use `include` or batched queries); add indexes for new filters.
- Map DB models → view models in `src/server/queries` so UI doesn't depend on the schema shape.

## 7. Error handling
- Expected errors → typed `ActionResult` errors. Unexpected → log with context (no PII), return generic message.
- Never swallow errors silently; never expose stack traces/messages from Prisma or libs to users.
- External services (email, Cloudinary) are best-effort after DB commit; log and continue.

## 8. Styling
- Tailwind utilities with design tokens (`bg-surface`, `text-ink`, `border-line`, `bg-brand`) — no hard-coded hex in components.
- Use `cn()` helper (`clsx` + `tailwind-merge`) and `cva` variants for component APIs.
- Mobile-first classes (`md:`/`lg:` for larger). No inline styles except dynamic values.
- No `!important`; no global CSS beyond tokens/reset/typography.

## 9. Testing
| Level | Tool | Must cover |
|---|---|---|
| Unit | Vitest | estimator (table-driven), validation schemas, permission map, slug/phone utils |
| Integration | Vitest + test DB (Neon branch or local Postgres) | lead submission transaction, quote snapshot, role checks on services |
| E2E | Playwright | estimate→lead flow, contact form, admin login, create/publish project, lead status change |
| Accessibility | `@axe-core/playwright` | key pages no serious/critical violations |
- Tests must be deterministic (no real email/Cloudinary; mock at the boundary).
- Bug fix = add failing test first when feasible.

## 10. Git & reviews
- Branches: `main` (prod), `feat/<phase>-<topic>`, `fix/<topic>`.
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `security:`.
- Small PRs (one phase or one concern). PR description: what/why, how to test, screenshots (UI), risks.
- Never commit secrets, `.env*` (except `.env.example`), build output, or large binaries.

## 11. Dependencies
- Justify every new package (size, maintenance, license). Prefer built-ins.
- Pin via lockfile; run `npm audit` before release; avoid abandoned packages.

## 12. Comments & docs
- Comment **why**, not what. Public functions in `src/server/**` get a short JSDoc (inputs, errors, side effects).
- Decisions → `docs/adr/`. Operational steps → `docs/RUNBOOK.md`.
- Keep README setup accurate: install, env, migrate, seed, run, test.

## 13. Performance rules
- Keep client JS small; dynamic import heavy admin-only libs; no large libs for trivial tasks.
- Always set image `width/height`/`sizes` to avoid CLS; only one `priority` image per page.
- Cache public queries with tags; revalidate on mutation.
- Avoid waterfalls: parallelize independent queries with `Promise.all`.

## 14. Definition of Done (PR checklist)
- [ ] Types/lint/tests/build pass locally
- [ ] Inputs validated server-side; authz checked
- [ ] Loading / error / empty states
- [ ] Responsive at 360 / 768 / 1280; keyboard & screen-reader sanity
- [ ] No console errors/warnings; no unused code
- [ ] Docs/ADR updated; `TODO(client)` items listed
