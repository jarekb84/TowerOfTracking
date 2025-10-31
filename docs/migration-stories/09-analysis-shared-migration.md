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

Utilities still in old locations (actual state post-migrations):

```
src/features/data-tracking/logic/
├── aggregation-strategies.ts
├── aggregation-strategies.test.ts
├── field-percentile-calculation.ts
├── field-percentile-calculation.test.ts
├── hourly-rate-calculations.ts
├── hourly-rate-calculations.test.ts
├── percentile-calculation.ts
├── percentile-calculation.test.ts
└── trend-value-formatting.ts
└── trend-value-formatting.test.ts

src/features/data-tracking/utils/
├── run-type-filter.ts              # Used by ALL 4 analysis features
├── run-type-filter.test.ts
├── field-utils.ts                  # Used by 2+ features
├── field-utils.test.ts
├── chart-formatters.ts             # Used by 2+ features
├── chart-formatters.test.ts
├── data-parser.ts                  # Used by 2+ features
├── data-parser.test.ts
├── trend-indicators.ts             # tier-trends only
├── trend-indicators.test.ts
├── field-type-detection.ts         # tier-trends only
├── field-type-detection.test.ts
├── run-header-formatting.ts        # tier-trends only
├── run-header-formatting.test.ts
├── column-reorder.ts               # tier-stats only
├── column-reorder.test.ts
├── date-aggregation.ts             # time-series only
└── date-aggregation.test.ts
```

**Total**: **22 files** (11 implementation + 11 tests) requiring migration

## Investigation Results (COMPLETE)

Investigation completed after Stories 05-08. All analysis features migrated and import patterns analyzed.

### Actual Usage Breakdown

| Utility File | Used By Features | Import Count | Decision |
|--------------|------------------|--------------|----------|
| **run-type-filter.ts** | tier-trends, tier-stats, time-series, deaths-radar | 13 imports | `analysis/shared/` ✅ |
| **field-utils.ts** | tier-stats, deaths-radar | 7 imports | `analysis/shared/` ✅ |
| **chart-formatters.ts** | tier-stats, time-series | 3 imports | `analysis/shared/` ✅ |
| **data-parser.ts** | tier-stats, tier-trends | 3 imports | `analysis/shared/` ✅ |
| **trend-indicators.ts** | tier-trends only | 4 imports | `tier-trends/logic/` |
| **trend-value-formatting.ts** | tier-trends only | 2 imports | `tier-trends/logic/` |
| **aggregation-strategies.ts** | tier-trends only | 1 import | `tier-trends/logic/` |
| **hourly-rate-calculations.ts** | tier-trends only | 1 import | `tier-trends/logic/` |
| **field-type-detection.ts** | tier-trends only | 1 import | `tier-trends/logic/` |
| **run-header-formatting.ts** | tier-trends only | 1 import | `tier-trends/logic/` |
| **field-percentile-calculation.ts** | tier-stats only | 1 import | `tier-stats/logic/` |
| **column-reorder.ts** | tier-stats only | 1 import | `tier-stats/logic/` |
| **date-aggregation.ts** | time-series only | 1 import | `time-series/logic/` |
| **percentile-calculation.ts** | Not used by analysis | 0 imports | Keep in `data-tracking/logic/` |

### Key Findings

**Truly Shared (4 utilities)**:
- Only 4 files are shared by 2+ analysis features
- `run-type-filter.ts` is the most widely used (all 4 features, 13 imports)
- Total: 8 files (4 implementation + 4 tests) → `analysis/shared/`

**Feature-Specific (9 utilities)**:
- 6 utilities belong exclusively to tier-trends
- 2 utilities belong exclusively to tier-stats
- 1 utility belongs exclusively to time-series
- Total: 18 files (9 implementation + 9 tests) → respective feature directories

**Unused by Analysis (1 utility)**:
- `percentile-calculation.ts` not imported by any analysis feature
- May be used elsewhere, or dead code
- Decision: Keep in `data-tracking/logic/` for now (investigate separately)

## Target State

