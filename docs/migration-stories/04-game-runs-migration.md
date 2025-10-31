# Migration Story 04: Game Runs Feature Reorganization

## Parent PRD
See [PRD Enhanced File Structure Organization Through AI Instructions](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md) for complete context and organizational principles.

## Story Overview

**Feature**: Game Runs
**Goal**: Reorganize the game runs table feature from a partially-grouped but flat structure into a hierarchical, sub-feature based organization.
**Scope**: File movement and import statement updates ONLY - no logic changes or refactoring.

## Current State

Files are partially grouped in `components/runs-table/` subdirectory, but still flat (28 files in one directory):

```
src/features/data-tracking/components/runs-table/
├── base-runs-table.tsx
├── expandable-table-row.tsx
├── farming-runs-table.tsx
├── farming-table-columns.tsx
├── field-display-config.ts
├── field-rendering-utils.ts
├── index.tsx
├── milestone-runs-table.tsx
├── milestone-table-columns.tsx
├── responsive-table-behavior.integration.test.tsx
├── run-card.tsx
├── run-card-utils.ts
├── run-details.tsx
├── scrollable-table-container.tsx
├── tabbed-runs-table.tsx
├── table-action-buttons.tsx
├── table-columns.tsx
├── table-empty-state.tsx
├── table-head.tsx
├── table-header.tsx
├── tier-filter.tsx
├── tier-filter-logic.ts
├── tier-filter-logic.test.ts
├── tournament-runs-table.tsx
├── tournament-table-columns.tsx
├── use-tier-filter.ts
├── use-tier-filter.test.ts
├── virtualized-table-body.tsx
└── __tests__/
    ├── field-display-config.test.ts
    ├── field-rendering-utils.test.ts
    └── run-card-utils.test.ts
```

**Issue**: Better than scattered across type-based directories, but still flat with 28 files lacking conceptual sub-grouping.

## Target State

```
src/features/game-runs/
├── runs-table.tsx                        # Main export/wrapper (from index.tsx)
│
├── table/                                # Core table implementation (6 files)
│   ├── base-runs-table.tsx               # Base table component
│   ├── tabbed-runs-table.tsx             # Tab wrapper (Farm/Tournament/Milestone)
│   ├── virtualized-table-body.tsx        # Virtualization logic
│   ├── scrollable-table-container.tsx    # Scroll container
│   ├── expandable-table-row.tsx          # Expandable row logic
│   └── responsive-table-behavior.integration.test.tsx
│
├── table-variants/                       # Different table types (6 files)
│   ├── farming-runs-table.tsx
│   ├── farming-table-columns.tsx
│   ├── tournament-runs-table.tsx
│   ├── tournament-table-columns.tsx
│   ├── milestone-runs-table.tsx
│   └── milestone-table-columns.tsx
│
├── table-ui/                             # Table UI components (5 files)
│   ├── table-header.tsx
│   ├── table-head.tsx
│   ├── table-action-buttons.tsx
│   ├── table-empty-state.tsx
│   └── table-columns.tsx                 # Column definitions
│
├── filters/                              # Filtering sub-feature (5 files)
│   ├── tier-filter.tsx
│   ├── use-tier-filter.ts
│   ├── use-tier-filter.test.ts
│   ├── tier-filter-logic.ts
│   └── tier-filter-logic.test.ts
│
├── fields/                               # Field configuration & rendering (4 files)
│   ├── field-display-config.ts
│   ├── field-display-config.test.ts
│   ├── field-rendering-utils.ts
│   └── field-rendering-utils.test.ts
│
└── card-view/                            # Mobile card view (4 files)
    ├── run-card.tsx
    ├── run-card-utils.ts
    ├── run-card-utils.test.ts
    └── run-details.tsx
```

## Benefits

- **28 files → 6 conceptual groups**: Clear separation by purpose
- **Each subdirectory < 10 files**: Adheres to 10-file threshold principle
- **Easy navigation**: "I need to modify filters" → `filters/` subdirectory
- **Clear responsibilities**: table core, variants, UI, filters, fields, mobile view
- **Extensibility**: Adding new table variant or filter type has obvious location

## Implementation Tasks

### 1. Create Directory Structure

```bash
mkdir -p src/features/game-runs/table
mkdir -p src/features/game-runs/table-variants
mkdir -p src/features/game-runs/table-ui
mkdir -p src/features/game-runs/filters
mkdir -p src/features/game-runs/fields
mkdir -p src/features/game-runs/card-view
```

### 2. Move Files - Core Table (6 files)

Move from `src/features/data-tracking/components/runs-table/`:
- `base-runs-table.tsx` → `table/base-runs-table.tsx`
- `tabbed-runs-table.tsx` → `table/tabbed-runs-table.tsx`
- `virtualized-table-body.tsx` → `table/virtualized-table-body.tsx`
- `scrollable-table-container.tsx` → `table/scrollable-table-container.tsx`
- `expandable-table-row.tsx` → `table/expandable-table-row.tsx`
- `responsive-table-behavior.integration.test.tsx` → `table/responsive-table-behavior.integration.test.tsx`

### 3. Move Files - Table Variants (6 files)

