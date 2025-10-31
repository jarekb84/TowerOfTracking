# Migration Story 03: Settings Feature Reorganization

## Parent PRD
See [PRD Enhanced File Structure Organization Through AI Instructions](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md) for complete context and organizational principles.

## Story Overview

**Feature**: Settings
**Goal**: Reorganize all settings-related files from scattered type-based directories into a cohesive feature-based structure.
**Scope**: File movement and import statement updates ONLY - no logic changes or refactoring.

## Current State

Files are scattered across 2-3 type-based directories:

```
src/features/data-tracking/
├── components/
│   ├── data-settings.tsx
│   ├── data-settings.test.tsx
│   ├── migration-alert.tsx
│   ├── searchable-column-picker.tsx
│   └── selected-column-item.tsx
│
└── hooks/
    ├── use-data-settings.ts
    ├── use-data-settings.test.tsx
    ├── use-column-search.tsx
    ├── use-column-search.test.tsx
    ├── use-column-reorder.tsx
    ├── use-column-reorder.test.tsx
    └── use-field-filter.ts
```

**Total**: ~13 files across 2 directories

## Target State

```
src/features/settings/
├── data-settings/                        # Data management settings
│   ├── data-settings.tsx
│   ├── data-settings.test.tsx
│   ├── use-data-settings.ts
│   ├── use-data-settings.test.tsx
│   └── migration-alert.tsx
│
└── column-config/                        # Column configuration
    ├── searchable-column-picker.tsx
    ├── selected-column-item.tsx
    ├── use-column-search.tsx
    ├── use-column-search.test.tsx
    ├── use-column-reorder.tsx
    ├── use-column-reorder.test.tsx
    └── use-field-filter.ts
```

## Benefits

- **Clear settings organization**: Data settings vs. column configuration as distinct concerns
- **Easy to extend**: Adding new setting types (theme settings, notification settings) has clear pattern
- **Related files colocated**: Settings component + its hooks together
- **Separate from feature logic**: Settings aren't mixed with game runs, analytics, etc.

## Implementation Tasks

### 1. Create Directory Structure

```bash
mkdir -p src/features/settings/data-settings
mkdir -p src/features/settings/column-config
```

### 2. Move Files - Data Settings Sub-feature

Move from `src/features/data-tracking/components/`:
- `data-settings.tsx` → `data-settings/data-settings.tsx`
- `data-settings.test.tsx` → `data-settings/data-settings.test.tsx`
- `migration-alert.tsx` → `data-settings/migration-alert.tsx`

Move from `src/features/data-tracking/hooks/`:
- `use-data-settings.ts` → `data-settings/use-data-settings.ts`
- `use-data-settings.test.tsx` → `data-settings/use-data-settings.test.tsx`

### 3. Move Files - Column Configuration Sub-feature

Move from `src/features/data-tracking/components/`:
- `searchable-column-picker.tsx` → `column-config/searchable-column-picker.tsx`
- `selected-column-item.tsx` → `column-config/selected-column-item.tsx`

Move from `src/features/data-tracking/hooks/`:
- `use-column-search.tsx` → `column-config/use-column-search.tsx`
- `use-column-search.test.tsx` → `column-config/use-column-search.test.tsx`
- `use-column-reorder.tsx` → `column-config/use-column-reorder.tsx`
- `use-column-reorder.test.tsx` → `column-config/use-column-reorder.test.tsx`
- `use-field-filter.ts` → `column-config/use-field-filter.ts`

### 4. Update Import Statements

Search for and update all import statements referencing the moved files:

**From**:
```typescript
import { DataSettings } from '@/features/data-tracking/components/data-settings'
import { useDataSettings } from '@/features/data-tracking/hooks/use-data-settings'
import { SearchableColumnPicker } from '@/features/data-tracking/components/searchable-column-picker'
import { useColumnSearch } from '@/features/data-tracking/hooks/use-column-search'
```

**To**:
```typescript
import { DataSettings } from '@/features/settings/data-settings/data-settings'
import { useDataSettings } from '@/features/settings/data-settings/use-data-settings'
import { SearchableColumnPicker } from '@/features/settings/column-config/searchable-column-picker'
import { useColumnSearch } from '@/features/settings/column-config/use-column-search'
```

**Tools**:
- Use `Grep` to find all import statements with settings-related keywords
- Use `Edit` to update each file systematically
- Run tests after updates to verify nothing broke

### 5. Update Barrel Exports (if applicable)

If `index.ts` files exist, update them:

```typescript
// src/features/settings/index.ts
export * from './data-settings/data-settings'
export * from './data-settings/use-data-settings'
export * from './column-config/searchable-column-picker'
export * from './column-config/use-column-search'
export * from './column-config/use-column-reorder'
```

### 6. Verification

- [ ] Run `npm run build` to ensure no import errors
- [ ] Run `npm run test` to verify all tests pass
- [ ] Run `npm run type-check` to verify TypeScript compilation
- [ ] Manually test settings UI and column configuration in the application

## Migration Rules

**CRITICAL**:
- **NO logic changes** - only file movement and import updates
- **NO refactoring** - resist the urge to "improve" code while moving
- **NO renaming** - keep all file names exactly as they are
- **Tests stay with implementation** - test files move alongside source files
- **One PR** - all changes in a single atomic commit for easy revert if needed

## Future Extensibility

This structure enables future settings categories:

```
src/features/settings/
├── data-settings/      # Current: Data management
├── column-config/      # Current: Column configuration
├── theme-settings/     # Future: Theme preferences (beyond current theme context)
├── export-settings/    # Future: Default export configurations
└── shared/             # Future: Common settings utilities (when 2+ categories share logic)
```

## Notes

- Medium-sized migration (13 files) across 2 sub-features
- Settings might be used by data-import, data-export, game-runs, and analysis features
- Column configuration might be tightly coupled to game-runs table - watch for import patterns
- After this migration, verify where settings are consumed most heavily

## Potential Cross-Feature Dependencies

**WARNING**: Settings (especially column-config) may be heavily used by:
- Game runs table (column visibility, ordering)
- Analysis features (tier-trends, tier-stats tables)
- Data export (which columns to export)

After migration, review import patterns to ensure no circular dependencies or architectural issues.

## Success Criteria

- [ ] All settings files moved to new locations
- [ ] Zero import errors after migration
- [ ] All tests passing
- [ ] Application builds successfully
- [ ] Settings UI and column configuration work identically to before
- [ ] No logic or behavior changes introduced
- [ ] Document any cross-feature dependencies discovered during migration