```
src/features/analysis/shared/
├── run-type-filter.ts                   # Shared by ALL 4 features (13 imports)
├── run-type-filter.test.ts
├── field-utils.ts                       # Shared by 2 features (7 imports)
├── field-utils.test.ts
├── chart-formatters.ts                  # Shared by 2 features (3 imports)
├── chart-formatters.test.ts
├── data-parser.ts                       # Shared by 2 features (3 imports)
└── data-parser.test.ts

src/features/analysis/tier-trends/logic/
├── (existing files from Story 05)
├── trend-indicators.ts                  # tier-trends only (4 imports)
├── trend-indicators.test.ts
├── trend-value-formatting.ts            # tier-trends only (2 imports)
├── trend-value-formatting.test.ts
├── aggregation-strategies.ts            # tier-trends only (1 import)
├── aggregation-strategies.test.ts
├── hourly-rate-calculations.ts          # tier-trends only (1 import)
├── hourly-rate-calculations.test.ts
├── field-type-detection.ts              # tier-trends only (1 import)
├── field-type-detection.test.ts
├── run-header-formatting.ts             # tier-trends only (1 import)
└── run-header-formatting.test.ts

src/features/analysis/tier-stats/logic/
├── (existing files from Story 06)
├── field-percentile-calculation.ts      # tier-stats only (1 import)
├── field-percentile-calculation.test.ts
├── column-reorder.ts                    # tier-stats only (1 import)
└── column-reorder.test.ts

src/features/analysis/time-series/logic/
├── date-aggregation.ts                  # time-series only (1 import)
└── date-aggregation.test.ts

src/features/data-tracking/logic/
└── percentile-calculation.ts            # Not used by analysis features
└── percentile-calculation.test.ts
```

**Note**: Investigation complete - these are the actual file locations based on usage analysis.

## Benefits

- **Clear shared code location**: Developers know where to find reusable analysis utilities
- **No duplication**: Single source of truth for shared logic
- **Easy to discover**: "What aggregation methods are available?" → `analysis/shared/`
- **Feature independence**: Each feature can use shared utilities without coupling to other features

## Implementation Tasks

### 1. Create Directory Structure

```bash
mkdir -p src/features/analysis/shared
```

Note: Feature-specific `logic/` directories already exist from Stories 05-08.

### 2. Move Truly Shared Files (8 files)

**To `analysis/shared/`** (used by 2+ features):

```bash
# Most widely shared - used by ALL 4 features
git mv src/features/data-tracking/utils/run-type-filter.ts src/features/analysis/shared/
git mv src/features/data-tracking/utils/run-type-filter.test.ts src/features/analysis/shared/

# Shared by 2+ features
git mv src/features/data-tracking/utils/field-utils.ts src/features/analysis/shared/
git mv src/features/data-tracking/utils/field-utils.test.ts src/features/analysis/shared/

git mv src/features/data-tracking/utils/chart-formatters.ts src/features/analysis/shared/
git mv src/features/data-tracking/utils/chart-formatters.test.ts src/features/analysis/shared/

git mv src/features/data-tracking/utils/data-parser.ts src/features/analysis/shared/
git mv src/features/data-tracking/utils/data-parser.test.ts src/features/analysis/shared/
```

### 3. Move Feature-Specific Files

**To `tier-trends/logic/`** (12 files - 6 utilities used only by tier-trends):

