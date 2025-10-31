# Migration Story 08: Analysis - Time Series Charts Feature Reorganization

## Parent PRD
See [PRD Enhanced File Structure Organization Through AI Instructions](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md) for complete context and organizational principles.

## Story Overview

**Feature**: Analysis / Time Series Charts
**Goal**: Reorganize time series chart feature into a cohesive, reusable structure.
**Scope**: File movement and import statement updates ONLY - no logic changes or refactoring.

## Context Note

Time series charts support multiple periods (run, daily, weekly, monthly, yearly) and are used across multiple pages:
- Cell time series page
- Coin time series page
- Potentially other metrics over time

The time series component should be **reusable** - different pages pass different source data but use the same chart infrastructure.

## Current State

**IMPORTANT**: This migration requires investigation first - actual file locations may differ from assumptions.

Expected files (location TBD):
```
src/features/data-tracking/components/ (?)
├── time-series-chart.tsx
└── (other chart-related components)

src/features/data-tracking/hooks/ (?)
├── use-chart-navigation.ts
├── use-chart-navigation.test.tsx
└── (other chart hooks)

src/features/data-tracking/logic/ or utils/ (?)
└── (time series data transformations, aggregations)
```

**Total**: Estimated **5-10 files** (exact count TBD after investigation)

## Investigation Tasks (FIRST)

Before moving files, investigate:

1. **Find time series components**:
   ```bash
   # Search for time series files
   Grep -i "time.*series" -r src/
   Grep -i "TimeSeries" -r src/
   Grep -i "chart.*navigation" -r src/
   ```

2. **Identify usage points**:
   - Cell time series page - what does it import?
   - Coin time series page - what does it import?
   - Are there separate components or one reusable component?

3. **Map dependencies**:
   - What hooks are specific to time series?
   - What logic handles period aggregation (daily, weekly, etc.)?
   - What utilities format time series data?
   - What's shared with other analysis features vs. time-series-specific?

4. **Check for duplication**:
   - Are cell and coin time series using the same components?
   - Or are there two separate implementations that should be consolidated? (NO consolidation in this migration, but document for future)

## Target State (Tentative)

```
src/features/analysis/time-series/
├── time-series-chart.tsx                 # Main reusable chart component
├── time-series-chart.test.tsx            # Component tests
├── use-chart-navigation.ts               # Navigation/period hook
├── use-chart-navigation.test.tsx
├── use-time-series-data.ts               # Data transformation hook (if exists)
├── use-time-series-data.test.tsx
│
├── components/                           # Sub-components (if 3+ exist)
│   ├── period-selector.tsx               # Period selection UI
│   ├── chart-legend.tsx                  # Chart legend component
│   └── chart-controls.tsx                # Chart control buttons
│
└── logic/                                # Pure business logic (if exists)
    ├── time-aggregation.ts               # Aggregate data by period
    ├── time-aggregation.test.ts
    ├── period-calculations.ts            # Period boundary calculations
    └── period-calculations.test.ts
```

**Note**: Actual structure depends on investigation findings. May be simpler or more complex.

## Benefits

- **Reusable infrastructure**: Single time-series implementation for cell, coin, or future metrics
- **Clear separation**: Chart UI vs. data transformation vs. period logic
- **Easy to extend**: Adding new period types or chart features has obvious location
- **Consistent experience**: Cell and coin time series share same UX patterns

## Implementation Tasks (After Investigation)

### 1. Document Current State

After investigation, document:
- Exact file locations and count
- Usage patterns (cell page, coin page, others)
- Whether components are already shared or duplicated
- Dependencies and cross-feature imports
- Shared utilities vs. time-series-specific logic

### 2. Create Directory Structure

```bash
mkdir -p src/features/analysis/time-series
mkdir -p src/features/analysis/time-series/components  # If 3+ sub-components exist
mkdir -p src/features/analysis/time-series/logic       # If logic files exist
```

### 3. Move Files - Main Components

Move from `src/features/data-tracking/components/`:
- `time-series-chart.tsx` → root of `time-series/`
- Related component files → root or `components/` subdirectory (based on count)

### 4. Move Files - Hooks

Move from `src/features/data-tracking/hooks/`:
- `use-chart-navigation.ts` → root of `time-series/`
- `use-chart-navigation.test.tsx` → root of `time-series/`
- Other time-series hooks → root of `time-series/`

