# Duration Filter Decisions

## Opt-out over opt-in

The shared `getAvailableDurations()` returns the full set of durations supported by the data span. Consumers filter out what they don't support rather than opting in to what they need.

**Rationale**: Most consumers want all durations. Opt-out means new durations are automatically available everywhere without updating each consumer. Only consumers with genuine constraints need to act.

## Tier Trends excludes Hourly

Tier Trends filters out `Duration.HOURLY` from its available durations. Hourly grouping produces too many columns for the table layout, and per-hour aggregation is meaningless for the metrics displayed (wave, coins, cells are per-run values, not time-rate values).

## Historical: Coverage Report previously excluded Yearly

Coverage Report had a `filterSupportedDurations()` that removed Yearly. This was unintentional divergence -- there was no technical reason to exclude it. Removed during unification.

## Re-evaluation trigger

If 2-3+ consumers need to exclude the same duration, consider moving the exclusion into the shared system rather than repeating opt-out logic.
