# ADR 007: Preserve all service rows from CONTENT.md

## Context

CONTENT.md labels its service table as “11” but enumerates 12 service slugs, including `fabrication-porta-house`. The seed request also requires the services from that table and explicitly names the fabrication service in the source content.

## Decision

Seed all 12 enumerated service rows. The seed script keeps the discrepancy in a code comment and does not discard the final listed service.

## Consequences

The seeded service count is 12. The client should confirm whether the content heading or the service list should be corrected before public launch.

## Status

Accepted for the seed phase.
