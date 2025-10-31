# Migration Story 05: Analysis - Tier Trends Feature Reorganization

## Parent PRD
See [PRD Enhanced File Structure Organization Through AI Instructions](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md) for complete context and organizational principles.

## Story Overview

**Feature**: Analysis / Tier Trends
**Goal**: Reorganize the tier trends analysis feature from scattered type-based directories into a cohesive, hierarchical feature-based structure.
**Scope**: File movement and import statement updates ONLY - no logic changes or refactoring.

## Note on Naming

The parent PRD uses "analytics" but this conflicts with observability tools (Google Analytics, New Relic). This migration uses "**analysis**" instead to better represent statistical analysis and visualization features.

## Current State

Files scattered across 4 type-based directories:

```
src/features/data-tracking/
├── components/
│   ├── tier-trends-analysis.tsx
│   ├── tier-trends-analysis.test.tsx
│   ├── tier-trends-controls.tsx
│   ├── tier-trends-controls.test.tsx
│   ├── tier-trends-empty-state.tsx
│   ├── tier-trends-filters.tsx
│   ├── tier-trends-mobile-card.tsx
│   ├── tier-trends-summary.tsx
│   ├── tier-trends-table.tsx
│   └── tier-trends-table/
│       ├── column-header-renderer.ts
│       ├── column-header-renderer.test.ts
│       └── virtualized-trends-table.tsx
│
├── hooks/
│   ├── use-tier-trends-mobile.ts
│   ├── use-tier-trends-mobile.test.tsx
│   ├── use-tier-trends-view-state.ts
│   └── use-tier-trends-view-state.test.tsx
│
├── logic/
│   ├── tier-trends-display.ts
│   ├── tier-trends-display.test.ts
│   ├── tier-trends-ui-options.ts
│   └── tier-trends-ui-options.test.ts
│
└── utils/
    ├── tier-trends.ts
    ├── tier-trends.test.ts
    ├── tier-trends-mobile.ts
    └── tier-trends-mobile.test.ts
```

**Total**: **22 files across 4 directories** - the poster child for why type-based organization fails.

## Target State

```
src/features/analysis/tier-trends/
├── tier-trends-analysis.tsx              # Main component
├── tier-trends-analysis.test.tsx
├── use-tier-trends-view-state.ts         # State management hook
├── use-tier-trends-view-state.test.tsx
│
├── filters/                              # Filter controls sub-feature (3 files)
│   ├── tier-trends-filters.tsx           # Filter UI component
│   ├── tier-trends-controls.tsx          # Additional controls
│   └── tier-trends-controls.test.tsx
│
├── table/                                # Results table sub-feature (5 files)
│   ├── tier-trends-table.tsx             # Main table component
│   ├── virtualized-trends-table.tsx      # Virtualization logic
│   ├── column-header-renderer.ts         # Column rendering logic
│   ├── column-header-renderer.test.ts
│   └── tier-trends-summary.tsx           # Summary row
│
├── mobile/                               # Mobile view sub-feature (4 files)
│   ├── tier-trends-mobile-card.tsx
│   ├── use-tier-trends-mobile.ts
│   ├── use-tier-trends-mobile.test.tsx
│   └── tier-trends-mobile-utils.ts       # Renamed from tier-trends-mobile.ts for clarity
│
├── empty-states/                         # Empty state handling (1 file)
│   └── tier-trends-empty-state.tsx
│
└── logic/                                # Pure business logic (6 files)
    ├── tier-trends-display.ts
    ├── tier-trends-display.test.ts
    ├── tier-trends-ui-options.ts
    ├── tier-trends-ui-options.test.ts
    ├── tier-trends-calculations.ts       # Renamed from tier-trends.ts for clarity
    └── tier-trends-calculations.test.ts
```

## Benefits

