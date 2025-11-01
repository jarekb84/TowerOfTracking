# Migration Story 12: Navigation, Theming, and Hooks Reorganization

## Status: Planning

## Problem Statement

Several areas of the codebase still use type-based organization instead of the feature-based pattern established throughout the rest of the codebase:

1. **Navigation Feature** (`src/features/navigation/`):
   - Uses type-based directories: `components/`, `config/`, `context/`, `hooks/`
   - Has separate `types/` directory
   - Not following feature-based pattern used elsewhere

2. **Theming Feature** (`src/features/theming/`):
   - Similar type-based structure
   - Inconsistent with other features

3. **Scattered Hook Directories**:
   - `src/hooks/` contains `use-debounce.ts`
   - `src/shared/hooks/` contains `use-debounce.ts` and `use-viewport.ts`
   - Unclear organization for common utility hooks

## Goal

Reorganize navigation and theming features to follow the domain/purpose-based pattern used throughout the codebase, and consolidate scattered hook files into appropriate locations.

## Affected Areas

### Navigation Feature
```
src/features/navigation/
├── components/          # Type-based - needs reorganization
├── config/
├── context/
├── hooks/
└── types/
```

### Theming Feature
```
src/features/theming/
├── [type-based structure]
```

### Hook Directories
```
src/hooks/
└── use-debounce.ts

src/shared/hooks/
├── use-debounce.ts
└── use-viewport.ts
```

## Target Organization Pattern

Following the pattern established in features like analytics (tier-trends) and data-import:

### Navigation Feature - Target Structure
```
src/features/navigation/
├── app-wrapper.tsx              # Main navigation component/wrapper
├── navigation-config.ts         # Configuration
├── navigation-context.tsx       # Context provider
├── use-navigation.ts            # Main navigation hook
├── types.ts                     # Navigation-specific types
│
├── [sub-features as needed]/   # If 3+ related files exist
    ├── [feature-files].tsx
    └── [feature-hooks].ts
```

### Theming Feature - Target Structure
```
src/features/theming/
├── theme-provider.tsx           # Main theme component
├── theme-config.ts              # Theme configuration
├── use-theme.ts                 # Theme hook
├── types.ts                     # Theme-specific types
│
├── [sub-features as needed]/
```

### Utility Hooks - Target Structure
```
src/shared/hooks/                # Common reusable hooks
├── use-debounce.ts             # Consolidated (remove duplicate)
├── use-debounce.test.tsx       # Hook tests
├── use-viewport.ts
└── use-viewport.test.tsx
```

**Rationale**: These are truly cross-cutting utility hooks used across multiple features, not specific to any single domain.

## Implementation Plan

### Phase 1: Analyze Current State

1. **Examine Navigation Feature**:
   - [ ] List all files in `src/features/navigation/`
   - [ ] Identify relationships between files
   - [ ] Determine if sub-features exist (3+ related files)
   - [ ] Map current imports/exports

2. **Examine Theming Feature**:
   - [ ] List all files in `src/features/theming/`
   - [ ] Identify relationships
   - [ ] Determine structure needs

3. **Examine Hook Files**:
   - [ ] Compare `src/hooks/use-debounce.ts` vs `src/shared/hooks/use-debounce.ts`
   - [ ] Identify which version is actively used
   - [ ] Check usage patterns across codebase
   - [ ] Verify if tests exist for hooks

### Phase 2: Navigation Feature Reorganization

1. **Flatten Type-Based Structure**:
   - [ ] Move files from `components/`, `hooks/`, `context/`, `config/` to feature root
   - [ ] Consolidate `types/` into `types.ts` at feature root
   - [ ] Apply consistent naming (e.g., `navigation-config.ts`, `use-navigation.ts`)

2. **Create Sub-Features if Needed**:
   - [ ] If 3+ files share clear concept → create subdirectory
   - [ ] Apply same pattern as `tier-trends/filters/`, `tier-trends/table/`

3. **Update Imports**:
   - [ ] Update all import paths referencing navigation files
   - [ ] Verify build succeeds
   - [ ] Run tests