```bash
# From utils/
git mv src/features/data-tracking/utils/trend-indicators.ts src/features/analysis/tier-trends/logic/
git mv src/features/data-tracking/utils/trend-indicators.test.ts src/features/analysis/tier-trends/logic/

git mv src/features/data-tracking/utils/field-type-detection.ts src/features/analysis/tier-trends/logic/
git mv src/features/data-tracking/utils/field-type-detection.test.ts src/features/analysis/tier-trends/logic/

git mv src/features/data-tracking/utils/run-header-formatting.ts src/features/analysis/tier-trends/logic/
git mv src/features/data-tracking/utils/run-header-formatting.test.ts src/features/analysis/tier-trends/logic/

# From logic/
git mv src/features/data-tracking/logic/trend-value-formatting.ts src/features/analysis/tier-trends/logic/
git mv src/features/data-tracking/logic/trend-value-formatting.test.ts src/features/analysis/tier-trends/logic/

git mv src/features/data-tracking/logic/aggregation-strategies.ts src/features/analysis/tier-trends/logic/
git mv src/features/data-tracking/logic/aggregation-strategies.test.ts src/features/analysis/tier-trends/logic/

git mv src/features/data-tracking/logic/hourly-rate-calculations.ts src/features/analysis/tier-trends/logic/
git mv src/features/data-tracking/logic/hourly-rate-calculations.test.ts src/features/analysis/tier-trends/logic/
```

**To `tier-stats/logic/`** (4 files - 2 utilities used only by tier-stats):

```bash
git mv src/features/data-tracking/logic/field-percentile-calculation.ts src/features/analysis/tier-stats/logic/
git mv src/features/data-tracking/logic/field-percentile-calculation.test.ts src/features/analysis/tier-stats/logic/

git mv src/features/data-tracking/utils/column-reorder.ts src/features/analysis/tier-stats/logic/
git mv src/features/data-tracking/utils/column-reorder.test.ts src/features/analysis/tier-stats/logic/
```

**To `time-series/logic/`** (2 files - 1 utility used only by time-series):

```bash
# Create logic/ directory for time-series
mkdir -p src/features/analysis/time-series/logic

git mv src/features/data-tracking/utils/date-aggregation.ts src/features/analysis/time-series/logic/
git mv src/features/data-tracking/utils/date-aggregation.test.ts src/features/analysis/time-series/logic/
```

### 4. Leave in Place

**Keep in `data-tracking/logic/`** (not used by analysis features):
- `percentile-calculation.ts` + test (may be used elsewhere or dead code)

### 5. Update Import Statements

**Expected import updates**: ~35 files across all 4 analysis features

#### Shared Utilities Import Updates

**From**:
```typescript
import { filterRunsByType, RunTypeFilter } from '@/features/data-tracking/utils/run-type-filter'
import { getFieldValue } from '@/features/data-tracking/utils/field-utils'
import { formatLargeNumber } from '@/features/data-tracking/utils/chart-formatters'
import { formatNumber, formatDuration } from '@/features/data-tracking/utils/data-parser'
```

**To**:
```typescript
import { filterRunsByType, RunTypeFilter } from '@/features/analysis/shared/run-type-filter'
import { getFieldValue } from '@/features/analysis/shared/field-utils'
import { formatLargeNumber } from '@/features/analysis/shared/chart-formatters'
import { formatNumber, formatDuration } from '@/features/analysis/shared/data-parser'
```

#### Tier-Trends Feature-Specific Import Updates

**From**:
```typescript
import { getTrendChangeColor } from '@/features/data-tracking/utils/trend-indicators'
import { formatTrendValue } from '@/features/data-tracking/logic/trend-value-formatting'
import { aggregationStrategies } from '@/features/data-tracking/logic/aggregation-strategies'
import { calculateCoinsPerHour } from '@/features/data-tracking/logic/hourly-rate-calculations'
import { isTrendableField } from '@/features/data-tracking/utils/field-type-detection'
import { createEnhancedRunHeader } from '@/features/data-tracking/utils/run-header-formatting'
```

**To**:
```typescript
import { getTrendChangeColor } from '@/features/analysis/tier-trends/logic/trend-indicators'
import { formatTrendValue } from '@/features/analysis/tier-trends/logic/trend-value-formatting'
import { aggregationStrategies } from '@/features/analysis/tier-trends/logic/aggregation-strategies'
import { calculateCoinsPerHour } from '@/features/analysis/tier-trends/logic/hourly-rate-calculations'
import { isTrendableField } from '@/features/analysis/tier-trends/logic/field-type-detection'
import { createEnhancedRunHeader } from '@/features/analysis/tier-trends/logic/run-header-formatting'
```

#### Tier-Stats Feature-Specific Import Updates