### 5. Move Files - Logic

Move from `src/features/data-tracking/logic/` or `utils/`:
- Time aggregation logic → `logic/` subdirectory
- Period calculation logic → `logic/` subdirectory

**CRITICAL DECISION**: Some aggregation logic may be shared with tier-stats or tier-trends. If so:
- Leave shared aggregation in `analysis/shared/`
- Only move time-series-specific logic to `time-series/logic/`

### 6. Update Import Statements

**From** (cell time series page):
```typescript
import { TimeSeriesChart } from '@/features/data-tracking/components/time-series-chart'
import { useChartNavigation } from '@/features/data-tracking/hooks/use-chart-navigation'
```

**To**:
```typescript
import { TimeSeriesChart } from '@/features/analysis/time-series/time-series-chart'
import { useChartNavigation } from '@/features/analysis/time-series/use-chart-navigation'
```

**From** (coin time series page):
```typescript
import { TimeSeriesChart } from '@/features/data-tracking/components/time-series-chart'
import { useChartNavigation } from '@/features/data-tracking/hooks/use-chart-navigation'
```

**To**:
```typescript
import { TimeSeriesChart } from '@/features/analysis/time-series/time-series-chart'
import { useChartNavigation } from '@/features/analysis/time-series/use-chart-navigation'
```

**Tools**:
- Use `Grep` to find all time-series-related imports
- Update cell time series page
- Update coin time series page
- Update any other consumers
- Run tests after each update

### 7. Update Barrel Exports (if applicable)

```typescript
// src/features/analysis/time-series/index.ts
export * from './time-series-chart'
export * from './use-chart-navigation'
// Add other exports as needed
```

### 8. Verification

- [ ] Run `npm run build` to ensure no import errors
- [ ] Run `npm run test` to verify all tests pass
- [ ] Run `npm run type-check` to verify TypeScript compilation
- [ ] Manually test cell time series page
- [ ] Manually test coin time series page
- [ ] Test all period types (run, daily, weekly, monthly, yearly)
- [ ] Test chart navigation controls
- [ ] Verify both pages use same component successfully

## Migration Rules

**CRITICAL**:
- **Investigate FIRST** - understand current structure and usage before moving
- **NO logic changes** - only file movement and import updates
- **NO refactoring** - resist the urge to "improve" code or consolidate duplicates
- **NO renaming** - keep all file names exactly as they are
- **Tests stay with implementation** - test files move alongside source files
- **One PR** - all changes in a single atomic commit for easy revert if needed

## Special Considerations

### Shared Aggregation Logic

**CRITICAL DECISION POINT**: Time aggregation logic may be used by:
- Time series charts (daily, weekly, monthly rollups)
- Tier trends (aggregating runs by tier over time)
- Tier stats (aggregating stats by tier)

**Decision criteria**:
1. If aggregation logic is **time-series specific** (period boundaries, date ranges):
   - Move to `analysis/time-series/logic/`

2. If aggregation logic is **general** (max, min, avg, percentile calculations):
   - Leave in (or move to) `analysis/shared/`

3. If **uncertain** during migration:
   - Leave in current location
   - Document in migration notes
   - Revisit in cleanup story

### Reusability Verification

After migration, verify:
- Cell time series page successfully imports from new location
- Coin time series page successfully imports from new location
- Both pages work identically to before
- Component is truly reusable (no hardcoded cell or coin specifics)

If component has cell/coin-specific logic hardcoded, **document but don't fix** - that's a future refactoring, not this migration.

## Notes

- Time series is used by multiple pages - high-impact migration
- Component should be reusable, but may have technical debt (investigate)
- Aggregation logic may be shared with other features - careful evaluation needed
- This is likely medium complexity (5-10 files)

## Success Criteria

- [ ] Investigation complete - all time series files identified and usage mapped
- [ ] All time-series-specific files moved to new location
- [ ] Shared aggregation logic decision documented (moved to shared/ or stays in time-series/)
- [ ] Zero import errors after migration
- [ ] All tests passing
- [ ] Application builds successfully
- [ ] Cell time series page works identically to before
- [ ] Coin time series page works identically to before
- [ ] Both pages successfully use same time-series component
- [ ] No logic or behavior changes introduced
- [ ] Developer can find all time series code in one feature directory