### Phase 3: Theming Feature Reorganization

1. **Apply Same Pattern**:
   - [ ] Flatten type-based directories
   - [ ] Move files to feature root with consistent naming
   - [ ] Consolidate types

2. **Update Imports**:
   - [ ] Update import paths
   - [ ] Verify build and tests

### Phase 4: Hooks Directory Consolidation

1. **Identify Duplicate `use-debounce.ts`**:
   - [ ] Determine which version to keep (likely `src/shared/hooks/`)
   - [ ] Check for implementation differences
   - [ ] Remove duplicate from `src/hooks/`

2. **Consolidate to `src/shared/hooks/`**:
   - [ ] Move/keep `use-debounce.ts` in `src/shared/hooks/`
   - [ ] Move/keep `use-viewport.ts` in `src/shared/hooks/`
   - [ ] Add/verify tests exist for both hooks

3. **Remove `src/hooks/` directory**:
   - [ ] After consolidation, delete `src/hooks/` directory
   - [ ] Update any imports pointing to old location

4. **Update Imports**:
   - [ ] Find all imports of `use-debounce` and `use-viewport`
   - [ ] Update to `src/shared/hooks/` location
   - [ ] Verify build succeeds

### Phase 5: Verification

1. **Build & Test**:
   - [ ] Run `npm run build` - must succeed
   - [ ] Run `npm run test` - all tests pass
   - [ ] Run `npm run lint` - no violations

2. **Import Validation**:
   - [ ] Search for any remaining imports from old locations
   - [ ] Verify no broken imports exist

3. **Manual Testing**:
   - [ ] Verify navigation functionality works
   - [ ] Verify theming functionality works
   - [ ] Verify debounce and viewport hooks work in consuming components

## Success Criteria

- ✅ Navigation feature uses feature-based organization (no `components/`, `hooks/`, etc.)
- ✅ Theming feature uses feature-based organization
- ✅ Only ONE `use-debounce.ts` exists (in `src/shared/hooks/`)
- ✅ Only ONE `use-viewport.ts` exists (in `src/shared/hooks/`)
- ✅ `src/hooks/` directory removed entirely
- ✅ All tests pass
- ✅ Build succeeds
- ✅ No broken imports
- ✅ File organization consistent with rest of codebase (tier-trends, data-import, etc.)

## Rollback Plan

If issues arise:
1. Revert git commit(s) for this migration
2. All imports automatically restored to previous working state
3. Build and tests should immediately work

## Notes

**Applying Established Patterns**:
- Use same approach as tier-trends reorganization (Migration Story 10)
- Use same approach as data-import cleanup (Migration Story 11)
- Follow feature-based organization doctrine from `.ruler/04-engineering-standards.md`

**Boy Scout Rule**:
- Only reorganize files within navigation and theming features
- Don't reorganize unrelated code
- Keep changes focused and incremental

**Testing Strategy**:
- Hooks should have tests (add if missing)
- Integration tests for navigation and theming already exist
- No new functionality - behavior-preserving refactoring only

## Estimated Effort

- Analysis: 30 minutes
- Navigation reorganization: 1 hour
- Theming reorganization: 1 hour
- Hooks consolidation: 30 minutes
- Import updates and verification: 1 hour
- **Total**: ~4 hours

## Dependencies

- None (can be done independently)

## Related Stories

- Migration Story 10: Game Run Types Decomposition (established feature-based pattern)
- Migration Story 11: Data Import Cleanup (applied pattern to data-import)
- This story: Apply pattern to navigation, theming, and hooks

---

## Completion Checklist

- [ ] Phase 1: Current state analysis complete
- [ ] Phase 2: Navigation reorganized
- [ ] Phase 3: Theming reorganized
- [ ] Phase 4: Hooks consolidated to `src/shared/hooks/`
- [ ] Phase 5: Verification complete (build, tests, imports)
- [ ] Documentation: Update this story with "COMPLETED" status
- [ ] Git: Commit with message following pattern from previous migration stories