**From**:
```typescript
import { calculateFieldPercentiles } from '@/features/data-tracking/logic/field-percentile-calculation'
import { reorderColumns } from '@/features/data-tracking/utils/column-reorder'
```

**To**:
```typescript
import { calculateFieldPercentiles } from '@/features/analysis/tier-stats/logic/field-percentile-calculation'
import { reorderColumns } from '@/features/analysis/tier-stats/logic/column-reorder'
```

#### Time-Series Feature-Specific Import Updates

**From**:
```typescript
import { prepareCoinsPerRunData } from '@/features/data-tracking/utils/date-aggregation'
```

**To**:
```typescript
import { prepareCoinsPerRunData } from '@/features/analysis/time-series/logic/date-aggregation'
```

**Tools**:
- Use `Grep` to find all imports for each utility
- Update imports using `Edit` tool
- Verify no broken imports remain using TypeScript compiler

### 6. Create Barrel Exports (Optional)

```typescript
// src/features/analysis/shared/index.ts
export * from './run-type-filter'
export * from './field-utils'
export * from './chart-formatters'
export * from './data-parser'
```

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

### Decision Log

Complete decision log documenting the actual investigation results:

```markdown
## Shared Utility Decision Log

### run-type-filter.ts
- **Decision**: Move to `analysis/shared/`
- **Reason**: Used by ALL 4 analysis features (tier-trends, tier-stats, time-series, deaths-radar)
- **Evidence**: 13 imports across analysis features
- **Priority**: CRITICAL - most widely shared utility

### field-utils.ts
- **Decision**: Move to `analysis/shared/`
- **Reason**: Used by tier-stats and deaths-radar
- **Evidence**: 7 imports across 2 features

### chart-formatters.ts
- **Decision**: Move to `analysis/shared/`
- **Reason**: Used by tier-stats and time-series
- **Evidence**: 3 imports across 2 features

### data-parser.ts
- **Decision**: Move to `analysis/shared/`
- **Reason**: Used by tier-stats and tier-trends
- **Evidence**: 3 imports across 2 features (formatNumber, formatDuration)

### trend-indicators.ts
- **Decision**: Move to `tier-trends/logic/`
- **Reason**: Only used by tier-trends
- **Evidence**: 4 imports, all in tier-trends/

### trend-value-formatting.ts
- **Decision**: Move to `tier-trends/logic/`
- **Reason**: Only used by tier-trends
- **Evidence**: 2 imports, all in tier-trends/

### aggregation-strategies.ts
- **Decision**: Move to `tier-trends/logic/`
- **Reason**: Only used by tier-trends (NOT shared as initially assumed)
- **Evidence**: 1 import, only in tier-trends/

### hourly-rate-calculations.ts
- **Decision**: Move to `tier-trends/logic/`
- **Reason**: Only used by tier-trends
- **Evidence**: 1 import, only in tier-trends/

### field-type-detection.ts
- **Decision**: Move to `tier-trends/logic/`
- **Reason**: Only used by tier-trends
- **Evidence**: 1 import, only in tier-trends/

### run-header-formatting.ts
- **Decision**: Move to `tier-trends/logic/`
- **Reason**: Only used by tier-trends
- **Evidence**: 1 import, only in tier-trends/

### field-percentile-calculation.ts
- **Decision**: Move to `tier-stats/logic/`
- **Reason**: Only used by tier-stats (NOT shared as initially assumed)
- **Evidence**: 1 import, only in tier-stats/

### column-reorder.ts
- **Decision**: Move to `tier-stats/logic/`
- **Reason**: Only used by tier-stats
- **Evidence**: 1 import, only in tier-stats/

### date-aggregation.ts
- **Decision**: Move to `time-series/logic/`
- **Reason**: Only used by time-series
- **Evidence**: 1 import, only in time-series/

### percentile-calculation.ts
- **Decision**: Keep in `data-tracking/logic/`
- **Reason**: Not used by any analysis features
- **Evidence**: 0 imports in analysis/ - may be used elsewhere or dead code
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
