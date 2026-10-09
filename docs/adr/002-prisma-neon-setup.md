# ADR 002: Prisma 7 and Neon setup

## Context

Vakratund uses PostgreSQL on Neon. Runtime traffic runs in Next.js serverless functions, while Prisma Migrate and Prisma Studio need a direct database connection. The repository had no Prisma packages, schema, client, or migration yet.

The current Prisma documentation for the selected stable major requires the Prisma 7 `prisma-client` generator, an explicit generated output path, a datasource URL in `prisma.config.ts`, and a driver adapter for direct database connections. Neon is supported through `@prisma/adapter-neon`.

## Decision

- Pin Prisma CLI and generated client packages to `7.10.0` and use `@prisma/adapter-neon@7.10.0`.
- Use `prisma-client` with output `src/generated/prisma`.
- Keep the Prisma schema datasource provider as `postgresql` only. Prisma 7 removed `url` and `directUrl` from the schema datasource block.
- Configure Prisma CLI commands through `prisma.config.ts`, using `DIRECT_URL` for migrations and loading `.env` plus `.env.local` without logging values.
- Instantiate one `PrismaClient` in `src/lib/db/client.ts` with `PrismaNeon` and the pooled `DATABASE_URL`. Cache it on `globalThis` outside production to survive Next.js development hot reloads.
- Keep the app runtime on the Node.js runtime; the Neon adapter is compatible with serverless and edge-style connection constraints, while Prisma Migrate remains a CLI concern.

## Schema review and deviations

- The DATABASE.md baseline intentionally left `Session`, `Account`, and `Verification` for the auth adapter. They are included here with the Better Auth-compatible fields and relations so the schema is valid before the auth phase. Better Auth integration may refine those fields in its own migration/ADR.
- The baseline omitted timestamps on several tables despite its convention that every table has `createdAt` and `updatedAt`. Those timestamps were added to `GalleryItem`, `BlogCategory`, `PageSection`, `PageSeo`, `SiteSetting`, `ContactEvent`, `LocationZone`, `Quote`, `ProjectMedia`, `LeadNote`, `LeadStatusHistory`, `ActivityLog`, `EstimatorField`, `FieldOption`, `PricingRule`, and the auth models.
- The baseline omitted indexes for several explicitly filterable/sortable foreign-key and visibility fields. Supporting indexes were added without removing any baseline index.
- The baseline's `directUrl` datasource field was replaced by `prisma.config.ts` because Prisma 7 removed that schema property. This preserves the intended pooled-runtime/direct-migration split.
- No seed data is created in this phase. The existing `db:seed` placeholder remains intentionally non-seeding until the database seed phase.

## Consequences

Runtime code must never use `DIRECT_URL`; it is only read by Prisma CLI configuration. Any server-side query imports the shared client. Generated Prisma files are build artifacts from `prisma generate` and are not hand-edited.

## Status

Accepted for the database foundation phase.

## References

- https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql
- https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/generating-prisma-client
- https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference
