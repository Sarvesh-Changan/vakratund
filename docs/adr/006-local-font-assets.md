# ADR 006: Local font assets for the design system

## Context

The design system requires Sora for headings and Inter for body text through `next/font` with `display: swap`. `next/font/google` downloads font CSS during a production build, which makes an otherwise self-contained build dependent on network access.

## Decision

Use `next/font/local` with the Latin font files supplied by `@fontsource-variable/inter` and `@fontsource/sora`. The font packages are build dependencies because they keep the required typefaces available at build time and preserve the `display: swap` behavior.

## Consequences

Fonts are deterministic and self-hosted in the deployed Next.js output. The repository carries a small additional dependency footprint, and font updates are handled through package upgrades.

## Status

Accepted for Phase 2.
