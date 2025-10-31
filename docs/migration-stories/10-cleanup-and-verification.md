# Migration Story 10: Cleanup and Final Verification

## Parent PRD
See [PRD Enhanced File Structure Organization Through AI Instructions](../PRD%20Enhanced%20File%20Structure%20Organization%20Through%20AI%20Instructions.md) for complete context and organizational principles.

## Story Overview

**Goal**: Clean up old `data-tracking/` directory structure, verify all migrations, and establish new shared structure.
**Scope**: Remove old directories, move remaining shared code, update any missed imports, final verification.

## Prerequisites

**CRITICAL**: This story should be executed **LAST**, after all other migrations are complete:
- ✅ Story 01: Data Import migration
- ✅ Story 02: Data Export migration
- ✅ Story 03: Settings migration
- ✅ Story 04: Game Runs migration
- ✅ Story 05: Tier Trends migration
- ✅ Story 06: Tier Stats migration
- ✅ Story 07: Deaths Radar migration
- ✅ Story 08: Time Series migration
- ✅ Story 09: Analysis Shared migration

## Current State (Expected)

After all previous migrations, `data-tracking/` should be mostly empty:

```
src/features/data-tracking/
├── components/     # Should be empty or near-empty
├── hooks/          # Should be empty or near-empty
├── logic/          # Should be empty or near-empty
├── utils/          # Should be empty or near-empty
├── types/          # Should be empty or near-empty
└── integration/    # May contain integration tests (evaluate)
```

## Investigation Tasks (FIRST)

### 1. Audit Remaining Files

Find any files still in old structure:

```bash
# List remaining files in each old directory
ls -la src/features/data-tracking/components/
ls -la src/features/data-tracking/hooks/
ls -la src/features/data-tracking/logic/
ls -la src/features/data-tracking/utils/
ls -la src/features/data-tracking/types/
ls -la src/features/data-tracking/integration/
```

### 2. Categorize Remaining Files

For each remaining file, determine:

**Category A: Truly Shared Components**
- Used by multiple features (data-import, data-export, game-runs, analysis, settings)
- Should move to `src/features/data-tracking/shared/` or `src/shared/`

**Examples**:
- `data-provider.tsx` - Global data context
- `run-type-selector.tsx` - Used across multiple features
- `run-type-indicator.tsx` - Used in multiple tables
- `farming-only-indicator.tsx` - Used in multiple places

**Category B: Missed During Previous Migrations**
- Should have been moved in earlier stories
- Move to appropriate feature directory now

**Category C: Orphaned/Dead Code**
- Not imported anywhere
- Consider for deletion (but verify first)

**Category D: Integration Tests**
- May be cross-feature integration tests
- Evaluate whether to keep, move, or refactor

### 3. Check for Import Errors

Verify no old imports remain:

```bash
# Search for any remaining imports from old structure
Grep -r "from '@/features/data-tracking/components" src/
Grep -r "from '@/features/data-tracking/hooks" src/
Grep -r "from '@/features/data-tracking/logic" src/
Grep -r "from '@/features/data-tracking/utils" src/
Grep -r "from '@/features/data-tracking/types" src/

# Check for relative imports too
Grep -r "from '../data-tracking/" src/
Grep -r "from '../../data-tracking/" src/
```

## Target State

```
src/features/
├── data-import/              # ✅ Migrated
├── data-export/              # ✅ Migrated
├── settings/                 # ✅ Migrated
├── game-runs/                # ✅ Migrated
├── analysis/                 # ✅ Migrated
│   ├── tier-trends/
│   ├── tier-stats/
│   ├── deaths-radar/
│   ├── time-series/
│   └── shared/
├── navigation/               # ✅ Already existed
├── theming/                  # ✅ Already existed
└── data-tracking/            # Final shared code location
    └── shared/               # Truly shared components/hooks/types
        ├── components/
        │   ├── data-provider.tsx
        │   ├── run-type-selector.tsx
        │   ├── run-type-indicator.tsx
        │   └── farming-only-indicator.tsx
        ├── hooks/
        │   ├── use-data.ts
        │   ├── use-run-type-context.ts
        │   ├── use-runs-navigation.ts
        │   └── (other truly shared hooks)
        └── types/
            ├── game-run.types.ts
            ├── run-filters.types.ts
            └── (other shared domain types)
```

**Alternative Target State** (if very little shared code):

```
src/features/
├── (all feature directories as above)
└── data-tracking/            # Empty - consider removing
    └── shared/               # Empty or minimal

# Truly shared code could move to:
src/shared/game-data/         # If shared across entire app
├── components/
├── hooks/
└── types/
```

