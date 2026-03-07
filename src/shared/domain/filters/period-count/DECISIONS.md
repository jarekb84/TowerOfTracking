# Period Count Filter Decisions

## "All" included by default

`PeriodCountSelector` shows an "All" option by default. Consumers opt out via `showAllOption={false}` when "All" would break their layout.

**Rationale**: Most chart-based consumers benefit from showing all available data. Only table-based consumers (where each period = a column) need to restrict this.

## Tier Trends excludes "All"

Tier Trends uses `showAllOption={false}` because each period count maps to a table column. "All" would produce an unbounded number of columns, breaking the layout.

## PeriodCountOverrides for layout-appropriate values

Chart-based layouts need large period counts (7, 14, 21, 28 days). Table-based layouts need small values (2-7 columns). The `PeriodCountOverrides` type lets consumers provide layout-appropriate options while staying in the shared system.

**Current override users**: Tier Trends (`TIER_TRENDS_PERIOD_COUNTS` in `tier-trends-period-counts.ts`)

## Re-evaluation trigger

If more consumers need "All" excluded or custom period count ranges, consider whether the override pattern is scaling well or if a higher-level abstraction (e.g., layout-type presets) would be cleaner.
