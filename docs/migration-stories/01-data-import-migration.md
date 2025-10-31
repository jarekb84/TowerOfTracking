# Migration Story 01: Data Import Feature Reorganization

## Parent PRD
See [PRD Enhanced File Structure Organization Through AI Instructions](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md) for complete context and organizational principles.

## Story Overview

**Feature**: Data Import
**Goal**: Reorganize all data import-related files from scattered type-based directories into a cohesive feature-based structure.
**Scope**: File movement and import statement updates ONLY - no logic changes or refactoring.

## Current State

Files are scattered across 3 type-based directories:

```
src/features/data-tracking/
├── components/
│   ├── data-input.tsx
│   ├── data-input-actions-section.tsx
│   ├── data-input-datetime-section.tsx
│   ├── data-input-error-boundary.tsx
│   ├── data-input-error-boundary.test.tsx
│   ├── data-input-preview.tsx
│   ├── data-input-preview.test.tsx
│   ├── global-data-input-provider.tsx
│   └── csv-import.tsx
│
├── hooks/
│   ├── use-data-input-form.ts
│   ├── use-file-import.ts
│   └── use-global-data-input.ts
│
└── utils/
    ├── data-input-state.ts
    └── data-input-state.test.ts
```

**Total**: ~14 files across 3 directories

## Target State

```
src/features/data-import/
├── data-import.tsx                       # Main entry point (if needed as wrapper)
├── global-data-input-provider.tsx        # Global state provider
│
├── manual-entry/                         # Manual data input sub-feature
│   ├── data-input.tsx                    # Main form component
│   ├── data-input-preview.tsx            # Preview section
│   ├── data-input-preview.test.tsx
│   ├── data-input-actions-section.tsx    # Action buttons
│   ├── data-input-datetime-section.tsx   # Date/time controls
│   ├── data-input-error-boundary.tsx
│   ├── data-input-error-boundary.test.tsx
│   ├── use-data-input-form.ts            # Form state hook
│   ├── use-global-data-input.ts
│   ├── data-input-state.ts               # State logic
│   └── data-input-state.test.ts
│
└── csv-import/                           # CSV import sub-feature
    ├── csv-import.tsx                    # CSV import UI
    └── use-file-import.ts                # File handling hook
```

## Benefits

- **Clear separation**: Manual entry vs. CSV import are distinct sub-features
- **All import code in one place**: No more hunting across multiple directories
- **Easy to extend**: Adding new import methods (e.g., API import, bulk import) has a clear location
- **Related files colocated**: Component + hook + logic together for each import method

## Implementation Tasks

### 1. Create Directory Structure

```bash
mkdir -p src/features/data-import/manual-entry
mkdir -p src/features/data-import/csv-import
```

### 2. Move Files - Manual Entry Sub-feature

Move from `src/features/data-tracking/components/`:
- `data-input.tsx` → `manual-entry/data-input.tsx`
- `data-input-actions-section.tsx` → `manual-entry/data-input-actions-section.tsx`
- `data-input-datetime-section.tsx` → `manual-entry/data-input-datetime-section.tsx`
- `data-input-error-boundary.tsx` → `manual-entry/data-input-error-boundary.tsx`
- `data-input-error-boundary.test.tsx` → `manual-entry/data-input-error-boundary.test.tsx`
- `data-input-preview.tsx` → `manual-entry/data-input-preview.tsx`
- `data-input-preview.test.tsx` → `manual-entry/data-input-preview.test.tsx`
- `global-data-input-provider.tsx` → root of `data-import/` (shared across sub-features)

Move from `src/features/data-tracking/hooks/`:
- `use-data-input-form.ts` → `manual-entry/use-data-input-form.ts`
- `use-global-data-input.ts` → `manual-entry/use-global-data-input.ts`

Move from `src/features/data-tracking/utils/`:
- `data-input-state.ts` → `manual-entry/data-input-state.ts`
- `data-input-state.test.ts` → `manual-entry/data-input-state.test.ts`

### 3. Move Files - CSV Import Sub-feature

Move from `src/features/data-tracking/components/`:
- `csv-import.tsx` → `csv-import/csv-import.tsx`

Move from `src/features/data-tracking/hooks/`:
- `use-file-import.ts` → `csv-import/use-file-import.ts`

### 4. Update Import Statements

Search for and update all import statements referencing the moved files:

**From**:
```typescript
import { DataInput } from '@/features/data-tracking/components/data-input'
import { useDataInputForm } from '@/features/data-tracking/hooks/use-data-input-form'
```

**To**:
```typescript
import { DataInput } from '@/features/data-import/manual-entry/data-input'
import { useDataInputForm } from '@/features/data-import/manual-entry/use-data-input-form'
```

**Tools**:
- Use `Grep` to find all import statements
- Use `Edit` to update each file systematically
- Run tests after each batch of updates to verify nothing broke

### 5. Update Barrel Exports (if applicable)

If `index.ts` files exist, update them to reflect new structure:

```typescript
// src/features/data-import/index.ts
export * from './manual-entry/data-input'
export * from './csv-import/csv-import'
export * from './global-data-input-provider'
```

### 6. Verification

- [ ] Run `npm run build` to ensure no import errors
- [ ] Run `npm run test` to verify all tests pass
- [ ] Run `npm run type-check` to verify TypeScript compilation
- [ ] Manually test data input flow in the application

## Migration Rules

**CRITICAL**:
- **NO logic changes** - only file movement and import updates
- **NO refactoring** - resist the urge to "improve" code while moving
- **NO renaming** - keep all file names exactly as they are
- **Tests stay with implementation** - test files move alongside source files
- **One PR** - all changes in a single atomic commit for easy revert if needed

## Notes

- This is the smallest migration story - good starting point to establish pattern
- CSV import sub-feature is minimal (2 files) - may grow in future
- Manual entry sub-feature contains majority of files (~12 files)
- Global provider stays at root of `data-import/` since it's shared across sub-features

## Success Criteria

- [ ] All data-input and csv-import files moved to new locations
- [ ] Zero import errors after migration
- [ ] All tests passing
- [ ] Application builds successfully
- [ ] Data input functionality works identically to before
- [ ] No logic or behavior changes introduced