## Implementation Tasks

### 1. Create Shared Directory Structure

```bash
mkdir -p src/features/data-tracking/shared/components
mkdir -p src/features/data-tracking/shared/hooks
mkdir -p src/features/data-tracking/shared/types
```

**OR** (if moving to top-level shared):

```bash
mkdir -p src/shared/game-data/components
mkdir -p src/shared/game-data/hooks
mkdir -p src/shared/game-data/types
```

### 2. Move Truly Shared Components

Based on investigation, move Category A files (truly shared):

**Example moves** (adjust based on actual findings):

```bash
# Truly shared components
mv src/features/data-tracking/components/data-provider.tsx \
   src/features/data-tracking/shared/components/

mv src/features/data-tracking/components/run-type-selector.tsx \
   src/features/data-tracking/shared/components/

# Truly shared hooks
mv src/features/data-tracking/hooks/use-data.ts \
   src/features/data-tracking/shared/hooks/

mv src/features/data-tracking/hooks/use-run-type-context.ts \
   src/features/data-tracking/shared/hooks/

# Truly shared types
mv src/features/data-tracking/types/game-run.types.ts \
   src/features/data-tracking/shared/types/
```

### 3. Handle Missed Files (Category B)

For files that should have been migrated earlier:

**Process**:
1. Identify which feature the file belongs to
2. Move to appropriate feature directory
3. Update imports
4. Document why it was missed

**Example**:
```bash
# If we find tier-trends-helper.ts still in utils/
mv src/features/data-tracking/utils/tier-trends-helper.ts \
   src/features/analysis/tier-trends/logic/tier-trends-helper.ts
```

### 4. Evaluate Orphaned Files (Category C)

For files not imported anywhere:

**Process**:
1. Search for imports: `Grep -r "filename" src/`
2. If truly unused, consider deletion
3. **DON'T DELETE HASTILY** - may be used in ways Grep doesn't catch (dynamic imports, etc.)
4. Document orphaned files for review

**Create orphaned file list**:
```markdown
## Orphaned Files (Not Imported Anywhere)

- `src/features/data-tracking/utils/old-helper.ts` - No imports found, candidate for deletion
- `src/features/data-tracking/components/deprecated-component.tsx` - No imports found, candidate for deletion

**Recommendation**: Review with product owner before deleting
```

### 5. Handle Integration Tests (Category D)

For files in `integration/`:

**Process**:
1. Identify what each test covers
2. Move to appropriate feature's test directory
3. Or keep as cross-feature integration tests in `src/tests/integration/`

### 6. Update All Import Statements

**From** (old shared component location):
```typescript
import { DataProvider } from '@/features/data-tracking/components/data-provider'
import { useData } from '@/features/data-tracking/hooks/use-data'
```

**To** (new shared location):
```typescript
import { DataProvider } from '@/features/data-tracking/shared/components/data-provider'
import { useData } from '@/features/data-tracking/shared/hooks/use-data'
```

**Tools**:
- Use `Grep` to find all imports of shared components
- Update systematically
- Run tests after each batch

### 7. Remove Empty Directories

Once all files are moved:

```bash
# Check if directories are empty
ls src/features/data-tracking/components/
ls src/features/data-tracking/hooks/
ls src/features/data-tracking/logic/
ls src/features/data-tracking/utils/
ls src/features/data-tracking/types/

# If empty, remove
rm -rf src/features/data-tracking/components
rm -rf src/features/data-tracking/hooks
rm -rf src/features/data-tracking/logic
rm -rf src/features/data-tracking/utils
rm -rf src/features/data-tracking/types
```

**CAUTION**: Only remove if **completely empty** and **all tests pass**.

### 8. Update Barrel Exports

```typescript
// src/features/data-tracking/shared/index.ts
export * from './components/data-provider'
export * from './components/run-type-selector'
export * from './hooks/use-data'
export * from './hooks/use-run-type-context'
export * from './types/game-run.types'
```

### 9. Final Verification - Full Application Test

- [ ] Run `npm run build` - verify clean build
- [ ] Run `npm run test` - verify all tests pass
- [ ] Run `npm run type-check` - verify no TypeScript errors
- [ ] Run `npm run lint` (if available) - verify no linting errors
- [ ] Manually test **ALL** major features:
  - [ ] Data import (manual and CSV)
  - [ ] Data export (CSV)
  - [ ] Settings (data settings, column config)
  - [ ] Game runs table (all variants)
  - [ ] Tier trends analysis page
  - [ ] Tier stats page
  - [ ] Deaths radar chart
  - [ ] Cell time series page
  - [ ] Coin time series page
