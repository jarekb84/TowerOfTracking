# Migration Story 06: Analysis - Tier Stats Feature Reorganization

## Parent PRD
See [PRD Enhanced File Structure Organization Through AI Instructions](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md) for complete context and organizational principles.

## Story Overview

**Feature**: Analysis / Tier Stats
**Goal**: Reorganize the tier stats table feature from scattered type-based directories into a cohesive, hierarchical feature-based structure.
**Scope**: File movement and import statement updates ONLY - no logic changes or refactoring.

## Current State

Files scattered across 5 type-based directories:

```
src/features/data-tracking/
├── components/
│   ├── tier-stats-cell-tooltip.tsx
│   ├── tier-stats-config-panel.tsx
│   └── tier-stats-table.tsx
│
├── hooks/
│   ├── use-dynamic-tier-stats-table.ts
│   ├── use-tier-stats-config.tsx
│   └── use-tier-stats-config.test.tsx
│
├── logic/
│   ├── tier-stats-aggregation-options.ts
│   └── tier-stats-aggregation-options.test.ts
│
├── utils/
│   ├── tier-stats-calculator.ts
│   ├── tier-stats-calculator.test.ts
│   ├── tier-stats-cell-styles.ts
│   ├── tier-stats-cell-styles.test.ts
│   ├── tier-stats-config.ts
│   ├── tier-stats-config.test.ts
│   ├── tier-stats-persistence.ts
│   ├── tier-stats-persistence.test.ts
│   ├── tier-stats-sort.ts
│   └── tier-stats-sort.test.ts
│
└── types/
    └── tier-stats-config.types.ts
```

**Total**: **18 files across 5 directories** for a single table feature.

## Target State

```
src/features/analysis/tier-stats/
├── tier-stats-table.tsx                  # Main component
├── use-dynamic-tier-stats-table.ts       # State management
├── types.ts                              # Feature-specific types (renamed from tier-stats-config.types.ts)
│
├── config/                               # Configuration sub-feature (8 files)
│   ├── tier-stats-config-panel.tsx
│   ├── use-tier-stats-config.tsx
│   ├── use-tier-stats-config.test.tsx
│   ├── tier-stats-config-utils.ts       # Renamed from tier-stats-config.ts for clarity
│   ├── tier-stats-config-utils.test.ts
│   ├── tier-stats-persistence.ts
│   └── tier-stats-persistence.test.ts
│
├── cells/                                # Cell rendering sub-feature (3 files)
│   ├── tier-stats-cell-tooltip.tsx
│   ├── tier-stats-cell-styles.ts
│   └── tier-stats-cell-styles.test.ts
│
└── logic/                                # Pure business logic (6 files)
    ├── tier-stats-aggregation-options.ts
    ├── tier-stats-aggregation-options.test.ts
    ├── tier-stats-calculator.ts
    ├── tier-stats-calculator.test.ts
    ├── tier-stats-sort.ts
    └── tier-stats-sort.test.ts
```

## Benefits

- **18 files → 4 conceptual groups**: config, cells, logic, plus root
- **Clear feature boundaries**: Config vs. cell rendering vs. calculation logic
- **Each subdirectory < 10 files**: Adheres to 10-file threshold principle
- **Easy to extend**: Adding new aggregation type or cell renderer has obvious location
- **Improved discoverability**: "How is cell styling done?" → `cells/` subdirectory

## Implementation Tasks

### 1. Create Directory Structure

```bash
mkdir -p src/features/analysis/tier-stats/config
mkdir -p src/features/analysis/tier-stats/cells
mkdir -p src/features/analysis/tier-stats/logic
```

### 2. Move Files - Main Component (3 files)

Move from `src/features/data-tracking/components/`:
- `tier-stats-table.tsx` → root of `tier-stats/`

Move from `src/features/data-tracking/hooks/`:
- `use-dynamic-tier-stats-table.ts` → root of `tier-stats/`

Move from `src/features/data-tracking/types/`:
- `tier-stats-config.types.ts` → `types.ts` at root of `tier-stats/` (**NOTE: Rename to types.ts**)

### 3. Move Files - Configuration Sub-feature (7 files)

Move from `src/features/data-tracking/components/`:
- `tier-stats-config-panel.tsx` → `config/tier-stats-config-panel.tsx`

Move from `src/features/data-tracking/hooks/`:
- `use-tier-stats-config.tsx` → `config/use-tier-stats-config.tsx`
- `use-tier-stats-config.test.tsx` → `config/use-tier-stats-config.test.tsx`

Move from `src/features/data-tracking/utils/`:
- `tier-stats-config.ts` → `config/tier-stats-config-utils.ts` (**NOTE: Rename for clarity**)
- `tier-stats-config.test.ts` → `config/tier-stats-config-utils.test.ts`
- `tier-stats-persistence.ts` → `config/tier-stats-persistence.ts`
- `tier-stats-persistence.test.ts` → `config/tier-stats-persistence.test.ts`

### 4. Move Files - Cell Rendering Sub-feature (3 files)

Move from `src/features/data-tracking/components/`:
- `tier-stats-cell-tooltip.tsx` → `cells/tier-stats-cell-tooltip.tsx`

