# Migration Story 09: Analysis - Shared Utilities Extraction

## Parent PRD
See [PRD Enhanced File Structure Organization Through AI Instructions](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md) for complete context and organizational principles.

## Story Overview

**Feature**: Analysis / Shared Utilities
**Goal**: Extract truly shared analysis utilities used by 2+ analysis features into a dedicated shared location.
**Scope**: File movement and import statement updates ONLY - no logic changes or refactoring.

## Prerequisites

**CRITICAL**: This story should be executed **AFTER** the following migrations are complete:
- ✅ Story 05: Tier Trends migration
- ✅ Story 06: Tier Stats migration
- ✅ Story 07: Deaths Radar migration
- ✅ Story 08: Time Series migration

**Reason**: You cannot identify truly shared code until you see what each feature actually uses.

## Current State

Expected shared utilities still in old locations:

```
src/features/data-tracking/utils/
├── aggregation-strategies.ts
├── aggregation-strategies.test.ts
├── percentile-calculation.ts
├── percentile-calculation.test.ts
├── field-percentile-calculation.ts
├── field-percentile-calculation.test.ts
├── hourly-rate-calculations.ts
├── hourly-rate-calculations.test.ts
└── (other utilities that may or may not be shared)

src/features/data-tracking/logic/
└── (potentially shared logic files)
```

**Total**: Estimated **8-12 files** (exact count TBD after investigation)

## Investigation Tasks (FIRST)

After all analysis features are migrated, investigate which utilities are **truly shared**:

1. **Identify shared imports**:
   ```bash
   # For each utility file, find who imports it
   Grep -r "aggregation-strategies" src/features/analysis/
   Grep -r "percentile-calculation" src/features/analysis/
   Grep -r "hourly-rate-calculations" src/features/analysis/
   ```

2. **Categorize by usage**:
   - **Used by 2+ features**: Move to `analysis/shared/`
   - **Used by 1 feature only**: Move to that feature's directory (if not already there)
   - **Used by 0 features**: Consider for deletion (but investigate first - may be used by pages directly)

3. **Check for external dependencies**:
   - Do any files outside `analysis/` import these utilities?
   - If yes, they may belong in `src/shared/` instead of `analysis/shared/`

4. **Map utility relationships**:
   - Which utilities depend on other utilities?
   - What's the import hierarchy?

## Target State

```
src/features/analysis/shared/
├── aggregation-strategies.ts            # Shared by tier-trends, tier-stats, time-series
├── aggregation-strategies.test.ts
├── percentile-calculation.ts            # Shared by tier-trends, tier-stats
├── percentile-calculation.test.ts
├── field-percentile-calculation.ts      # Shared by tier-trends, tier-stats
├── field-percentile-calculation.test.ts
├── hourly-rate-calculations.ts          # Shared by multiple features
└── hourly-rate-calculations.test.ts
```

**Note**: Actual contents depend on investigation findings.

## Benefits

- **Clear shared code location**: Developers know where to find reusable analysis utilities
- **No duplication**: Single source of truth for shared logic
- **Easy to discover**: "What aggregation methods are available?" → `analysis/shared/`
- **Feature independence**: Each feature can use shared utilities without coupling to other features

## Implementation Tasks (After Investigation)

### 1. Document Findings

After investigation, create a table:

| Utility File | Used By Features | Move To |
|--------------|------------------|---------|
| aggregation-strategies.ts | tier-trends, tier-stats, time-series | analysis/shared/ |
| percentile-calculation.ts | tier-trends, tier-stats | analysis/shared/ |
| hourly-rate-calculations.ts | tier-trends | tier-trends/logic/ |
| ... | ... | ... |

### 2. Create Directory Structure

```bash
mkdir -p src/features/analysis/shared
```

### 3. Move Truly Shared Files

Move from `src/features/data-tracking/utils/`:
- Files used by **2+ analysis features** → `analysis/shared/`
- Files used by **1 analysis feature** → that feature's `logic/` directory
- Files used by **0 analysis features** → investigate further (may be dead code, or used by pages)

Example moves (based on typical usage patterns):

**To `analysis/shared/`** (used by multiple features):
- `aggregation-strategies.ts` → `shared/aggregation-strategies.ts`
- `aggregation-strategies.test.ts` → `shared/aggregation-strategies.test.ts`
- `percentile-calculation.ts` → `shared/percentile-calculation.ts`
- `percentile-calculation.test.ts` → `shared/percentile-calculation.test.ts`
- `field-percentile-calculation.ts` → `shared/field-percentile-calculation.ts`
- `field-percentile-calculation.test.ts` → `shared/field-percentile-calculation.test.ts`

