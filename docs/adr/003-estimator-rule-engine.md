# ADR 003: Estimator rule engine

- Status: Accepted
- Date: 2026-10-05

## Context

Estimator configuration is editable by administrators and is persisted in Prisma models. It must be safe to execute on server and client, deterministic enough to snapshot, and understandable when an estimate is shown to a visitor. Administrator-entered conditions must never become executable JavaScript.

## Decision

The estimator uses a declarative JSON condition language. Conditions contain only `field`, `equals`, `notEquals`, `in`, `notIn`, `gt`, `gte`, `lt`, `lte`, `all`, and `any` keys. The evaluator has an explicit operator switch and treats malformed or unknown conditions as false. No `eval`, `Function`, expressions, or dynamic imports are used.

For an estimate, calculation order is:

1. Validate the visible answers against the active configuration and area limits.
2. Resolve any selected `SET_BASE_RATE` option in stable field/option order.
3. Calculate base amount as `area × base rate`.
4. Apply selected `ADD_PER_UNIT` effects multiplied by area.
5. Apply selected `ADD_FLAT` effects.
6. Evaluate active pricing rules by ascending `order`, then stable `id`; apply their effects in that order.
7. Apply selected percentage effects sequentially, then the matching active location-zone multiplier.
8. Apply `minCharge` if the subtotal is below it.
9. Apply the configured spread to produce low/high values.
10. Round low and high to the nearest configured `roundTo` rupee increment.

Money is converted to integer paise at the calculation boundary. Percentage operations use integer basis points and round only at each defined operation. This keeps the result deterministic without carrying binary floating-point money through the calculation.

Percentage effects stack sequentially: a 10% effect followed by a 20% effect multiplies by `1.10`, then by `1.20`; it is not treated as a single 30% effect. Each applied effect is represented in the breakdown.

`INSPECTION_ONLY` services still use the same answer validation so the enquiry can capture a complete request, but they never calculate or expose a price. Their result has `low` and `high` set to `null` and includes the configured disclaimer or an inspection warning.

## Consequences

- The same pure functions can run in a client preview and on the server.
- Config snapshots and hashes can reproduce the inputs used for a quote.
- Invalid administrator rules fail closed instead of executing arbitrary code.
- The admin UI must use the documented condition shape and show the resulting rule order clearly.