- **22 files → 6 conceptual groups**: filters, table, mobile, empty-states, logic, plus root
- **Developer experience dramatically improved**: "Modify filter behavior" → all files in `filters/` subdirectory
- **Clear separation of concerns**: mobile vs. desktop, UI vs. logic, table vs. filters
- **Easy to extend**: Adding new filter type or mobile feature has obvious location
- **Self-documenting structure**: Directory names reveal feature architecture

## Implementation Tasks

### 1. Create Directory Structure

```bash
mkdir -p src/features/analysis/tier-trends/filters
mkdir -p src/features/analysis/tier-trends/table
mkdir -p src/features/analysis/tier-trends/mobile
mkdir -p src/features/analysis/tier-trends/empty-states
mkdir -p src/features/analysis/tier-trends/logic
```

### 2. Move Files - Main Component (2 files)

Move from `src/features/data-tracking/components/`:
- `tier-trends-analysis.tsx` → root of `tier-trends/`
- `tier-trends-analysis.test.tsx` → root of `tier-trends/`

Move from `src/features/data-tracking/hooks/`:
- `use-tier-trends-view-state.ts` → root of `tier-trends/`
- `use-tier-trends-view-state.test.tsx` → root of `tier-trends/`

### 3. Move Files - Filters Sub-feature (3 files)

Move from `src/features/data-tracking/components/`:
- `tier-trends-filters.tsx` → `filters/tier-trends-filters.tsx`
- `tier-trends-controls.tsx` → `filters/tier-trends-controls.tsx`
- `tier-trends-controls.test.tsx` → `filters/tier-trends-controls.test.tsx`

### 4. Move Files - Table Sub-feature (5 files)

Move from `src/features/data-tracking/components/`:
- `tier-trends-table.tsx` → `table/tier-trends-table.tsx`
- `tier-trends-summary.tsx` → `table/tier-trends-summary.tsx`

Move from `src/features/data-tracking/components/tier-trends-table/`:
- `virtualized-trends-table.tsx` → `table/virtualized-trends-table.tsx`
- `column-header-renderer.ts` → `table/column-header-renderer.ts`
- `column-header-renderer.test.ts` → `table/column-header-renderer.test.ts`

### 5. Move Files - Mobile Sub-feature (4 files)

Move from `src/features/data-tracking/components/`:
- `tier-trends-mobile-card.tsx` → `mobile/tier-trends-mobile-card.tsx`

Move from `src/features/data-tracking/hooks/`:
- `use-tier-trends-mobile.ts` → `mobile/use-tier-trends-mobile.ts`
- `use-tier-trends-mobile.test.tsx` → `mobile/use-tier-trends-mobile.test.tsx`

Move from `src/features/data-tracking/utils/`:
- `tier-trends-mobile.ts` → `mobile/tier-trends-mobile-utils.ts` (**NOTE: Rename for clarity**)

### 6. Move Files - Empty States (1 file)

Move from `src/features/data-tracking/components/`:
- `tier-trends-empty-state.tsx` → `empty-states/tier-trends-empty-state.tsx`

### 7. Move Files - Logic (6 files)

Move from `src/features/data-tracking/logic/`:
- `tier-trends-display.ts` → `logic/tier-trends-display.ts`
- `tier-trends-display.test.ts` → `logic/tier-trends-display.test.ts`
- `tier-trends-ui-options.ts` → `logic/tier-trends-ui-options.ts`
- `tier-trends-ui-options.test.ts` → `logic/tier-trends-ui-options.test.ts`

Move from `src/features/data-tracking/utils/`:
- `tier-trends.ts` → `logic/tier-trends-calculations.ts` (**NOTE: Rename for clarity**)
- `tier-trends.test.ts` → `logic/tier-trends-calculations.test.ts`

### 8. Update Import Statements

Extensive import updates required. Strategy:

1. **External imports first**: Files outside tier-trends importing tier-trends components
2. **Internal imports second**: Files within tier-trends importing each other