Move from `src/features/data-tracking/components/runs-table/`:
- `farming-runs-table.tsx` → `table-variants/farming-runs-table.tsx`
- `farming-table-columns.tsx` → `table-variants/farming-table-columns.tsx`
- `tournament-runs-table.tsx` → `table-variants/tournament-runs-table.tsx`
- `tournament-table-columns.tsx` → `table-variants/tournament-table-columns.tsx`
- `milestone-runs-table.tsx` → `table-variants/milestone-runs-table.tsx`
- `milestone-table-columns.tsx` → `table-variants/milestone-table-columns.tsx`

### 4. Move Files - Table UI Components (5 files)

Move from `src/features/data-tracking/components/runs-table/`:
- `table-header.tsx` → `table-ui/table-header.tsx`
- `table-head.tsx` → `table-ui/table-head.tsx`
- `table-action-buttons.tsx` → `table-ui/table-action-buttons.tsx`
- `table-empty-state.tsx` → `table-ui/table-empty-state.tsx`
- `table-columns.tsx` → `table-ui/table-columns.tsx`

### 5. Move Files - Filters (5 files)

Move from `src/features/data-tracking/components/runs-table/`:
- `tier-filter.tsx` → `filters/tier-filter.tsx`
- `use-tier-filter.ts` → `filters/use-tier-filter.ts`
- `use-tier-filter.test.ts` → `filters/use-tier-filter.test.ts`
- `tier-filter-logic.ts` → `filters/tier-filter-logic.ts`
- `tier-filter-logic.test.ts` → `filters/tier-filter-logic.test.ts`

### 6. Move Files - Field Configuration (4 files)

Move from `src/features/data-tracking/components/runs-table/`:
- `field-display-config.ts` → `fields/field-display-config.ts`
- `field-rendering-utils.ts` → `fields/field-rendering-utils.ts`

Move from `src/features/data-tracking/components/runs-table/__tests__/`:
- `field-display-config.test.ts` → `fields/field-display-config.test.ts`
- `field-rendering-utils.test.ts` → `fields/field-rendering-utils.test.ts`

### 7. Move Files - Card View (4 files)

Move from `src/features/data-tracking/components/runs-table/`:
- `run-card.tsx` → `card-view/run-card.tsx`
- `run-card-utils.ts` → `card-view/run-card-utils.ts`
- `run-details.tsx` → `card-view/run-details.tsx`

Move from `src/features/data-tracking/components/runs-table/__tests__/`:
- `run-card-utils.test.ts` → `card-view/run-card-utils.test.ts`

### 8. Move Main Entry Point

- `index.tsx` → `runs-table.tsx` at root of `game-runs/`

### 9. Update Import Statements

This will be extensive due to 28 files with many internal cross-references. Strategy:

1. **First pass**: Update external imports (files outside game-runs importing these files)
2. **Second pass**: Update internal imports (files within game-runs importing each other)

**From**:
```typescript
import { RunsTable } from '@/features/data-tracking/components/runs-table'
import { TierFilter } from '@/features/data-tracking/components/runs-table/tier-filter'
import { RunCard } from '@/features/data-tracking/components/runs-table/run-card'
```

**To**:
```typescript
import { RunsTable } from '@/features/game-runs/runs-table'
import { TierFilter } from '@/features/game-runs/filters/tier-filter'
import { RunCard } from '@/features/game-runs/card-view/run-card'
```

**Tools**:
- Use `Grep` with `-r` to find all imports from `runs-table/`
- Work systematically through external imports first
- Then update internal imports (within moved files)
- Run tests frequently to catch breakages early

### 10. Update Barrel Exports (if applicable)

```typescript
// src/features/game-runs/index.ts
export * from './runs-table'

// Optional: Export key sub-components if needed externally
export * from './filters/tier-filter'
export * from './card-view/run-card'
```

### 11. Verification

- [ ] Run `npm run build` to ensure no import errors
- [ ] Run `npm run test` to verify all tests pass
- [ ] Run `npm run type-check` to verify TypeScript compilation
- [ ] Manually test runs table in all modes (farming, tournament, milestone)
- [ ] Test tier filtering functionality
- [ ] Test expandable rows
- [ ] Test mobile card view
- [ ] Test responsive behavior

## Migration Rules

**CRITICAL**:
- **NO logic changes** - only file movement and import updates
- **NO refactoring** - resist the urge to "improve" code while moving
- **NO renaming** - keep all file names exactly as they are
- **Tests move to same directory as source** - not in `__tests__/` subdirectory
- **One PR** - all changes in a single atomic commit for easy revert if needed

## Complexity Warning

This is the largest migration so far (28 files) with:
- Heavy internal cross-referencing (table components importing each other)
- External dependencies (pages importing runs table)
- Multiple test files to move and update

**Recommendation**:
- Take extra time on this migration
- Update imports in small batches
- Run tests after each batch
- Consider doing this in sub-steps if needed (though single PR is preferred)

## Notes

- This migration transforms the flattest structure (28 files, one directory) into a hierarchical organization
- Some files may have ambiguous categorization (e.g., is `table-columns.tsx` core table or UI?)
  - Current categorization puts `table-columns.tsx` in `table-ui/` since it's about column rendering, not table behavior
  - If unclear during migration, prioritize getting files moved and grouped, perfect categorization can be refined later
- Watch for field configuration imports - settings feature may depend on these files

## Success Criteria

- [ ] All 28 runs-table files moved to new subdirectories
- [ ] Zero import errors after migration
- [ ] All tests passing (especially integration tests)
- [ ] Application builds successfully
- [ ] Runs table functionality works identically in all variants
- [ ] Filtering, expandable rows, card view all working
- [ ] No logic or behavior changes introduced