**To specific feature** (if only used by one feature):
- Example: If `hourly-rate-calculations.ts` only used by tier-trends:
  - Move to `tier-trends/logic/hourly-rate-calculations.ts`

### 4. Update Import Statements

**From** (tier-trends using shared utilities):
```typescript
import { aggregationStrategies } from '@/features/data-tracking/utils/aggregation-strategies'
import { calculatePercentile } from '@/features/data-tracking/utils/percentile-calculation'
```

**To**:
```typescript
import { aggregationStrategies } from '@/features/analysis/shared/aggregation-strategies'
import { calculatePercentile } from '@/features/analysis/shared/percentile-calculation'
```

**From** (tier-stats using shared utilities):
```typescript
import { aggregationStrategies } from '@/features/data-tracking/utils/aggregation-strategies'
import { calculatePercentile } from '@/features/data-tracking/utils/percentile-calculation'
```

**To**:
```typescript
import { aggregationStrategies } from '@/features/analysis/shared/aggregation-strategies'
import { calculatePercentile } from '@/features/analysis/shared/percentile-calculation'
```

**Tools**:
- Use `Grep` to find all imports of each shared utility
- Update all analysis feature files
- Update any page files that import utilities directly
- Run tests after each batch

### 5. Update Barrel Exports (if applicable)

```typescript
// src/features/analysis/shared/index.ts
export * from './aggregation-strategies'
export * from './percentile-calculation'
export * from './field-percentile-calculation'
export * from './hourly-rate-calculations'
```

### 6. Handle Feature-Specific Utilities

If investigation reveals utilities used by only one feature:

**Option A**: Move to feature's `logic/` directory
```
tier-trends/logic/
└── hourly-rate-calculations.ts  # Only used by tier-trends
```

**Option B**: Leave in place (if already in feature directory from previous migration)

### 7. Verification

- [ ] Run `npm run build` to ensure no import errors
- [ ] Run `npm run test` to verify all tests pass
- [ ] Run `npm run type-check` to verify TypeScript compilation
- [ ] Verify all analysis pages still work (tier-trends, tier-stats, deaths-radar, time-series)
- [ ] Verify shared utilities are imported from correct location
- [ ] Verify feature-specific utilities are not in shared/

## Migration Rules

**CRITICAL**:
- **Investigate FIRST** - only move files that are **actually shared** (used by 2+ features)
- **NO premature abstraction** - if only 1 feature uses it, don't move to shared/
- **NO logic changes** - only file movement and import updates
- **NO refactoring** - resist the urge to "improve" shared utilities
- **NO renaming** - keep all file names exactly as they are
- **Tests stay with implementation** - test files move alongside source files
- **One PR** - all changes in a single atomic commit for easy revert if needed

## Special Considerations

### Three-Way Decision: shared/ vs. feature/logic/ vs. src/shared/

For each utility, decide:

1. **Move to `analysis/shared/`**:
   - Used by 2+ analysis features
   - Analysis-specific logic (not general-purpose)
   - Example: Percentile calculations specific to game run data

2. **Move to `<feature>/logic/`**:
   - Used by only 1 analysis feature
   - Feature-specific logic
   - Example: Tier-trends-specific display transformations

3. **Move to `src/shared/`**:
   - Used by analysis features AND non-analysis features
   - General-purpose utility (not domain-specific)
   - Example: Generic date formatting or number utilities

### Documentation

Create a decision log:

```markdown
## Shared Utility Decision Log

### aggregation-strategies.ts
- **Decision**: Move to `analysis/shared/`
- **Reason**: Used by tier-trends, tier-stats, time-series
- **Evidence**: Grep found imports in 3 features

### hourly-rate-calculations.ts
- **Decision**: Move to `tier-trends/logic/`
- **Reason**: Only imported by tier-trends
- **Evidence**: Grep found imports only in tier-trends/

### (continue for each utility)
```

## Notes

- This is a **discovery and consolidation** story, not a simple move
- Investigation is critical - don't guess at shared vs. feature-specific
- Some utilities may be dead code - document but don't delete in this story
- Shared utilities should have high test coverage (they're used by multiple features)

## Success Criteria

- [ ] Investigation complete - usage of all utilities documented
- [ ] All truly shared utilities moved to `analysis/shared/`
- [ ] All feature-specific utilities moved to appropriate feature directories
- [ ] Zero import errors after migration
- [ ] All tests passing
- [ ] Application builds successfully
- [ ] All analysis pages work identically to before
- [ ] No logic or behavior changes introduced
- [ ] Decision log created documenting shared vs. feature-specific decisions
- [ ] Developer can easily find shared analysis utilities in one location