**From**:
```typescript
import { TierTrendsAnalysis } from '@/features/data-tracking/components/tier-trends-analysis'
import { useTierTrendsViewState } from '@/features/data-tracking/hooks/use-tier-trends-view-state'
import { TierTrendsFilters } from '@/features/data-tracking/components/tier-trends-filters'
import { tierTrendsDisplay } from '@/features/data-tracking/logic/tier-trends-display'
```

**To**:
```typescript
import { TierTrendsAnalysis } from '@/features/analysis/tier-trends/tier-trends-analysis'
import { useTierTrendsViewState } from '@/features/analysis/tier-trends/use-tier-trends-view-state'
import { TierTrendsFilters } from '@/features/analysis/tier-trends/filters/tier-trends-filters'
import { tierTrendsDisplay } from '@/features/analysis/tier-trends/logic/tier-trends-display'
```

**Special attention**:
- Update imports for renamed files: `tier-trends-mobile.ts` → `tier-trends-mobile-utils.ts`
- Update imports for renamed files: `tier-trends.ts` → `tier-trends-calculations.ts`

**Tools**:
- Use `Grep` to find all `tier-trends` imports
- Group by file for systematic updates
- Run tests after each batch

### 9. Update Barrel Exports (if applicable)

```typescript
// src/features/analysis/tier-trends/index.ts
export * from './tier-trends-analysis'
export * from './use-tier-trends-view-state'

// Optional: Export key sub-components if needed
export * from './filters/tier-trends-filters'
export * from './table/tier-trends-table'
export * from './mobile/tier-trends-mobile-card'
```

### 10. Verification

- [ ] Run `npm run build` to ensure no import errors
- [ ] Run `npm run test` to verify all tests pass (especially tier-trends tests)
- [ ] Run `npm run type-check` to verify TypeScript compilation
- [ ] Manually test tier trends page in application
- [ ] Test filter functionality (all filter controls)
- [ ] Test table display and sorting
- [ ] Test mobile card view
- [ ] Test empty state handling

## Migration Rules

**CRITICAL**:
- **NO logic changes** - only file movement and import updates
- **EXCEPTION**: Two files renamed for clarity (`tier-trends-mobile.ts` → `tier-trends-mobile-utils.ts`, `tier-trends.ts` → `tier-trends-calculations.ts`)
- **NO other refactoring** - resist the urge to "improve" code while moving
- **Tests stay with implementation** - test files move alongside source files
- **One PR** - all changes in a single atomic commit for easy revert if needed

## File Renaming Rationale

Two files are renamed during migration for improved clarity:

1. **`tier-trends-mobile.ts` → `tier-trends-mobile-utils.ts`**:
   - Avoids confusion with `use-tier-trends-mobile.ts` hook
   - Clearly indicates this is utility functions, not the hook

2. **`tier-trends.ts` → `tier-trends-calculations.ts`**:
   - Generic name `tier-trends.ts` is vague (everything is tier-trends related)
   - New name reveals purpose: calculation/transformation logic

These renames improve code discoverability and match naming conventions used elsewhere.

## Notes

- This is the **canonical example** of why type-based organization fails
- Developer journey "Before": 4 directories, 22 files, unclear relationships
- Developer journey "After": 1 feature directory, 6 clear sub-features, obvious grouping
- Empty-states subdirectory has only 1 file currently, but structure allows future expansion (loading states, error states, etc.)
- Logic subdirectory contains pure functions - candidates for testing with high coverage

## Success Criteria

- [ ] All 22 tier-trends files moved to new subdirectories
- [ ] Two files renamed as documented
- [ ] Zero import errors after migration
- [ ] All tests passing (unit tests and integration tests)
- [ ] Application builds successfully
- [ ] Tier Trends analysis page works identically to before
- [ ] All filter, table, mobile, and empty state functionality working
- [ ] No logic or behavior changes introduced
- [ ] Developer can find all tier-trends code in one feature directory
