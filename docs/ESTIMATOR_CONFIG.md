# Estimator configuration and calculation reference

This document describes the current `EstimatorConfig` model and `calculateEstimate` implementation. Treat the engine and its existing outputs as compatibility boundaries. Quotes persist a full configuration snapshot and hash; configuration edits affect only future estimates.

## Configuration model

- A service has a stable slug, display name, mode (`ESTIMATE` or `INSPECTION_ONLY`), unit, base rate, minimum charge, area limits, range percentage, rounding increment, disclaimer, version and ordered fields/rules.
- A field has a stable key, visitor label, type, required/advanced flags, numeric limits/defaults/presets/unit, optional visibility condition and optional price effect. Active options belong to fields and have a stored value, label, order and optional price effect.
- A rule has an order, condition and effect. Conditions can be a leaf comparison or nested `all`/`any` groups. An empty group never matches.
- Location entries have a name, keywords, percentage adjustment and order. Matching is exact after trimming and lowercasing: an answer matches a location id, name or one keyword.
- `Quote.configSnapshot`, `configHash`, saved totals and saved breakdown are immutable historical data. This configuration editor does not rewrite them.

## Effects

`NONE` changes nothing. `SET_BASE_RATE` selects the last matching field or option in field/option order and replaces the service's base rate before area multiplication. Field effects are collected before selected option effects. `ADD_PER_UNIT` adds `effectValue × area`; `ADD_FLAT` adds the value once; `MULTIPLY_PERCENT` changes the running subtotal by the percentage. Effects on rules use the same types; a rule's `SET_BASE_RATE` resets subtotal to `area × effectValue`.

## Calculation order

1. Validate the supplied answers against active fields, visibility, active options, field limits and service area limits. Invalid input returns no price and validation warnings.
2. Add the configured disclaimer to warnings. Inspection-only services return no price.
3. Choose the last matching base-rate override, then calculate area × base rate.
4. Add all per-unit effects, then all fixed-amount effects.
5. Apply matching active rules in ascending `order`, then id order.
6. Apply selected percentage effects in collected order.
7. Find the first active location matching the supplied location answer and apply its percentage.
8. Raise the subtotal to the minimum charge when necessary.
9. Calculate the low and high values using the nonnegative spread percentage, then round both independently to the nearest configured increment.

All monetary math is performed in integer cents internally. The returned breakdown is presentation data from the same calculation. `explainEstimate` only changes wording and reads the engine's totals and breakdown; it is not a second calculator.

## Safe maintenance

Run `npm run estimator:audit` before cleanup. `npm run estimator:normalize` is a dry run; review its report before `npm run estimator:normalize -- --apply`. Cleanup must compare generated totals before writing and must never alter quote snapshots. Any new stored column must be optional or defaulted and migrations must be additive.