Move from `src/features/data-tracking/utils/`:
- `tier-stats-cell-styles.ts` → `cells/tier-stats-cell-styles.ts`
- `tier-stats-cell-styles.test.ts` → `cells/tier-stats-cell-styles.test.ts`

### 5. Move Files - Logic (6 files)

Move from `src/features/data-tracking/logic/`:
- `tier-stats-aggregation-options.ts` → `logic/tier-stats-aggregation-options.ts`
- `tier-stats-aggregation-options.test.ts` → `logic/tier-stats-aggregation-options.test.ts`

Move from `src/features/data-tracking/utils/`:
- `tier-stats-calculator.ts` → `logic/tier-stats-calculator.ts`
- `tier-stats-calculator.test.ts` → `logic/tier-stats-calculator.test.ts`
- `tier-stats-sort.ts` → `logic/tier-stats-sort.ts`
- `tier-stats-sort.test.ts` → `logic/tier-stats-sort.test.ts`

### 6. Update Import Statements

**From**:
```typescript
import { TierStatsTable } from '@/features/data-tracking/components/tier-stats-table'
import { useDynamicTierStatsTable } from '@/features/data-tracking/hooks/use-dynamic-tier-stats-table'
import { TierStatsConfigPanel } from '@/features/data-tracking/components/tier-stats-config-panel'
import { useTierStatsConfig } from '@/features/data-tracking/hooks/use-tier-stats-config'
import { tierStatsCalculator } from '@/features/data-tracking/utils/tier-stats-calculator'
import type { TierStatsConfig } from '@/features/data-tracking/types/tier-stats-config.types'
```

**To**:
```typescript
import { TierStatsTable } from '@/features/analysis/tier-stats/tier-stats-table'
import { useDynamicTierStatsTable } from '@/features/analysis/tier-stats/use-dynamic-tier-stats-table'
import { TierStatsConfigPanel } from '@/features/analysis/tier-stats/config/tier-stats-config-panel'
import { useTierStatsConfig } from '@/features/analysis/tier-stats/config/use-tier-stats-config'
import { tierStatsCalculator } from '@/features/analysis/tier-stats/logic/tier-stats-calculator'
import type { TierStatsConfig } from '@/features/analysis/tier-stats/types'
```

**Special attention**:
- Update imports for renamed file: `tier-stats-config.types.ts` → `types.ts`
- Update imports for renamed file: `tier-stats-config.ts` → `tier-stats-config-utils.ts`

**Tools**:
- Use `Grep` to find all `tier-stats` imports
- Group by importing file for systematic updates
- Run tests after each batch

### 7. Update Barrel Exports (if applicable)

```typescript
// src/features/analysis/tier-stats/index.ts
export * from './tier-stats-table'
export * from './use-dynamic-tier-stats-table'
export * from './types'

// Optional: Export key sub-components if needed
export * from './config/tier-stats-config-panel'
export * from './config/use-tier-stats-config'
export * from './logic/tier-stats-calculator'
```

### 8. Verification

- [ ] Run `npm run build` to ensure no import errors
- [ ] Run `npm run test` to verify all tests pass (especially tier-stats tests)
- [ ] Run `npm run type-check` to verify TypeScript compilation
- [ ] Manually test tier stats table in application
- [ ] Test configuration panel and settings persistence
- [ ] Test cell tooltips and styling
- [ ] Test sorting functionality
- [ ] Test aggregation calculations

## Migration Rules

**CRITICAL**:
- **NO logic changes** - only file movement and import updates
- **EXCEPTION**: Two files renamed for clarity:
  - `tier-stats-config.types.ts` → `types.ts` (standard convention for feature-level types)
  - `tier-stats-config.ts` → `tier-stats-config-utils.ts` (distinguish from hook)
- **NO other refactoring** - resist the urge to "improve" code while moving
- **Tests stay with implementation** - test files move alongside source files
- **One PR** - all changes in a single atomic commit for easy revert if needed

## File Renaming Rationale

Two files are renamed during migration:

1. **`tier-stats-config.types.ts` → `types.ts`**:
   - Standard convention: feature-level types go in `types.ts`
   - Simplifies imports: `from './types'` instead of `from './types/tier-stats-config.types'`

2. **`tier-stats-config.ts` → `tier-stats-config-utils.ts`**:
   - Avoid confusion with `use-tier-stats-config.tsx` hook
   - Clearly indicates utility functions vs. React hook

## Notes

- Configuration sub-feature is substantial (7-8 files) - persistence, panel, hooks, utils
- Cell rendering is isolated (3 files) - good candidate for reusability in other tables
- Logic subdirectory has pure calculation/sort functions - high test coverage expected
- This feature is self-contained with few external dependencies (good for migration)

## Success Criteria

- [ ] All 18 tier-stats files moved to new subdirectories
- [ ] Two files renamed as documented
- [ ] Zero import errors after migration
- [ ] All tests passing (unit tests for logic, config, cells)
- [ ] Application builds successfully
- [ ] Tier Stats table page works identically to before
- [ ] Configuration panel, cell rendering, and sorting all working
- [ ] No logic or behavior changes introduced
- [ ] Developer can find all tier-stats code in one feature directory