- [ ] Test cross-feature interactions:
  - [ ] Import data → view in game runs table
  - [ ] Filter game runs → export filtered data
  - [ ] Configure columns → verify settings persist
  - [ ] Navigate between analysis pages

### 10. Documentation Updates

Update project documentation:

**Update CLAUDE.md or Architecture docs**:
- Document new feature structure
- Update import examples
- Add migration completion notes

**Create Migration Summary**:
```markdown
# File Organization Migration Summary

## Completed: [Date]

### New Structure
- `src/features/data-import/` - Data input functionality
- `src/features/data-export/` - Data export functionality
- `src/features/settings/` - Application settings
- `src/features/game-runs/` - Game runs table
- `src/features/analysis/` - All analysis features
  - `tier-trends/` - Tier trends analysis
  - `tier-stats/` - Tier stats table
  - `deaths-radar/` - Deaths radar chart
  - `time-series/` - Time series charts
  - `shared/` - Shared analysis utilities
- `src/features/data-tracking/shared/` - Shared game data components

### Removed Directories
- `src/features/data-tracking/components/` ✅
- `src/features/data-tracking/hooks/` ✅
- `src/features/data-tracking/logic/` ✅
- `src/features/data-tracking/utils/` ✅
- `src/features/data-tracking/types/` ✅

### Files Migrated: [Total Count]
### Total Stories: 10
### Migration Duration: [Start Date] - [End Date]
```

## Migration Rules

**CRITICAL**:
- **Verify first, delete last** - only remove directories after confirming they're empty
- **Document orphaned files** - don't delete without review
- **Full testing** - test every major feature before considering migration complete
- **Update documentation** - ensure future developers understand new structure
- **One PR** - all cleanup changes in a single atomic commit

## Potential Issues and Solutions

### Issue 1: Circular Dependencies Discovered

**Symptom**: Import errors due to circular dependencies between features

**Solution**:
1. Identify circular dependency chain
2. Extract shared types/interfaces to `shared/types/`
3. Document dependency graph for future reference

### Issue 2: Dynamic Imports Not Caught by Grep

**Symptom**: Build fails with "module not found" despite Grep showing no imports

**Solution**:
1. Search for dynamic imports: `Grep -r "import(" src/`
2. Search for string-based imports: `Grep -r "require\|import" src/`
3. Update dynamic import paths

### Issue 3: Test Imports Using Relative Paths

**Symptom**: Tests fail after moving files, but application code works

**Solution**:
1. Search for relative imports in tests: `Grep -r "from '\.\." src/**/*.test.ts*`
2. Update to use absolute imports with `@/` alias

### Issue 4: Too Much Shared Code

**Symptom**: `data-tracking/shared/` has 20+ files

**Solution**:
1. Re-evaluate what's truly shared (used by 3+ features)
2. Move feature-specific code back to features
3. Consider further sub-organization within `shared/`

### Issue 5: Too Little Shared Code

**Symptom**: `data-tracking/shared/` has <3 files

**Solution**:
1. Consider removing `data-tracking/` entirely
2. Move remaining shared code to `src/shared/game-data/`
3. Update all imports

## Success Criteria

- [ ] All old directories (`components/`, `hooks/`, `logic/`, `utils/`, `types/`) removed or empty
- [ ] All remaining shared code organized in `shared/` subdirectory
- [ ] Zero import errors in entire codebase
- [ ] All tests passing (unit, integration, e2e if applicable)
- [ ] Application builds successfully
- [ ] All features manually tested and working identically to before
- [ ] No orphaned files (or orphaned files documented for review)
- [ ] Documentation updated with new structure
- [ ] Migration summary document created
- [ ] No logic or behavior changes introduced
- [ ] Developer can navigate new structure intuitively

## Post-Migration Activities

After this story is complete:

1. **Celebrate!** - This was a significant undertaking
2. **Monitor for issues** - Watch for bug reports related to missing functionality
3. **Gather feedback** - Ask developers about new structure usability
4. **Refine if needed** - Small adjustments may be needed based on usage patterns
5. **Update onboarding docs** - Ensure new developers understand structure
6. **Consider future improvements** - Document ideas for further refinement

## Notes

- This is the **final** migration story - no rush, thoroughness is critical
- Full application testing is mandatory - don't skip manual testing
- Document everything - decisions, orphaned files, issues encountered
- If in doubt about deleting a file, keep it and document for review
- Better to have a few extra files in `shared/` than to break functionality
