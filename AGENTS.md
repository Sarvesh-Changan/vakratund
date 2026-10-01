# AGENTS.md — Vakratund Construction Website

> Place this file at the **repository root**. Codex reads `AGENTS.md` automatically.
> For Antigravity, keep this file at the root as well and also paste its contents into
> the workspace rules (check Antigravity's current docs for the exact rules location).

## Project in one paragraph
A premium, SEO-friendly, lead-generating website for **M/s. Vakratund Construction**
(civil engineering, PMC & turnkey developers, structural repair & rehabilitation, Thane/Mumbai,
est. 2003), fully manageable by the client through an admin dashboard. It includes a
database-driven cost estimator, lead pipeline, blog, portfolio, gallery and CMS.

## Read before coding (in this order)
1. `docs/PRD.md` — what to build and acceptance criteria
2. `docs/ARCHITECTURE.md` — how it is structured
3. `docs/DATABASE.md` — schema and data rules
4. `docs/CODING_STANDARDS.md` — how to write code
5. `docs/SECURITY.md` — non-negotiable security rules
6. `docs/DESIGN.md` — UI/UX system
7. `docs/CONTENT.md` — real business content (source of truth for copy and seed data)

If documents conflict, precedence is: **SECURITY > PRD > ARCHITECTURE > DATABASE > CODING_STANDARDS > DESIGN**.
If something is missing or ambiguous, **ask or write an ADR in `docs/adr/`**; do not guess silently.

## Stack (do not substitute without an ADR)
Next.js (latest stable, App Router) · TypeScript strict · Tailwind CSS · PostgreSQL on Neon ·
Prisma ORM · Better Auth (email+password, DB sessions) · Cloudinary · Resend · Zod ·
React Hook Form · Vitest · Playwright · Vercel.

## Commands (keep these working at all times)
```bash
npm run dev          # local dev server
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest
npm run test:e2e     # playwright
npm run db:migrate   # prisma migrate dev
npm run db:seed      # seed script
npm run build        # production build
```

## Hard rules
- Work on **one phase at a time** (see `BUILD_GUIDE.md`). Do not start the next phase unprompted.
- Never hardcode secrets. Never commit `.env*` (except `.env.example`). Never print secrets in logs.
- Every public form and every admin mutation must validate with Zod on the **server**.
- Every admin route, Server Action and API handler must check authentication **and** role.
- Use Prisma only for DB access; no raw SQL unless justified in a code comment and reviewed.
- Business logic lives in `src/server/**`; UI components must not contain pricing or DB logic.
- The estimator calculation is a **pure function** with unit tests.
- Do not add dependencies without stating why in the PR/commit message.
- No `any`, no `// @ts-ignore`, no unused exports left behind.
- Accessible by default: semantic HTML, labels, focus states, alt text, reduced-motion support.

## Definition of done (every phase)
1. `typecheck`, `lint`, `test` and `build` all pass.
2. New behavior is covered by tests where logic exists (estimator, validation, permissions).
3. Loading, error and empty states exist for every data-driven UI.
4. Docs updated if a decision changed (`docs/adr/NNN-title.md`).
5. A short summary of what changed, what to verify manually, and any follow-ups.

## Output expectations from the agent
- Make small, reviewable commits using Conventional Commits (`feat:`, `fix:`, `chore:`...).
- At the end of each phase, list: files changed, commands to run, how to verify, known gaps.
- Mark anything that needs **client-supplied data** as `TODO(client):` and list them.
