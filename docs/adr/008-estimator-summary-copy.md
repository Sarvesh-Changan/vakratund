# ADR 008: Configured estimator summary copy

## Context

The simplified estimator needs short “Included” and “Not included” lists in its
summary. The existing estimator service model had no structured place for that
copy, so deriving it in the UI would make the summary inaccurate or uneditable.

## Decision

Store `includedText` and `notIncludedText` as text arrays on `EstimatorService`.
They are loaded with the estimator config and remain part of the immutable quote
snapshot. The estimator field presentation settings are stored on
`EstimatorField` as `isAdvanced`, `presetValues`, `unitLabel`, and `shortHelp`.

## Consequences

Admins can maintain the summary copy with the estimator configuration. Existing
rows receive empty arrays through the migration and should be completed before
publishing a production estimator. No calculation or quote persistence rules
change.

## Status

Accepted
