# Migration Story 02: Data Export Feature Reorganization

## Parent PRD
See [PRD Enhanced File Structure Organization Through AI Instructions](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md) for complete context and organizational principles.

## Story Overview

**Feature**: Data Export
**Goal**: Reorganize all data export-related files from scattered type-based directories into a cohesive feature-based structure.
**Scope**: File movement and import statement updates ONLY - no logic changes or refactoring.

## Current State

Files are scattered across 3 type-based directories:

```
src/features/data-tracking/
├── components/
│   ├── csv-export.tsx
│   └── csv-export-dialog-sections.tsx
│
├── hooks/
│   ├── use-csv-export.ts
│   └── use-csv-export.test.ts
│
└── utils/
    ├── csv-exporter.ts
    ├── csv-export-helpers.ts
    ├── csv-export-helpers.test.ts
    └── csv-parser-bulk-export.test.ts
```

**Total**: ~8 files across 3 directories

## Target State

```
src/features/data-export/
└── csv-export/                           # CSV export feature
    ├── csv-export.tsx                    # Main export dialog
    ├── csv-export-dialog-sections.tsx    # Dialog sections
    ├── use-csv-export.ts                 # Export hook
    ├── use-csv-export.test.ts
    ├── csv-exporter.ts                   # Export logic
    ├── csv-export-helpers.ts             # Helper functions
    ├── csv-export-helpers.test.ts
    └── csv-parser-bulk-export.test.ts    # Parsing tests
```

## Benefits

- **Clear feature boundary**: Export separated from import (different user concerns)
- **Easy to extend**: Adding new export formats (JSON, Excel, PDF) has obvious location pattern
- **All export logic together**: No hunting across components/, hooks/, utils/
- **Related files colocated**: Dialog + hook + helpers + tests all in one place

## Implementation Tasks

### 1. Create Directory Structure

```bash
mkdir -p src/features/data-export/csv-export
```

### 2. Move Files - CSV Export Sub-feature

Move from `src/features/data-tracking/components/`:
- `csv-export.tsx` → `csv-export/csv-export.tsx`
- `csv-export-dialog-sections.tsx` → `csv-export/csv-export-dialog-sections.tsx`

Move from `src/features/data-tracking/hooks/`:
- `use-csv-export.ts` → `csv-export/use-csv-export.ts`
- `use-csv-export.test.ts` → `csv-export/use-csv-export.test.ts`

Move from `src/features/data-tracking/utils/`:
- `csv-exporter.ts` → `csv-export/csv-exporter.ts`
- `csv-export-helpers.ts` → `csv-export/csv-export-helpers.ts`
- `csv-export-helpers.test.ts` → `csv-export/csv-export-helpers.test.ts`
- `csv-parser-bulk-export.test.ts` → `csv-export/csv-parser-bulk-export.test.ts`

### 3. Update Import Statements

Search for and update all import statements referencing the moved files:

**From**:
```typescript
import { CsvExport } from '@/features/data-tracking/components/csv-export'
import { useCsvExport } from '@/features/data-tracking/hooks/use-csv-export'
import { csvExporter } from '@/features/data-tracking/utils/csv-exporter'
```

**To**:
```typescript
import { CsvExport } from '@/features/data-export/csv-export/csv-export'
import { useCsvExport } from '@/features/data-export/csv-export/use-csv-export'
import { csvExporter } from '@/features/data-export/csv-export/csv-exporter'
```

**Tools**:
- Use `Grep` to find all import statements with `csv-export`, `use-csv-export`, `csv-exporter`
- Use `Edit` to update each file systematically
- Run tests after updates to verify nothing broke

### 4. Update Barrel Exports (if applicable)

If `index.ts` files exist, update them:

```typescript
// src/features/data-export/index.ts
export * from './csv-export/csv-export'
export * from './csv-export/use-csv-export'
export * from './csv-export/csv-exporter'
export * from './csv-export/csv-export-helpers'
```

### 5. Verification

- [ ] Run `npm run build` to ensure no import errors
- [ ] Run `npm run test` to verify all tests pass
- [ ] Run `npm run type-check` to verify TypeScript compilation
- [ ] Manually test CSV export flow in the application

## Migration Rules

**CRITICAL**:
- **NO logic changes** - only file movement and import updates
- **NO refactoring** - resist the urge to "improve" code while moving
- **NO renaming** - keep all file names exactly as they are
- **Tests stay with implementation** - test files move alongside source files
- **One PR** - all changes in a single atomic commit for easy revert if needed

## Future Extensibility

This structure sets up natural patterns for future export formats:

```
src/features/data-export/
├── csv-export/        # Current implementation
├── json-export/       # Future: JSON export capability
├── excel-export/      # Future: Excel/XLSX export
├── pdf-export/        # Future: PDF report generation
└── shared/            # Future: Common export utilities (when 2+ formats exist)
```

## Notes

- Small migration (8 files) - should be straightforward
- Export separated from import emphasizes different user concerns
- CSV export is the only export format currently, but structure allows easy extension
- All files currently fit in single `csv-export/` subdirectory (under 10 files)

## Success Criteria

- [ ] All csv-export files moved to new locations
- [ ] Zero import errors after migration
- [ ] All tests passing
- [ ] Application builds successfully
- [ ] CSV export functionality works identically to before
- [ ] No logic or behavior changes introduced
